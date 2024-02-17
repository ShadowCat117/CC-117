const fs = require('fs');
const path = require('path');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const findPlayer = require('./find_player');

async function addDemotionException(interaction, force = false, exemptionPeriod = -1) {
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
    
            textMessage += `\nClick button to choose player to add demotion exception for ${exemptionPeriod} day(s).`;
    
            return new ButtonedMessage(textMessage, player.playerUuids, MessageType.ADD_DEMOTION_EXCEPTION, []);
        }

        if (!player) {
            return new ButtonedMessage('', [], '', [`${nameToSearch.replace(/_/g, '\\_')} is not a member of ${guildName}`]);
        }

        if (interaction.message) {
            // Get exemption period from message content
            const messageContent = interaction.message.content;
            const regex = /for\s(-?\d+)/;
            const match = messageContent.match(regex);
            exemptionPeriod = match ? match[1] : exemptionPeriod;

            exemptionPeriod = parseInt(exemptionPeriod);
        }

        if (!config['demotionExceptions']) {
            config['demotionExceptions'] = {};
        }

        if (config['demotionExceptions'][player.username] === exemptionPeriod) {
            if (exemptionPeriod === -1) {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is already permanently exempt from demotions`]);
            } else if (exemptionPeriod === 1) {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is already exempt from demotions for ${exemptionPeriod} day`]);
            } else {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is already exempt from demotions for ${exemptionPeriod} days`]);
            }
        }

        config['demotionExceptions'][player.username] = exemptionPeriod;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        if (exemptionPeriod === -1) {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is now permanently exempt from demotions`]);
        } else if (exemptionPeriod === 1) {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is now exempt from demotions for ${exemptionPeriod} day`]);
        } else {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is now exempt from demotions for ${exemptionPeriod} days`]);
        }
    } catch (err) {
        console.log(err);
        return new ButtonedMessage('', [], '', ['Unable to add demotion exception.']);
    }
}

module.exports = addDemotionException;
