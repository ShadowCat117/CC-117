const fs = require('fs');
const path = require('path');
const database = require('../database/database');

async function banPlayer(interaction, force = false, reason = 'Unknown reason') {
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        let nameToSearch;

        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('username');
            reason = interaction.options.getString('reason');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId.split(':')[1];
        }
    
        const player = await database.findPlayer(nameToSearch, force);

        if (player && player.message === 'Multiple possibilities found') {
            // If banned players contains one of the choices it can be removed from choices
            const filteredPlayers = player.playerUuids
                .map((uuid, index) => ({
                    playerUuid: uuid,
                    username: player.playerUsernames[index],
                }))
                .filter(({ playerUuid }) => !Object.keys(config.bannedPlayers).includes(playerUuid));

            if (filteredPlayers.length === 1) {
                player.uuid = filteredPlayers[0].playerUuid;
                player.username = filteredPlayers[0].username;
            }
    
            if (!player.uuid) {
                return {
                    playerUuids: player.playerUuids,
                    playerUsernames: player.playerUsernames,
                    playerRanks: player.playerRanks,
                    playerGuildRanks: player.playerGuildRanks,
                    playerGuildNames: player.playerGuildNames,
                    reason: reason,
                };
            }
        }

        if (!player) {
            return ({ error: `Unknown player ${nameToSearch.replaceAll('_', '\\_')}` });
        }

        if (!config['bannedPlayers']) {
            config['bannedPlayers'] = {};
        }

        if (config['bannedPlayers'][player.uuid] === reason) {
            return ({ error: `${player.username.replaceAll('_', '\\_')} is already banned for ${reason}` });
        }

        config['bannedPlayers'][player.uuid] = reason;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        return ({ username: player.username.replaceAll('_', '\\_'), reason: reason });
    } catch (err) {
        console.log(err);
        return ({ error: 'Error trying to ban user.' });
    }
}

module.exports = banPlayer;
