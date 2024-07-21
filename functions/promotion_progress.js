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

        const player = await database.findPlayer(nameToSearch, force);

        if (player != null && player.message === 'Multiple possibilities found') {
            return {
                playerUuids: player.playerUuids,
                playerUsernames: player.playerUsernames,
                playerRanks: player.playerRanks,
                playerGuildRanks: player.playerGuildRanks,
                playerGuildNames: player.playerGuildNames,
            };
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

        if (!playerJson.guild || playerJson.guild.uuid !== guildUuid) {
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

        if (exemptUsernames.includes(playerJson.uuid)) {
            return ({ username: playerJson.username, unableToPromote: promotionExceptions[playerJson.uuid] });
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

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement = promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement = promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Chief';
        } else if (guildRank === 'captain') {
            promotionRequirements = config.strategistPromotionRequirement;
            timeRequirement = config.strategistTimeRequirement;
            requirementsCount = config.strategistRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement = promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement = promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Strategist';
        } else if (guildRank === 'recruiter') {
            promotionRequirements = config.captainPromotionRequirement;
            timeRequirement = config.captainTimeRequirement;
            requirementsCount = config.captainRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement = promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement = promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Captain';
        } else if (guildRank === 'recruit') {
            promotionRequirements = config.recruiterPromotionRequirement;
            timeRequirement = config.recruiterTimeRequirement;
            requirementsCount = config.recruiterRequirementsCount;

            XPRequirement = promotionRequirements[PromotionValue.XP];
            levelRequirement = promotionRequirements[PromotionValue.LEVEL];
            contributionRequirement = promotionRequirements[PromotionValue.TOP];
            optionalTimeRequirement = promotionRequirements[PromotionValue.TIME];
            warsRequirement = promotionRequirements[PromotionValue.WARS];
            weeklyPlaytimeRequirement = promotionRequirements[PromotionValue.PLAYTIME];

            nextGuildRank = 'Recruiter';
        }

        // Add one extra for the forced time requirement
        requirementsCount += 1;

        if (Object.keys(promotionRequirements).length < requirementsCount) {
            return ({ username: playerJson.username, unableToPromote: 'missing' });
        }

        let metRequirements = 0;

        if (daysInGuild >= timeRequirement) {
            metRequirements++;
        }

        const requirements = [];

        if (promotionRequirements[PromotionValue.XP]) {
            requirements.push(new PromotionRequirement(PromotionValue.XP, contributedGuildXP, XPRequirement));

            if (contributedGuildXP >= XPRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.LEVEL]) {           
            requirements.push(new PromotionRequirement(PromotionValue.LEVEL, highestCharcterLevel, levelRequirement));

            if (highestCharcterLevel >= levelRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.TOP]) {
            requirements.push(new PromotionRequirement(PromotionValue.TOP, contributionPos, contributionRequirement));

            if (contributionPos <= contributionRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.TIME]) {  
            requirements.push(new PromotionRequirement(PromotionValue.TIME, daysInGuild, optionalTimeRequirement));

            if (daysInGuild >= optionalTimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.WARS]) {
            requirements.push(new PromotionRequirement(PromotionValue.WARS, wars, warsRequirement));

            if (wars >= warsRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.BUILD]) {
            requirements.push(new PromotionRequirement(PromotionValue.BUILD, hasBuildRole ? 1 : 0, 1));

            if (hasBuildRole) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.PLAYTIME]) {
            requirements.push(new PromotionRequirement(PromotionValue.PLAYTIME, memberPlaytime, weeklyPlaytimeRequirement));

            if (memberPlaytime >= weeklyPlaytimeRequirement) {
                metRequirements++;
            }
        }

        if (promotionRequirements[PromotionValue.ECO]) {
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
