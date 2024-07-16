const axios = require('axios');
const applyRoles = require('./apply_roles');
const database = require('../database/database');
const PlayerInfo = require('../message_objects/PlayerInfo');

async function verify(interaction, force = false) {
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
        return ({ username: '' });
    }

    let guildUuid = null;
    let guildName = null;
    let guildPrefix = null;
    let guildRank = null;

    if (playerJson.guild) {
        guildUuid = playerJson.guild.uuid;
        guildName = playerJson.guild.name;
        guildPrefix = playerJson.guild.prefix;
        guildRank = playerJson.guild.rank.toLowerCase();
    }

    const supportRank = playerJson.supportRank;
    const veteran = playerJson.veteran;
    const serverRank = playerJson.rank;

    let highestCharcterLevel = 0;

    for (const character in playerJson.characters) {
        const characterJson = playerJson.characters[character];

        // If character level is higher than current tracked highest, set as new highest
        if (characterJson.level > highestCharcterLevel) {
            highestCharcterLevel = characterJson.level;
        }
    }

    const playerInfo = new PlayerInfo(playerJson.username, guildName, guildPrefix, guildRank, supportRank, veteran, serverRank, highestCharcterLevel);

    const response = await applyRoles(interaction.guild, interaction.member, playerInfo);

    database.updatePlayer({
        uuid: playerJson.uuid,
        username: playerJson.username,
        guildUuid: guildUuid,
        guildRank: guildRank,
        online: playerJson.online,
        lastLogin: playerJson.lastJoin,
        supportRank: supportRank,
        veteran: veteran,
        serverRank: serverRank,
        wars: playerJson.globalData.wars,
        highestCharcterLevel: highestCharcterLevel,
    });

    return ({
        username: playerInfo.username,
        updates: response.updates,
        errors: response.errors,
    });
}

module.exports = verify;
