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

        const guildName = config.guildName;

        let nameToSearch;

        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('username');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId.split(':')[1];
        }

        let player = await database.findPlayer(nameToSearch, force);

        if (player != null && player.message === 'Multiple possibilities found') {
            const possiblePlayers = [];

            for (let i = 0; i < player.playerUuids.length; i++) {
                const uuid = player.playerUuids[i];
                const username = player.playerUsernames[i];

                if (player.playerGuildNames[i] === guildName) {
                    possiblePlayers.push({ uuid: uuid, username: username });
                }
            }

            if (possiblePlayers.length === 1) {
                player = possiblePlayers[0];
            } else {
                return {
                    playerUuids: player.playerUuids,
                    playerUsernames: player.playerUsernames,
                    playerRanks: player.playerRanks,
                    playerGuildRanks: player.playerGuildRanks,
                    playerGuildNames: player.playerGuildNames,
                };
            }
        }

        let playerJson;

        // If a player was found, look for UUID to get guaranteed results, otherwise look for the name input
        if (player) {
            playerJson = (await axios.get(`https://api.wynncraft.com/v3/player/${player.uuid}?fullResult=True`)).data;
        } else {
            try {
                playerJson = (await axios.get(`https://api.wynncraft.com/v3/player/${nameToSearch}?fullResult=True`)).data;
            } catch (err) {
                // 300 indicates a multi selector
                if (err.response.status === 300) {
                    return {
                        playerUuids: Object.keys(err.response.data),
                        playerUsernames: Object.values(err.response.data).map((entry) => entry.storedName),
                        playerRanks: [],
                        playerGuildRanks: [],
                        playerGuildNames: [],
                    };
                }
            }
        }

        // FIXME: Handle errors better
        if (!playerJson || !playerJson.username) {
            return ({ username: playerJson.username, unableToPromote: 'error' });
        }

        if (!playerJson.guild || playerJson.guild.name !== guildName) {
            return ({ username: playerJson.username, unableToPromote: 'guild' });
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

        const promotionExceptions = config['promotionExceptions'] !== undefined ? config['promotionExceptions'] : {};

        const exemptUsernames = Object.keys(promotionExceptions);

        if (exemptUsernames.includes(playerJson.username)) {
            return ({ username: playerJson.username, unableToPromote: promotionExceptions[playerJson.username] });
        }

        const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${playerJson.guild.uuid}?identifier=uuid`)).data;

        // FIXME: Handle errors better
        if (!guildJson || !guildJson.name) {
            return ({ username: playerJson.username, unableToPromote: 'error' });
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
                }
            }
        }

        if (contributionPos === -1) {
            return ({ username: playerJson.username, unableToPromote: 'error' });
        }

        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
        const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
        const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const memberPlaytime = await database.getAveragePlaytime(playerJson.uuid);

        const now = new Date();
        const timeDifference = now - joinTimestamp;
        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const daysInGuild = Math.floor(hours / 24);

        const serverMember = await utilities.findDiscordUser(interaction.guild.members.cache.values(), playerJson.username);

        let hasBuildRole = false;
        let hasEcoRole = false;

        if (serverMember) {
            const serverMemberRoles = serverMember.roles.cache;

            for (const role of serverMemberRoles.values()) {
                if (role === ecoRole) {
                    hasEcoRole = true;
                } else if (warBuildRoles.includes(role)) {
                    hasBuildRole = true;
                }

                if (hasBuildRole && hasEcoRole) {
                    break;
                }
            }
        }

        let promotionRequirements;
        let timeRequirement;
        let requirementsCount;

        let XPRequirement;
        let levelRequirement;
        let contributionRequirement;
        let optionalTimeRequirement;
        let warsRequirement;
        let weeklyPlaytimeRequirement ;

        let nextGuildRank;

        if (guildRank === 'owner') {
            return ({ uuid: playerJson.uuid, username: playerJson.username, unableToPromote: 'owner' });
        } else if (guildRank === 'chief') {
            return ({ uuid: playerJson.uuid, username: playerJson.username, unableToPromote: 'chief' });
        } else if (guildRank === 'strategist') {
            promotionRequirements = config.chiefPromotionRequirement;
            timeRequirement = config.chiefTimeRequirement;
            requirementsCount = config.chiefRequirementsCount;

            XPRequirement = config.chiefXPRequirement;
            levelRequirement = config.chiefLevelRequirement;
            contributionRequirement = config.chiefContributorRequirement;
            optionalTimeRequirement = config.chiefOptionalTimeRequirement;
            warsRequirement = config.chiefWarsRequirement;
            weeklyPlaytimeRequirement = config.chiefWeeklyPlaytimeRequirement;

            nextGuildRank = 'Chief';
        } else if (guildRank === 'captain') {
            promotionRequirements = config.strategistPromotionRequirement;
            timeRequirement = config.strategistTimeRequirement;
            requirementsCount = config.strategistRequirementsCount;

            XPRequirement = config.strategistXPRequirement;
            levelRequirement = config.strategistLevelRequirement;
            contributionRequirement = config.strategistContributorRequirement;
            optionalTimeRequirement = config.strategistOptionalTimeRequirement;
            warsRequirement = config.strategistWarsRequirement;
            weeklyPlaytimeRequirement = config.strategistWeeklyPlaytimeRequirement;

            nextGuildRank = 'Strategist';
        } else if (guildRank === 'recruiter') {
            promotionRequirements = config.captainPromotionRequirement;
            timeRequirement = config.captainTimeRequirement;
            requirementsCount = config.captainRequirementsCount;

            XPRequirement = config.captainXPRequirement;
            levelRequirement = config.captainLevelRequirement;
            contributionRequirement = config.captainContributorRequirement;
            optionalTimeRequirement = config.captainOptionalTimeRequirement;
            warsRequirement = config.captainWarsRequirement;
            weeklyPlaytimeRequirement = config.captainWeeklyPlaytimeRequirement;

            nextGuildRank = 'Captain';
        } else if (guildRank === 'recruit') {
            promotionRequirements = config.recruiterPromotionRequirement;
            timeRequirement = config.recruiterTimeRequirement;
            requirementsCount = config.recruiterRequirementsCount;

            XPRequirement = config.recruiterXPRequirement;
            levelRequirement = config.recruiterLevelRequirement;
            contributionRequirement = config.recruiterContributorRequirement;
            optionalTimeRequirement = config.recruiterOptionalTimeRequirement;
            warsRequirement = config.recruiterWarsRequirement;
            weeklyPlaytimeRequirement = config.recruiterWeeklyPlaytimeRequirement;

            nextGuildRank = 'Recruiter';
        }

        // Add one extra for the forced time requirement
        requirementsCount += 1;

        let metRequirements = 0;

        if (daysInGuild >= timeRequirement) {
            metRequirements++;
        }

        const requirements = [];

        if (promotionRequirements.includes(PromotionValue.XP)) {
            requirements.push(new PromotionRequirement(PromotionValue.XP, contributedGuildXP, XPRequirement));

            if (contributedGuildXP >= XPRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.LEVEL)) {
            requirements.push(new PromotionRequirement(PromotionValue.LEVEL, highestCharcterLevel, levelRequirement));

            if (highestCharcterLevel >= levelRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.TOP)) {
            requirements.push(new PromotionRequirement(PromotionValue.TOP, contributionPos, contributionRequirement));

            if (contributionPos <= contributionRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.TIME)) {
            requirements.push(new PromotionRequirement(PromotionValue.TIME, daysInGuild, optionalTimeRequirement));

            if (daysInGuild >= optionalTimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.WARS)) {
            requirements.push(new PromotionRequirement(PromotionValue.WARS, wars, warsRequirement));

            if (wars >= warsRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.BUILD)) {
            requirements.push(new PromotionRequirement(PromotionValue.BUILD, hasBuildRole ? 1 : 0, 1));

            if (hasBuildRole) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.PLAYTIME)) {
            requirements.push(new PromotionRequirement(PromotionValue.PLAYTIME, memberPlaytime, weeklyPlaytimeRequirement));

            if (memberPlaytime >= weeklyPlaytimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements.includes(PromotionValue.ECO)) {
            requirements.push(new PromotionRequirement(PromotionValue.ECO, hasEcoRole ? 1 : 0, 1));

            if (hasEcoRole) {
                metRequirements++;
            }
        }

        return ({
            uuid: playerJson.uuid,
            username: playerJson.username,
            guildRank: guildRank.charAt(0).toUpperCase() + guildRank.slice(1),
            nextGuildRank: nextGuildRank,
            requirementsCount: requirementsCount,
            metRequirements: metRequirements,
            daysInGuild: daysInGuild,
            timeRequirement: timeRequirement,
            requirements: requirements,
        });
    } catch (error) {
        console.error(error);

        let username;

        if (interaction.options !== undefined) {
            username = interaction.options.getString('username');
        } else if (interaction.customId) {
            username = interaction.customId;
        }

        return ({ username: username, unableToPromote: 'error' });
    }
}

module.exports = promotionProgress;
