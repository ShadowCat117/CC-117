const fs = require('fs');
const path = require('path');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const findPlayer = require('./find_player');

async function addInactivityException(interaction, force = false, inactivityThreshold = -1) {
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
            nameToSearch = interaction.customId;
        }

        const player = await findPlayer(nameToSearch, guildName, force);

        if (player && player.message === 'Multiple possibilities found') {
            let textMessage = `Multiple players found with the username: ${nameToSearch}.`;
    
            for (let i = 0; i < player.playerUuids.length; i++) {
                const uuid = player.playerUuids[i];
                const playerUsername = player.playerUsernames[i];
                const rank = player.playerRanks[i];
                const guildRank = player.playerGuildRanks[i];
                const playerGuildName = player.playerGuildNames[i];

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
    
            textMessage += `\nClick button to choose player to add inactivity exception for ${inactivityThreshold} day(s).`;
    
            return new ButtonedMessage(textMessage, player.playerUuids, MessageType.ADD_INACTIVITY_EXCEPTION, []);
        }

        if (!player) {
            return new ButtonedMessage('', [], '', [`${nameToSearch.replace(/_/g, '\\_')} is not a member of ${guildName}`]);
        }

        if (interaction.message) {
            // Get exemption period from message content
            const messageContent = interaction.message.content;
            const regex = /for\s(-?\d+)/;
            const match = messageContent.match(regex);
            inactivityThreshold = match ? match[1] : inactivityThreshold;

            inactivityThreshold = parseInt(inactivityThreshold);
        }

        if (!config['inactivityExceptions']) {
            config['inactivityExceptions'] = {};
        }

        if (config['inactivityExceptions'][player.username] === inactivityThreshold) {
            if (inactivityThreshold === -1) {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is already exempt from inactivit`]);
            } else {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')}'s inactivity threshold is already ${inactivityThreshold}`]);
            }
        }

        config['inactivityExceptions'][player.username] = inactivityThreshold;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        if (inactivityThreshold === -1) {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is now exempt from inactivity`]);
        } else {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')}'s inactivity threshold is now ${inactivityThreshold}`]);
        }
    } catch (err) {
        console.log(err);
        return new ButtonedMessage('', [], '', ['Unable to add inactivity exception.']);
    }
}

module.exports = addInactivityException;
