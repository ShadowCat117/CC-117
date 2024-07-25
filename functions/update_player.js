const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');

async function updatePlayer(interaction, force = false) {
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

    await utilities.waitForRateLimit();

    let playerJson;

    // If a player was found, look for UUID to get guaranteed results, otherwise look for the name input
    if (player) {
        const response = await axios.get(`https://api.wynncraft.com/v3/player/${player.uuid}?fullResult=True`);
        utilities.updateRateLimit(response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);
        playerJson = response.data;
    } else {
        try {
            const response = await axios.get(`https://api.wynncraft.com/v3/player/${nameToSearch}?fullResult=True`);
            utilities.updateRateLimit(response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);
            playerJson = response.data;
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

    if (!playerJson || !playerJson.username) {
        return ({ username: '' });
    }

    const veteran = playerJson.veteran ? playerJson.veteran : false;
    let highestCharcterLevel = 0;

    for (const character in playerJson.characters) {
        const characterJson = playerJson.characters[character];

        // If character level is higher than current tracked highest, set as new highest
        if (characterJson.level > highestCharcterLevel) {
            highestCharcterLevel = characterJson.level;
        }
    }

    let guildUuid = null;
    let guildRank = null;

    if (playerJson.guild) {
        await utilities.waitForRateLimit();
        const response = await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${playerJson.guild.uuid}?identifier=uuid`);

        utilities.updateRateLimit(response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);
        const guildJson = response.data;

        if (!guildJson || !guildJson.name) {
            return ({ username: playerJson.username, error: 'Failed to retrieve guild info' });
        }

        guildUuid = guildJson.uuid;

        for (const rank in guildJson.members) {
            if (rank === 'total') continue;
    
            const rankMembers = guildJson.members[rank];
    
            for (const member in rankMembers) {               
                if (member === playerJson.uuid) {
                    guildRank = rank;
                    break;
                }
            }

            if (guildRank) {
                break;
            }
        }
    }

    database.updatePlayer({
        uuid: playerJson.uuid,
        username: playerJson.username,
        guildUuid: guildUuid,
        guildRank: guildRank,
        online: playerJson.online,
        lastLogin: playerJson.lastJoin,
        supportRank: playerJson.supportRank,
        veteran: veteran,
        serverRank: playerJson.rank,
        wars: playerJson.globalData.wars,
        highestCharcterLevel: highestCharcterLevel,
    });

    return ({ username: playerJson.username });
}

module.exports = updatePlayer;
