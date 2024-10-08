const fs = require('fs');
const path = require('path');
const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');
const PromotionValue = require('../values/PromotionValue');
const PromotionRequirement = require('../message_objects/PromotionRequirement');

async function promotionProgress(interaction, force = false) {
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildUuid = config.guild;

        let nameToSearch;

        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('username');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId.split(':')[1];
        }

        const player = await database.findPlayer(
            nameToSearch,
            force,
            guildUuid,
        );

        if (
            player != null &&
            player.message === 'Multiple possibilities found'
        ) {
            return {
                playerUuids: player.playerUuids,
                playerUsernames: player.playerUsernames,
                playerRanks: player.playerRanks,
                playerGuildRanks: player.playerGuildRanks,
                playerGuildNames: player.playerGuildNames,
            };
        }

        await utilities.waitForRateLimit();

        let response;

        // If a player was found, look for UUID to get guaranteed results, otherwise look for the name input
        if (player) {
            try {
                response = await axios.get(
                    `https://api.wynncraft.com/v3/player/${player.uuid}?fullResult=True`,
                );
            } catch (error) {
                console.error(error);
                return { username: nameToSearch, unableToPromote: 'error' };
            }
        } else {
            try {
                response = await axios.get(
                    `https://api.wynncraft.com/v3/player/${nameToSearch}?fullResult=True`,
                );
            } catch (error) {
                // 300 indicates a multi selector
                if (error.response.status === 300) {
                    return {
                        playerUuids: Object.keys(error.response.data),
                        playerUsernames: Object.values(error.response.data).map(
                            (entry) => entry.storedName,
                        ),
                        playerRanks: [],
                        playerGuildRanks: [],
                        playerGuildNames: [],
                    };
                } else {
                    console.error(error);
                    return { username: nameToSearch, unableToPromote: 'error' };
                }
            }
        }

        utilities.updateRateLimit(
            response.headers['ratelimit-remaining'],
            response.headers['ratelimit-reset'],
        );

        const playerJson = response.data;

        if (!playerJson || !playerJson.username) {
            return { username: nameToSearch, unableToPromote: 'error' };
        }

        if (!playerJson.guild || playerJson.guild.uuid !== guildUuid) {
            return { username: playerJson.username, unableToPromote: 'guild' };
        }

        let highestCharcterLevel = 0;
        const wars = playerJson.globalData.wars;

        for (const character in playerJson.characters) {
            const characterJson = playerJson.characters[character];

            // If character level is higher than current tracked highest, set as new highest
            if (characterJson.level > highestCharcterLevel) {
                highestCharcterLevel = characterJson.level;
            }
        }

        const promotionExceptions =
            config['promotionExceptions'] !== undefined
                ? config['promotionExceptions']
                : {};

        const exemptUsernames = Object.keys(promotionExceptions);

        if (exemptUsernames.includes(playerJson.uuid)) {
            return {
                username: playerJson.username,
                unableToPromote: promotionExceptions[playerJson.uuid],
            };
        }

        await utilities.waitForRateLimit();

        let guildResponse;

        try {
            guildResponse = await axios.get(
                `https://api.wynncraft.com/v3/guild/uuid/${playerJson.guild.uuid}?identifier=uuid`,
            );
        } catch (error) {
            console.error(error);
            return { username: playerJson.username, unableToPromote: 'error' };
        }

        utilities.updateRateLimit(
            guildResponse.headers['ratelimit-remaining'],
            guildResponse.headers['ratelimit-reset'],
        );

        const guildJson = guildResponse.data;

        if (!guildJson || !guildJson.name) {
            return { username: playerJson.username, unableToPromote: 'error' };
        }

        let contributionPos = -1;
        let joinTimestamp;
        let guildRank;
        let contributedGuildXP;

        for (const rank in guildJson.members) {
            if (rank === 'total') continue;

            const rankMembers = guildJson.members[rank];

            for (const member in rankMembers) {
                const guildMember = rankMembers[member];

                if (member === playerJson.uuid) {
                    guildRank = rank;
                    contributionPos = guildMember.contributionRank;
                    joinTimestamp = new Date(guildMember.joined);
                    contributedGuildXP = guildMember.contributed;
                    break;
                }
            }

            if (contributionPos !== -1) {
                break;
            }
        }

        const veteran = playerJson.veteran ? playerJson.veteran : false;

        database.updatePlayer({
            uuid: playerJson.uuid,
            username: playerJson.username,
            guildUuid: playerJson.guild.uuid,
            guildRank: guildRank,
            online: playerJson.online,
            lastLogin: playerJson.lastJoin,
            supportRank: playerJson.supportRank,
            veteran: veteran,
            serverRank: playerJson.rank,
            wars: playerJson.globalData.wars,
            highestCharcterLevel: highestCharcterLevel,
        });

        const verifiedRole = interaction.guild.roles.cache.get(
            config['verifiedRole'],
        );
        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
        const healerRole = interaction.guild.roles.cache.get(
            config['healerRole'],
        );
        const damageRole = interaction.guild.roles.cache.get(
            config['damageRole'],
        );
        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const memberPlaytime = await database.getAveragePlaytime(
            playerJson.uuid,
        );

        const now = new Date();
        const timeDifference = now - joinTimestamp;
        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const daysInGuild = Math.floor(hours / 24);

        const serverMember = await utilities.findDiscordUser(
            interaction.guild.members.cache.values(),
            playerJson.username,
        );

        let hasBuildRole = false;
        let hasEcoRole = false;
        let hasVerifiedRole = false;

        if (serverMember) {
            const serverMemberRoles = serverMember.roles.cache;

            for (const role of serverMemberRoles.values()) {
                if (role == verifiedRole) {
                    hasVerifiedRole = true;
                } else if (role === ecoRole) {
                    hasEcoRole = true;
                } else if (warBuildRoles.includes(role)) {
                    hasBuildRole = true;
                }

                if (hasVerifiedRole && hasBuildRole && hasEcoRole) {
                    break;
                }
            }
        }

        let promotionRequirements;
        let timeRequirement;
        let verifiedRequirement;
        let requirementsCount;

        let XPRequirement;
        let levelRequirement;
        let contributionRequirement;
        let optionalTimeRequirement;
        let warsRequirement;
        let weeklyPlaytimeRequirement;

        let nextGuildRank;

        if (guildRank === 'owner') {
            return {
                uuid: playerJson.uuid,
                username: playerJson.username,
                unableToPromote: 'owner',
            };
        } else if (guildRank === 'chief') {
            return {
                uuid: playerJson.uuid,
                username: playerJson.username,
                unableToPromote: 'chief',
            };
        } else if (guildRank === 'strategist') {
            promotionRequirements = config.chiefPromotionRequirement;
            timeRequirement = config.chiefTimeRequirement;
            verifiedRequirement =
                promotionRequirements[PromotionValue.VERIFIED];
            requirementsCount = config.chiefRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement =
                promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement =
                promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Chief';
        } else if (guildRank === 'captain') {
            promotionRequirements = config.strategistPromotionRequirement;
            timeRequirement = config.strategistTimeRequirement;
            verifiedRequirement =
                promotionRequirements[PromotionValue.VERIFIED];
            requirementsCount = config.strategistRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement =
                promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement =
                promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Strategist';
        } else if (guildRank === 'recruiter') {
            promotionRequirements = config.captainPromotionRequirement;
            timeRequirement = config.captainTimeRequirement;
            verifiedRequirement =
                promotionRequirements[PromotionValue.VERIFIED];
            requirementsCount = config.captainRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement =
                promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement =
                promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Captain';
        } else if (guildRank === 'recruit') {
            promotionRequirements = config.recruiterPromotionRequirement;
            timeRequirement = config.recruiterTimeRequirement;
            verifiedRequirement =
                promotionRequirements[PromotionValue.VERIFIED];
            requirementsCount = config.recruiterRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement =
                promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement =
                promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Recruiter';
        }

        if (Object.keys(promotionRequirements).length < requirementsCount) {
            return {
                username: playerJson.username,
                unableToPromote: 'missing',
            };
        }

        let forcedRequirementsCount;

        if (verifiedRequirement) {
            forcedRequirementsCount = 2;
        } else {
            forcedRequirementsCount = 1;
        }

        let metForcedRequirements = 0;
        let metRequirements = 0;

        if (daysInGuild >= timeRequirement) {
            metForcedRequirements++;
        }

        if (verifiedRequirement && hasVerifiedRole) {
            metForcedRequirements++;
        }

        const requirements = [];

        if (promotionRequirements[PromotionValue.XP]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.XP,
                    contributedGuildXP,
                    XPRequirement,
                ),
            );

            if (contributedGuildXP >= XPRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.LEVEL]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.LEVEL,
                    highestCharcterLevel,
                    levelRequirement,
                ),
            );

            if (highestCharcterLevel >= levelRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.TOP]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.TOP,
                    contributionPos,
                    contributionRequirement,
                ),
            );

            if (contributionPos <= contributionRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.TIME]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.TIME,
                    daysInGuild,
                    optionalTimeRequirement,
                ),
            );

            if (daysInGuild >= optionalTimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.WARS]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.WARS,
                    wars,
                    warsRequirement,
                ),
            );

            if (wars >= warsRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.BUILD]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.BUILD,
                    hasBuildRole ? 1 : 0,
                    1,
                ),
            );

            if (hasBuildRole) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.PLAYTIME]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.PLAYTIME,
                    memberPlaytime.toFixed(2),
                    weeklyPlaytimeRequirement,
                ),
            );

            if (memberPlaytime >= weeklyPlaytimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.ECO]) {
            requirements.push(
                new PromotionRequirement(
                    PromotionValue.ECO,
                    hasEcoRole ? 1 : 0,
                    1,
                ),
            );

            if (hasEcoRole) {
                metRequirements++;
            }
        }

        return {
            uuid: playerJson.uuid,
            username: playerJson.username,
            guildRank: guildRank.charAt(0).toUpperCase() + guildRank.slice(1),
            nextGuildRank: nextGuildRank,
            forcedRequirementsCount: forcedRequirementsCount,
            requirementsCount: requirementsCount,
            metForcedRequirements: metForcedRequirements,
            metRequirements: metRequirements,
            daysInGuild: daysInGuild,
            verifiedRequirement: verifiedRequirement,
            hasVerifiedRole: hasVerifiedRole,
            timeRequirement: timeRequirement,
            requirements: requirements,
        };
    } catch (error) {
        console.error(error);

        let username;

        if (interaction.options !== undefined) {
            username = interaction.options.getString('username');
        } else if (interaction.customId) {
            username = interaction.customId;
        }

        return { username: username, unableToPromote: 'error' };
    }
}

module.exports = promotionProgress;
