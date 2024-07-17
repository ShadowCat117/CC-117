const fs = require('fs');
const path = require('path');
const axios = require('axios');
const database = require('../database/database');

async function updatePlayer(interaction, force = false) {
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
        let joinTimestamp = null;
        let contributedGuildXP = 0;

        if (playerJson.guild) {
            const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${playerJson.guild.uuid}?identifier=uuid`)).data;

            // FIXME: Handle errors better
            if (!guildJson || !guildJson.name) {
                return ({ username: playerJson.username, error: 'Failed to retrieve guild info' });
            }

            guildUuid = guildJson.uuid;

            for (const rank in guildJson.members) {
                if (rank === 'total') continue;
        
                const rankMembers = guildJson.members[rank];
        
                for (const member in rankMembers) {
                    const guildMember = rankMembers[member];
                    
                    if (member === playerJson.uuid) {
                        guildRank = rank;
                        joinTimestamp = guildMember.joined;
                        contributedGuildXP = guildMember.contributed;
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
            contributed: contributedGuildXP,
            guildJoined: joinTimestamp,
            online: playerJson.online,
            lastLogin: playerJson.lastJoin,
            supportRank: playerJson.supportRank,
            veteran: veteran,
            serverRank: playerJson.rank,
            wars: playerJson.globalData.wars,
            highestCharcterLevel: highestCharcterLevel,
        });

        return ({ username: playerJson.username });
    } catch (error) {
        console.error(error);

        let username;

        if (interaction.options !== undefined) {
            username = interaction.options.getString('username');
        } else if (interaction.customId) {
            username = interaction.customId;
        }

        return ({ username: username, error: 'An error occured' });
    }
}

module.exports = updatePlayer;
