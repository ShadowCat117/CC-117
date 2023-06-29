const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const playersToUpdate = [];
let currentGuildIndex = 0;

function runAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

function getAsync(query, params) {
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

function allAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function updateOnlinePlayers() {
    return new Promise((resolve, reject) => {
        https.get('https://api-legacy.wynncraft.com/public_api.php?action=onlinePlayers', async (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', async () => {
                const json = JSON.parse(data);

                try {
                    await runAsync('UPDATE players SET isOnline = 0');

                    const playersToUpdateNow = await updatePlayerStatus(json);

                    let processedCount = 0;

                    for (const username of playersToUpdateNow) {
                        https.get(`https://api.wynncraft.com/v2/player/${username}/stats`, (playerResp) => {
                            let playerData = '';

                            playerResp.on('data', (chunk) => {
                                playerData += chunk;
                            });

                            playerResp.on('end', () => {
                                const playerJson = JSON.parse(playerData);

                                if (playerJson.data && playerJson.data.length > 0) {
                                    const player = playerJson.data[0];

                                    db.run(
                                        'INSERT OR REPLACE INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                                            player.uuid,
                                            player.username,
                                            null,
                                            null,
                                            player.meta.tag.value,
                                            player.meta.veteran,
                                            player.meta.lastJoin.split('T')[0],
                                            player.meta.location.online,
                                            new Date().toISOString().split('T')[0],
                                        ],
                                        (err) => {
                                            if (err) {
                                                console.error('Failed to insert player:', err);
                                            }
                                        },
                                    );
                                }

                                processedCount++;
                                if (processedCount === playersToUpdateNow.length) {
                                    resolve();
                                }
                            });

                        }).on('error', (err) => {
                            console.log('Error: ' + err.message);
                            processedCount++;
                            if (processedCount === playersToUpdateNow.length) {
                                resolve();
                            }
                        });
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function updatePlayerStatus(json) {
    return new Promise((resolve, reject) => {
        const playersToUpdateNow = [];

        let processedCount = 0;

        const processPlayer = (playerName) => {
            db.get('SELECT * FROM players WHERE username = ?', playerName, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    const currentDate = new Date().toISOString().split('T')[0];
                    db.run('UPDATE players SET isOnline = 1, lastJoin = ? WHERE username = ?', [currentDate, playerName], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const lastUpdatedDate = new Date(row.lastUpdated).toISOString().split('T')[0];
                        const monthAgo = new Date();
                        monthAgo.setDate(monthAgo.getDate() - 28);
                        const outdatedDate = monthAgo.toISOString().split('T')[0];

                        if (lastUpdatedDate <= outdatedDate) {
                            if (!playersToUpdate.includes(playerName)) {
                                playersToUpdate.push(playerName);
                            }
                        }

                        processedCount++;
                        if (processedCount === playersCount) {
                            resolve(playersToUpdateNow);
                        }
                    });
                } else {
                    if (!playersToUpdate.includes(playerName)) {
                        playersToUpdateNow.push(playerName);
                    }

                    processedCount++;
                    if (processedCount === playersCount) {
                        resolve(playersToUpdateNow);
                    }
                }
            });
        };

        let playersCount = 0;
        for (const serverKey in json) {
            const serverData = json[serverKey];
            if (Array.isArray(serverData)) {
                playersCount += serverData.length;
                for (const playerName of serverData) {
                    processPlayer(playerName);
                }
            }
        }
    });
}

async function updateGuilds() {
    return new Promise((resolve, reject) => {
        https.get('https://api.wynncraft.com/public_api.php?action=guildList', async (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', async () => {
                const json = JSON.parse(data);

                if (json.message) {
                    resolve();
                    return;
                }

                try {
                    const query = 'SELECT name FROM guilds';
                    const rows = await allAsync(query, []);

                    const existingGuildNames = rows.map((row) => row.name);

                    const guildsNotInTable = json.guilds.filter(
                        (name) => !existingGuildNames.includes(name),
                    );

                    const guildsToDelete = existingGuildNames.filter(
                        (name) => !json.guilds.includes(name),
                    );

                    for (const guildName of guildsToDelete) {
                        const deleteQuery = 'DELETE FROM guilds WHERE name = ?';
                        await runAsync(deleteQuery, [guildName]);
                        console.log(`Deleted guild '${guildName}' from the 'guilds' table.`);

                        const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL WHERE guildName = ?';
                        await runAsync(updateQuery, [guildName]);
                    }

                    for (const guildName of guildsNotInTable) {
                        await updateGuild(guildName);
                    }

                    resolve();
                } catch (err) {
                    console.error(err);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function updateGuild(guildName) {
    const encodedGuildName = guildName.replace(/\s/g, '%20');

    return new Promise((resolve, reject) => {
        https.get(`https://api.wynncraft.com/public_api.php?action=guildStats&command=${encodedGuildName}`, async (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', async () => {
                const json = JSON.parse(data);

                if (json && json.members) {
                    db.run(
                        `INSERT OR IGNORE INTO guilds (name, prefix,
                        average00, captains00, average01, captains01, average02, captains02, 
                        average03, captains03, average04, captains04, average05, captains05, 
                        average06, captains06, average07, captains07, average08, captains08, 
                        average09, captains09, average10, captains10, average11, captains11, 
                        average12, captains12, average13, captains13, average14, captains14, 
                        average15, captains15, average16, captains16, average17, captains17, 
                        average18, captains18, average19, captains19, average20, captains20, 
                        average21, captains21, average22, captains22, average23, captains23,
                        averageCount) 
                        VALUES (?, ?, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
                        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
                        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0)`, [json.name, json.prefix],
                        (err) => {
                            if (err) {
                                console.error('Failed to insert guild:', err);
                                resolve(true);
                            }
                        },
                    );

                    for (const member of json.members) {
                        await updatePlayersGuild(member.uuid, member.name, json.name, member.rank);
                    }

                    // false as API limit not hit
                    resolve(false);
                } else {
                    // true as API limit hit
                    resolve(true);
                }
            });
        }).on('error', (err) => {
            if (err.code === 'ETIMEDOUT') {
                console.error('Connection to API timed out. Skipping...');
                resolve(true);
            } else {
                reject(err);
            }
        });
    });
}

async function updatePlayersGuild(playerUuid, playerName, guildName, guildRank) {
    return new Promise((resolve, reject) => {
        const outdatedDate = new Date();
        outdatedDate.setDate(outdatedDate.getDate() - 28);
        const outdatedDateString = outdatedDate.toISOString().split('T')[0];

        const selectQuery = 'SELECT COUNT(*) as count FROM players WHERE UUID = ?';
        const selectParams = [playerUuid];

        getAsync(selectQuery, selectParams)
            .then((result) => {
                const {
                    count,
                } = result;

                if (count > 0) {
                    const updateQuery = 'UPDATE players SET guildName = ?, guildRank = ? WHERE UUID = ?';
                    const updateParams = [guildName, guildRank, playerUuid];
                    return runAsync(updateQuery, updateParams);
                } else {
                    const insertQuery = `INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated)
                                VALUES (?, ?, ?, ?, null, 0, ?, 0, ?)`;
                    const insertParams = [playerUuid, playerName, guildName, guildRank, outdatedDateString, outdatedDateString];
                    return runAsync(insertQuery, insertParams);
                }
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function updatePlayerStats() {
    try {
        const promises = playersToUpdate.map((player) => updatePlayer(player));
        await Promise.all(promises);
    } catch (error) {
        console.error(error);
    }
}


async function updatePlayer(playerName) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.wynncraft.com/v2/player/${playerName}/stats`, (playerResp) => {
            let playerData = '';

            playerResp.on('data', (chunk) => {
                playerData += chunk;
            });

            playerResp.on('end', async () => {
                const playerJson = JSON.parse(playerData);

                if (playerJson.data && playerJson.data.length > 0) {
                    const player = playerJson.data[0];

                    const selectQuery = 'SELECT * FROM players WHERE username = ?';
                    const selectParams = [player.username];

                    const row = await getAsync(selectQuery, selectParams);

                    const guildName = row && row.guildName !== null ? row.guildName : player.guild.name;
                    const guildRank = row && row.guildRank !== null ? row.guildRank : player.guild.rank;

                    const insertQuery = `
                INSERT OR REPLACE INTO players
                (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

                    const insertParams = [
                        player.uuid,
                        player.username,
                        guildName,
                        guildRank,
                        player.meta.tag.value,
                        player.meta.veteran,
                        player.meta.lastJoin.split('T')[0],
                        player.meta.location.online,
                        new Date().toISOString().split('T')[0],
                    ];

                    await runAsync(insertQuery, insertParams);

                    playersToUpdate.pop(playerName);

                    resolve();
                }

                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Updating guild members
// node:internal/process/promises:246
//           triggerUncaughtException(err, true /* fromPromise */);
//           ^

// Error: connect ETIMEDOUT 104.18.28.105:443
//     at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1161:16) {
//   errno: -110,
//   code: 'ETIMEDOUT',
//   syscall: 'connect',
//   address: '104.18.28.105',
//   port: 443
// }

async function updatePlayerGuilds() {
    try {
        const query = 'SELECT name FROM guilds';
        const rows = await allAsync(query, []);

        const existingGuildNames = rows.map((row) => row.name);

        const endIndex = existingGuildNames.length - 1;

        let hitLimit = false;

        while (!hitLimit) {
            const name = existingGuildNames[currentGuildIndex];

            hitLimit = await updateGuild(name);

            if (hitLimit) {
                return Promise.resolve();
            }

            currentGuildIndex++;

            if (currentGuildIndex > endIndex) {
                currentGuildIndex = 0;
            }
        }

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function updateGuildActivity() {
    try {
        const now = new Date();
        const currentHour = now.getUTCHours().toString().padStart(2, '0');

        const query = 'SELECT name, averageCount, average' + currentHour + ', captains' + currentHour + ' FROM guilds';
        const guilds = await allAsync(query, []);

        for (const guild of guilds) {
            const guildName = guild.name;
            let averageCount = guild.averageCount;
            const currentAverage = guild['average' + currentHour];
            const currentCaptains = guild['captains' + currentHour];

            const playerQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1';
            const playerResult = await getAsync(playerQuery, [guildName]);
            const currentOnline = playerResult.count;

            const captainRanks = ['CAPTAIN', 'STRATEGIST', 'CHIEF', 'OWNER'];
            const captainQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1 AND guildRank IN (' + captainRanks.map(() => '?').join(',') + ')';
            const captainResult = await getAsync(captainQuery, [guildName, ...captainRanks]);
            const captainsOnline = captainResult.count;

            let newAverage;
            let newCaptains;

            if (averageCount > 7) {
                averageCount = 0;

                newAverage = currentAverage + currentOnline / 2;
                newCaptains = currentCaptains + captainsOnline / 2;
            } else if (currentAverage > 0) {
                newAverage = (currentAverage * averageCount + currentOnline) / (averageCount + 1);
                newCaptains = (currentCaptains * averageCount + captainsOnline) / (averageCount + 1);
            } else {
                newAverage = currentOnline;
                newCaptains = captainsOnline;
            }

            let updateQuery = 'UPDATE guilds SET average' + currentHour + ' = ?, captains' + currentHour + ' = ?';

            if (currentHour === '23') {
                updateQuery += ', averageCount = COALESCE(averageCount, 0) + 1';
            }

            updateQuery += ' WHERE name = ?';

            await runAsync(updateQuery, [newAverage, newCaptains, guildName]);
        }

        return Promise.resolve();
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
}

async function runFunction() {
    let now = new Date();

    // Update every 10 mins
    if (now.getUTCMinutes() % 10 === 0) {
        // Updates the players that are online.
        console.log('Updating all online players.');
        await updateOnlinePlayers();

        console.log('Completed tasks for every 10 minutes');
    }

    // Update every 20 mins
    if (now.getUTCMinutes() % 20 == 0) {
        // Updates the rank for players that haven't been updated in a month.
        console.log('Updating outdated players');
        await updatePlayerStats();

        console.log('Completed tasks for every 20 minutes');
    }

    // Update hourly
    if (now.getUTCMinutes() == 0) {
        // Updates the guilds database with new guilds and removes deleted guilds.
        console.log('Updating list of all guilds.');
        await updateGuilds();

        // Updates the guild and guild rank for each member of each guild.
        console.log('Updating guild members');
        await updatePlayerGuilds();

        // Updates the average online players & captain+'s for each guild.
        console.log('Updating guild activity');
        await updateGuildActivity();

        console.log('Completed hourly tasks');
    }

    now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    setTimeout(runFunction, secondsToNextMinute * 1000);
}

runFunction();
