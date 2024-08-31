const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');

async function playerStats(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('username');
    } else if (interaction.customId) {
        nameToSearch = interaction.customId.split(':')[1];
    }

    const player = await database.findPlayer(nameToSearch, force);

    if (player && player.message === 'Multiple possibilities found') {
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
            return {
                username: '',
            };
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
                return {
                    username: '',
                };
            }
        }
    }

    const playerJson = response.data;

    if (!playerJson || !playerJson.username) {
        return {
            username: '',
        };
    }

    let guild = null;
    let guildUuid = null;
    let guildRank = null;
    let contributionPosition = null;
    let contributedXp = null;
    let timeInGuild = null;

    if (playerJson.guild) {
        guildUuid = playerJson.guild.uuid;

        await utilities.waitForRateLimit();

        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/guild/uuid/${guildUuid}?identifier=uuid`,
            );
        } catch (error) {
            console.error(error);
        }

        if (response) {
            utilities.updateRateLimit(
                response.headers['ratelimit-remaining'],
                response.headers['ratelimit-reset'],
            );
    
            const guildJson = response.data;
    
            if (guildJson && guildJson.name) {
                guild = `[${playerJson.guild.prefix}] ${playerJson.guild.name} Lvl ${guildJson.level}`;

                for (const rank in guildJson.members) {
                    if (rank === 'total') continue;
        
                    const rankMembers = guildJson.members[rank];
        
                    for (const member in rankMembers) {
                        const guildMember = rankMembers[member];

                        if (member === playerJson.uuid) {
                            guildRank = `${rank.charAt(0).toUpperCase()}${rank.slice(1).toLowerCase()}`;
                            contributionPosition = guildMember.contributionRank;
                            contributedXp = guildMember.contributed.toLocaleString();
                            timeInGuild = utilities.getTimeSince(guildMember.joined);
                            break;
                        }
                    }

                    if (guildRank) {
                        break;
                    }
                }
            }
        }
    }

    let highestCharcterLevel = 0;

    for (const character in playerJson.characters) {
        const characterJson = playerJson.characters[character];

        // If character level is higher than current tracked highest, set as new highest
        if (characterJson.level > highestCharcterLevel) {
            highestCharcterLevel = characterJson.level;
        }
    }

    const veteran = playerJson.veteran ? playerJson.veteran : false;

    database.updatePlayer({
        uuid: playerJson.uuid,
        username: playerJson.username,
        guildUuid: guildUuid,
        guildRank: guildRank.toLocaleLowerCase(),
        online: playerJson.online,
        lastLogin: playerJson.lastJoin,
        supportRank: playerJson.supportRank,
        veteran: veteran,
        serverRank: playerJson.rank,
        wars: playerJson.globalData.wars,
        highestCharcterLevel: highestCharcterLevel,
    });

    // Temporary, remove if Wynn ever fixes the name changing guild bug
    let username = playerJson.username;

    if (username === 'Owen_Rocks_3') {
        username = 'Amber_Rocks_3';
    }

    let supportRank = 'None';

    if (playerJson.supportRank) {
        if (playerJson.supportRank === 'vip') {
            supportRank = 'VIP';
        } else if (playerJson.supportRank === 'vipplus') {
            supportRank = 'VIP+';
        } else {
            supportRank =
                playerJson.supportRank.charAt(0).toUpperCase() +
                playerJson.supportRank.slice(1);
        }
    }

    let lastSeen;

    if (playerJson.online) {
        lastSeen = `Online on ${playerJson.server}`;
    } else {
        const lastJoin = utilities.getTimeSince(playerJson.lastJoin);
        lastSeen = `${lastJoin} ago`;
    }

    const totalPlaytime = `${playerJson.playtime} hours`;
    const weeklyPlaytimeCount = await database.getAveragePlaytime(playerJson.uuid);
    const currentWeekPlaytimeCount = await database.getWeeklyPlaytime(playerJson.uuid);
    const weeklyPlaytime = `${weeklyPlaytimeCount.toFixed(2)} hours`;
    const currentWeekPlaytime = `${currentWeekPlaytimeCount.toFixed(2)} hours`;

    return {
        uuid: playerJson.uuid,
        username: username.replaceAll('_', '\\_'),
        supportRank: supportRank,
        lastSeen: lastSeen,
        wars: playerJson.globalData.wars.toLocaleString(),
        totalLevel: playerJson.globalData.totalLevel.toLocaleString(),
        totalPlaytime: totalPlaytime,
        weeklyPlaytime: weeklyPlaytime,
        currentWeekPlaytime: currentWeekPlaytime,
        guild: guild,
        guildRank: guildRank,
        contributionPosition: contributionPosition,
        contributedXp: contributedXp,
        timeInGuild: timeInGuild,
    };
}

module.exports = playerStats;
