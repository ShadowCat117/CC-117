const fs = require('fs');
const path = require('path');
const database = require('../database/database');

async function addInactivityException(interaction, force = false, duration = -1) {
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
            duration = interaction.options.getInteger('duration');

            if (!duration) {
                duration = -1;
            }
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
                duration: duration,
            };
        }

        if (!player) {
            return ({ error: `Unknown player ${nameToSearch.replaceAll('_', '\\_')}` });
        }

        if (!config['inactivityExceptions']) {
            config['inactivityExceptions'] = {};
        }

        if (config['inactivityExceptions'][player.uuid] === duration) {
            let durationStr;

            if (duration === -1) {
                durationStr = `${player.username.replaceAll('_', '\\_')} is already allowed to be inactive forever`;
            } else {
                durationStr = `${player.username.replaceAll('_', '\\_')} is already allowed to be inactive for ${duration} day${duration > 1 ? 's' : ''}.`;
            }

            return ({ error: `${durationStr}` });
        }

        config['inactivityExceptions'][player.uuid] = duration;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        return ({ username: player.username.replaceAll('_', '\\_'), duration: duration });
    } catch (err) {
        console.log(err);
        return ({ error: 'Error trying to add inactivity exception.' });
    }
}

module.exports = addInactivityException;
