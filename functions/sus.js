const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

function sigmoid(x) {
    return 100 / (1 + Math.exp(-0.1 * (x - 50)));
}

async function sus(uuid) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT username, guildName, guildRank, rank, veteran, firstJoin, completedQuests, totalCombatLevel, playtime FROM players WHERE UUID = ?',
            [uuid],
            async (err, row) => {
                if (err) {
                    console.error('Error retrieving player data:', err);
                    reject(err);
                } else {
                    if (row.firstJoin === null || row.playtime === null || (row.totalCombatLevel === null || row.totalCombatLevel === 0) || row.completedQuests === null) {
                        const susResponse = `Missing information for ${row.username}, please run \`/updateplayer player:${uuid}\` or \`/updateplayer player:${row.username}\``;
                        resolve(susResponse);
                    }

                    // Calculations based on Valor bot with some tweaks https://github.com/classAndrew/valor/blob/main/commands/sus.py
                    const wynnJoinSus = row.firstJoin ? Math.max(0, (Date.now() / 1000 - new Date(row.firstJoin).getTime() / 1000 - 63072000) * -1) * 100 / 63072000 : 50.0;
                    const rankSus = row.rank === 'VIP' ? 25.0 : (row.rank === 'VIP+' || row.rank === 'HERO' || row.rank === 'CHAMPION' || row.veteran === 1) ? 0.0 : 50.0;
                    const levelSus = row.totalCombatLevel ? Math.max(0, (row.totalCombatLevel - 210) * -1) * 100 / 210 : 50.0;
                    const playtimeSus = row.playtime ? Math.max(0, (row.playtime - 800) * -1) * 100 / 800 : 50.0;
                    const questSus = row.completedQuests ? Math.max(0, (row.completedQuests - 150) * -1) * 100 / 150 : 50.0;

                    const daysSinceJoin = Math.floor((Date.now() - new Date(row.firstJoin).getTime()) / (1000 * 60 * 60 * 24));

                    let timeSpentPercentage;
                    let timeSpentSus;

                    if (row.playtime && daysSinceJoin > 0) {
                        timeSpentPercentage = ((row.playtime / (daysSinceJoin * 24)) * 100);
                        timeSpentSus = sigmoid(timeSpentPercentage);
                    } else if (row.playtime && daysSinceJoin === 0) {
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

                    if (row.firstJoin !== null) {
                        joinSusMessage = `**Join Date**: ${row.firstJoin} (${daysSinceJoin} days) __(${wynnJoinSus.toFixed(2)}%)__`;
                    } else {
                        joinSusMessage = `Unknown join date: __(${wynnJoinSus.toFixed(2)}%)__`;
                    }

                    if (row.playtime !== null) {
                        playtimeSusMessage = `**Playtime**: ${row.playtime} hours __(${playtimeSus.toFixed(2)}%)__`;
                    } else {
                        playtimeSusMessage = `Unknown playtime: __(${playtimeSus.toFixed(2)}%)__`;
                    }

                    if (timeSpentPercentage > 0) {
                        timeSpentSusMessage = `**Time Spent Playing**: ${timeSpentPercentage.toFixed(2)}% of playtime __(${timeSpentSus.toFixed(2)}%)__`;
                    } else {
                        timeSpentSusMessage = `Unknown time spent playing: __(${timeSpentSus.toFixed(2)}%)__`;
                    }

                    if (row.totalCombatLevel !== null) {
                        levelSusMessage = `**Total Combat Level**: ${row.totalCombatLevel} __(${levelSus.toFixed(2)}%)__`;
                    } else {
                        levelSusMessage = `Unknown total combat level: __(${levelSus.toFixed(2)}%)__`;
                    }

                    if (row.completedQuests !== null) {
                        questsSusMessage = `**Total Quests Completed**: ${row.completedQuests} __(${questSus.toFixed(2)}%)__`;
                    } else {
                        questsSusMessage = `Unknown total quests completed: __(${questSus.toFixed(2)}%)__`;
                    }

                    if (row.rank !== null) {
                        if (row.veteran === 1) {
                            rankSusMessage = `**Rank**: ${row.rank} (Vet) __(${rankSus.toFixed(2)}%)__`;
                        } else {
                            rankSusMessage = `**Rank**: ${row.rank} __(${rankSus.toFixed(2)}%)__`;
                        }
                    } else {
                        rankSusMessage = `**Rank**: None __(${rankSus.toFixed(2)}%)__`;
                    }

                    const susResponse = `Suspiciousness of **${row.username}** is: **__${overallSus}%__**\n\n${joinSusMessage}\n\n${playtimeSusMessage}\n\n${timeSpentSusMessage}\n\n${levelSusMessage}\n\n${questsSusMessage}\n\n${rankSusMessage}`;
                    resolve(susResponse);
                }
            },
        );
    });
}

module.exports = sus;
