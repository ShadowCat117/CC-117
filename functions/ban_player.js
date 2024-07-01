const fs = require('fs');
const path = require('path');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const findPlayer = require('../database/database');

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
        } else if (interaction.customId) {
            nameToSearch = interaction.customId;
        }

        const player = await findPlayer(nameToSearch, '', force);

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
    
            textMessage += `\nClick button to choose player to add to banned list for reason ${reason}.`;
    
            return new ButtonedMessage(textMessage, player.playerUuids, MessageType.BAN_PLAYER, []);
        }

        if (!player) {
            return new ButtonedMessage('', [], '', [`Unknown player, ${nameToSearch.replace(/_/g, '\\_')}`]);
        }

        if (interaction.message) {
            // Get reason from message content
            const messageContent = interaction.message.content;
            const regex = /for reason\s(.*)/;
            const match = messageContent.match(regex);
            reason = match ? match[1] : reason;
        }

        if (!config['bannedPlayers']) {
            config['bannedPlayers'] = {};
        }

        if (config['bannedPlayers'][player.username] === reason) {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is already banned for this reason`]);
        }

        config['bannedPlayers'][player.username] = reason;

        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is now banned for: ${reason}`]);
    } catch (err) {
        console.log(err);
        return new ButtonedMessage('', [], '', ['Unable to ban player.']);
    }
}

module.exports = banPlayer;
