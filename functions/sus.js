const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
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

function sigmoid(x) {
    return 100 / (1 + Math.exp(-0.1 * (x - 50)));
}

async function sus(interaction, force = false) {
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

        return new ButtonedMessage(textMessage, player.playerUuids, MessageType.SUS, []);
    }

    if (!player) {
        return new ButtonedMessage('', [], '', [`Unknown player, ${nameToSearch.replace(/_/g, '\\_')}`]);
    }

    const memberToCheck = await getAsync('SELECT username, guildName, guildRank, rank, veteran, firstJoin, completedQuests, totalCombatLevel, playtime FROM players WHERE UUID = ?', [player.uuid]);

    if (!memberToCheck) {
        return new ButtonedMessage('', [], '', [`${nameToSearch.replace(/_/g, '\\_')} not found`]);
    }

    if (memberToCheck.firstJoin === null || memberToCheck.playtime === null || (memberToCheck.totalCombatLevel === null || memberToCheck.totalCombatLevel === 0) || memberToCheck.completedQuests === null) {
        const susResponse = `Missing information for ${memberToCheck.username.replace(/_/g, '\\_')}, please run \`/updateplayer player:${memberToCheck.username.replace(/_/g, '\\_')}\``;
        return new ButtonedMessage('', [], '', [susResponse]);
    }

    // Calculations based on Valor bot with some tweaks https://github.com/classAndrew/valor/blob/main/commands/sus.py
    const wynnJoinSus = memberToCheck.firstJoin ? Math.max(0, (Date.now() / 1000 - new Date(memberToCheck.firstJoin).getTime() / 1000 - 63072000) * -1) * 100 / 63072000 : 50.0;
    const rankSus = memberToCheck.rank === 'VIP' ? 25.0 : (memberToCheck.rank === 'VIP+' || memberToCheck.rank === 'HERO' || memberToCheck.rank === 'CHAMPION' || memberToCheck.veteran === 1) ? 0.0 : 50.0;
    const levelSus = memberToCheck.totalCombatLevel ? Math.max(0, (memberToCheck.totalCombatLevel - 210) * -1) * 100 / 210 : 50.0;
    const playtimeSus = memberToCheck.playtime ? Math.max(0, (memberToCheck.playtime - 800) * -1) * 100 / 800 : 50.0;
    const questSus = memberToCheck.completedQuests ? Math.max(0, (memberToCheck.completedQuests - 150) * -1) * 100 / 150 : 50.0;

    const daysSinceJoin = Math.floor((Date.now() - new Date(memberToCheck.firstJoin).getTime()) / (1000 * 60 * 60 * 24));

    let timeSpentPercentage;
    let timeSpentSus;

    if (memberToCheck.playtime && daysSinceJoin > 0) {
        timeSpentPercentage = ((memberToCheck.playtime / (daysSinceJoin * 24)) * 100);
        timeSpentSus = sigmoid(timeSpentPercentage);
    } else if (memberToCheck.playtime && daysSinceJoin === 0) {
        timeSpentPercentage = 100.00;
        timeSpentSus = 100;
    } else {
        timeSpentPercentage = 0.00;
        timeSpentSus = 0;
    }

    const overallSus = ((wynnJoinSus + rankSus + levelSus + playtimeSus + questSus + timeSpentSus) / 6).toFixed(2);

    let joinSusMessage;
    let playtimeSusMessage;
    let timeSpentSusMessage;
    let levelSusMessage;
    let questsSusMessage;
    let rankSusMessage;

    if (memberToCheck.firstJoin !== null) {
        joinSusMessage = `**Join Date**: ${memberToCheck.firstJoin} (${daysSinceJoin} days) __(${wynnJoinSus.toFixed(2)}%)__`;
    } else {
        joinSusMessage = `Unknown join date: __(${wynnJoinSus.toFixed(2)}%)__`;
    }

    if (memberToCheck.playtime !== null) {
        playtimeSusMessage = `**Playtime**: ${memberToCheck.playtime} hours __(${playtimeSus.toFixed(2)}%)__`;
    } else {
        playtimeSusMessage = `Unknown playtime: __(${playtimeSus.toFixed(2)}%)__`;
    }

    if (timeSpentPercentage > 0) {
        timeSpentSusMessage = `**Time Spent Playing**: ${timeSpentPercentage.toFixed(2)}% of playtime __(${timeSpentSus.toFixed(2)}%)__`;
    } else {
        timeSpentSusMessage = `Unknown time spent playing: __(${timeSpentSus.toFixed(2)}%)__`;
    }

    if (memberToCheck.totalCombatLevel !== null) {
        levelSusMessage = `**Total Combat Level**: ${memberToCheck.totalCombatLevel} __(${levelSus.toFixed(2)}%)__`;
    } else {
        levelSusMessage = `Unknown total combat level: __(${levelSus.toFixed(2)}%)__`;
    }

    if (memberToCheck.completedQuests !== null) {
        questsSusMessage = `**Total Quests Completed**: ${memberToCheck.completedQuests} __(${questSus.toFixed(2)}%)__`;
    } else {
        questsSusMessage = `Unknown total quests completed: __(${questSus.toFixed(2)}%)__`;
    }

    if (memberToCheck.rank !== null) {
        if (memberToCheck.veteran === 1) {
            rankSusMessage = `**Rank**: ${memberToCheck.rank} (Vet) __(${rankSus.toFixed(2)}%)__`;
        } else {
            rankSusMessage = `**Rank**: ${memberToCheck.rank} __(${rankSus.toFixed(2)}%)__`;
        }
    } else {
        rankSusMessage = `**Rank**: None __(${rankSus.toFixed(2)}%)__`;
    }

    const susResponse = `Suspiciousness of **${memberToCheck.username}** is: **__${overallSus}%__**\n\n${joinSusMessage}\n\n${playtimeSusMessage}\n\n${timeSpentSusMessage}\n\n${levelSusMessage}\n\n${questsSusMessage}\n\n${rankSusMessage}`;
    return new ButtonedMessage('', [], '', [susResponse]);
}

module.exports = sus;
