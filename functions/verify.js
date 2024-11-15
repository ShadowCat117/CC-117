const axios = require('axios');
const applyRoles = require('./apply_roles');
const database = require('../database/database');
const utilities = require('./utilities');
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
            return { username: '' };
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
                return { username: '' };
            }
        }
    }

    const playerJson = response.data;

    if (!playerJson || !playerJson.username) {
        return { username: '' };
    }

    let guildUuid = null;
    let guildPrefix = null;
    let guildRank = null;

    if (playerJson.guild) {
        guildUuid = playerJson.guild.uuid;
        guildPrefix = playerJson.guild.prefix;
        guildRank = playerJson.guild.rank.toLowerCase();
    }

    const supportRank = playerJson.supportRank;
    const veteran = playerJson.veteran ? playerJson.veteran : false;
    const serverRank = playerJson.rank;

    let highestCharacterLevel = 0;

    for (const character in playerJson.characters) {
        const characterJson = playerJson.characters[character];

        // If character level is higher than current tracked highest, set as new highest
        if (characterJson.level > highestCharacterLevel) {
            highestCharacterLevel = characterJson.level;
        }
    }

    const username = playerJson.username;

    const playerInfo = new PlayerInfo(
        username,
        guildUuid,
        guildPrefix,
        guildRank,
        supportRank,
        veteran,
        serverRank,
        highestCharacterLevel,
    );

    const roleResponse = await applyRoles(
        interaction.guild,
        interaction.member,
        playerInfo,
    );

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
        highestCharcterLevel: highestCharacterLevel,
    });

    return {
        username: playerInfo.username,
        updates: roleResponse.updates,
        errors: roleResponse.errors,
    };
}

module.exports = verify;
