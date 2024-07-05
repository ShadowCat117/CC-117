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
            return {
                playerUuids: player.playerUuids,
                playerUsernames: player.playerUsernames,
                playerRanks: player.playerRanks,
                playerGuildRanks: player.playerGuildRanks,
                playerGuildNames: player.playerGuildNames,
                reason: reason,
            };
        }

        if (!player) {
            return ({ error: `Unknown player ${nameToSearch}` });
        }

        if (!config['bannedPlayers']) {
            config['bannedPlayers'] = {};
        }

        if (config['bannedPlayers'][player.username] === reason) {
            return ({ error: `${player.username} is already banned for ${reason}` });
        }

        config['bannedPlayers'][player.username] = reason;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        return ({ username: player.username, reason: reason });
    } catch (err) {
        console.log(err);
        return ({ error: 'Error trying to ban user.' });
    }
}

module.exports = banPlayer;
