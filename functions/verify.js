const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const applyRoles = require('./apply_roles');
const findPlayer = require('./find_player');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

async function getAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function verify(interaction, force = false) {
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

        textMessage += '\nClick button to choose player.';

        return new ButtonedMessage(textMessage, player.playerUuids, MessageType.VERIFY, []);
    }

    const memberToCheck = await getAsync('SELECT UUID, username, guildName, guildRank, rank FROM players WHERE UUID = ?', [player.uuid]);

    if (!memberToCheck) {
        return new ButtonedMessage('', [], '', [`${nameToSearch.replace(/_/g, '\\_')} not found`]);
    }

    const response = await applyRoles(interaction.guild, memberToCheck.UUID, interaction.member);

    let verifyMessage;

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
