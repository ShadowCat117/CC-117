const fs = require('fs').promises;
const path = require('path');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const findPlayer = require('./find_player');

async function updatePlayer(interaction, force = false) {
    const filePath = path.join(__dirname, '..', 'updatePlayers.json');

    try {
        let updatePlayersFile = {};

        // Access priority players file
        const fileData = await fs.readFile(filePath, 'utf-8');
        updatePlayersFile = JSON.parse(fileData);

        let nameToSearch;

        // Get name from command or button interaction
        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('player');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId;
        }

        const player = await findPlayer(nameToSearch, '', force);

        // Multiple players found matching name
        if (player && player.message === 'Multiple possibilities found') {
            let textMessage = `Multiple players found with the username: ${nameToSearch}.`;
    
            // Loop through each possible player adding to the message
            for (let i = 0; i < player.playerUuids.length; i++) {
                const uuid = player.playerUuids[i];
                const playerUsername = player.playerUsernames[i];
                const rank = player.playerRanks[i];
                const guildRank = player.playerGuildRanks[i];
                const playerGuildName = player.playerGuildNames[i];

                // Always show username and UUID, show guild name/rank if possible and donator rank
                if (!rank && !playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername} (UUID: ${uuid})`;
                } else if (!rank) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                } else if (!playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank}. (UUID: ${uuid})`;
                } else {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                }
            }
    
            textMessage += '\nClick button to choose player.';
    
            return new ButtonedMessage(textMessage, player.playerUuids, MessageType.UPDATE_PLAYER, []);
        }

        // No player found
        if (!player) {
            return new ButtonedMessage('', [], '', [`Unable to find player named ${nameToSearch.replace(/_/g, '\\_')}, make sure they have logged into Wynncraft for at least 15 minutes. Or if their username has changed, try using their previous username.`]);
        }

        // Filter file to remove null players
        updatePlayersFile.players = updatePlayersFile.players.filter(item => item !== null);

        if (updatePlayersFile.players.includes(player.uuid)) {
            // If already in file, then ignore
            return new ButtonedMessage('', [], '', [`${player.username} is already queued to be updated.`]);
        } else {
            // Add new player to file
            updatePlayersFile.players.unshift(player.uuid);

            // Save file
            const updatedData = JSON.stringify(updatePlayersFile);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            return new ButtonedMessage('', [], '', [`${player.username} will be updated soon.`]);
        }
    } catch (err) {
        console.log(err);
        return new ButtonedMessage('', [], '', ['Unable to update player.']);
    }
}

module.exports = updatePlayer;
