const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const applyRoles = require('./apply_roles');
const findPlayer = require('../database/database');

async function verify(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        // Get username from command option
        nameToSearch = interaction.options.getString('username');
    } else if (interaction.customId) {
        // Get username from button id
        nameToSearch = interaction.customId;
    }

    // Search for player, unknown guild
    const player = await findPlayer(nameToSearch, '', force);

    // Multiple usernames found, should never happen if force is true
    if (player && player.message === 'Multiple possibilities found') {
        let textMessage = `Multiple players found with the username: ${nameToSearch}.`;

        // Create list of player options, try to be as detailed as possible.
        // Always show username and UUID, show guild if in guild and show rank if one is known.
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

        textMessage += '\nClick button to choose player.';

        return new ButtonedMessage(textMessage, player.playerUuids, MessageType.VERIFY, []);
    }

    // Unknown player
    if (!player) {
        return new ButtonedMessage('', [], '', [`Unknown player, ${nameToSearch.replace(/_/g, '\\_')}`]);
    }

    // Call applyRoles with the found players UUID
    const response = await applyRoles(interaction.guild, player.uuid, interaction.member);

    let verifyMessage;

    // Determine response message
    switch (response) {
        case 1:
            verifyMessage = `Successfully verified as ${player.username.replace(/_/g, '\\_')}`;
            break;
        case 2:
            verifyMessage = `Successfully verified as ally ${player.username.replace(/_/g, '\\_')}`;
            break;
        default:
            verifyMessage = 'Failed to verify';
            break;
    }

    return new ButtonedMessage('', [], '', [verifyMessage]);
}

module.exports = verify;
