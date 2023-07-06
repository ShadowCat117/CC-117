const wynnAPI = require('gavel-gateway-js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
let playersToUpdate = [];
let currentGuildIndex = 0;
let hitLimit = false;

async function runAsync(query, params) {
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

async function allAsync(query, params) {
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
    const onlinePlayers = await wynnAPI.fetchOnlinePlayers();
    const worlds = onlinePlayers.list;

    await runAsync('UPDATE players SET isOnline = 0, onlineWorld = NULL');

    const newPlayers = await updatePlayerStatus(worlds);

    if (newPlayers) {
        for (const newPlayer of newPlayers) {
            await updatePlayer(newPlayer);
        }
    }
}

async function updatePlayerStatus(worldData) {
    return new Promise((resolve, reject) => {
        const playersToUpdateNow = [];

        let processedCount = 0;

        const processPlayer = (playerName, worldNumber) => {
            db.get('SELECT * FROM players WHERE username = ?', playerName, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    const currentDate = new Date().toISOString().split('T')[0];
                    db.run('UPDATE players SET isOnline = 1, lastJoin = ?, onlineWorld = ? WHERE username = ?', [currentDate, worldNumber, playerName], (err) => {
                        if (err) {
                            reject(err);
                            return;
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

        for (const worldIndex in worldData) {
            const world = worldData[worldIndex];

            if (world.worldType === 'WYNNCRAFT') {
                const worldNumber = parseInt(world.name.slice(2));
                playersCount += world.players.length;

                for (const playerName of world.players) {
                    processPlayer(playerName, worldNumber);
                }
            }
        }
    });
}

async function getOutdatedPlayers() {
    const outdatedDate = new Date();
    outdatedDate.setDate(outdatedDate.getDate() - 14);

    const selectQuery = 'SELECT username FROM players WHERE lastUpdated <= ?';
    const params = [outdatedDate.toISOString()];

    const rows = await allAsync(selectQuery, params);

    playersToUpdate = rows.map(row => row.username);

    return;
}

async function updateOutdatedPlayers() {
    try {
        for (const player of playersToUpdate) {
            await updatePlayer(player);
        }
    } catch (error) {
        console.error(error);
    }
}

async function updatePlayer(playerName) {
    if (hitLimit) return;

    try {
        const playerJson = await wynnAPI.fetchPlayer(playerName).catch((error) => {
            if (error instanceof RangeError) {
                hitLimit = true;
                return;
            }
        });

        if (!playerJson) {
            hitLimit = true;
            return;
        }

        const selectQuery = 'SELECT * FROM players WHERE UUID = ?';
        const selectParams = [playerJson.uuid];

        const row = await getAsync(selectQuery, selectParams);

        if (row) {
            const guildName = row && row.guildName !== null ? row.guildName : playerJson.guild.name;
            const guildRank = row && row.guildRank !== null ? row.guildRank : playerJson.guild.rank;
            const isOnline = row ? row.isOnline : 0;
            const worldNumber = playerJson.world !== null ? parseInt(playerJson.world.slice(2)) : null;

            const insertQuery = 'INSERT OR REPLACE INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated, onlineWorld) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const insertParams = [
                playerJson.uuid,
                playerJson.name,
                guildName,
                guildRank,
                playerJson.rank.donatorRank,
                playerJson.rank.veteran,
                JSON.stringify(playerJson.lastJoin).split('T')[0].slice(1, -1),
                isOnline,
                new Date().toISOString().split('T')[0],
                worldNumber,
            ];

            await runAsync(insertQuery, insertParams);

            playersToUpdate.pop(playerName);

            return;
        } else {
            const isOnline = row ? row.isOnline : 0;
            const worldNumber = playerJson.world !== null ? parseInt(playerJson.world.slice(2)) : null;

            const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated, onlineWorld) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const insertParams = [
                playerJson.uuid,
                playerJson.name,
                null,
                null,
                playerJson.rank.donatorRank,
                playerJson.rank.veteran,
                JSON.stringify(playerJson.lastJoin).split('T')[0].slice(1, -1),
                isOnline,
                new Date().toISOString().split('T')[0],
                worldNumber,
            ];

            await runAsync(insertQuery, insertParams);

            return;
        }
    } catch (error) {
        console.error(`Error fetching ${playerName}:`, error);
        return;
    }
}

async function updateGuilds() {
    if (hitLimit) return;

    try {
        const response = await wynnAPI.fetchGuildList().catch((error) => {
            if (error instanceof RangeError) {
                hitLimit = true;
                return;
            }
        });

        if (!response) {
            hitLimit = true;
            return;
        }

        const allGuilds = response.list;

        try {
            const query = 'SELECT name FROM guilds';
            const rows = await allAsync(query, []);

            const existingGuildNames = rows.map((row) => row.name);

            const guildsNotInTable = allGuilds.filter(
                (name) => !existingGuildNames.includes(name),
            );

            const guildsToDelete = existingGuildNames.filter(
                (name) => !allGuilds.includes(name),
            );

            for (const guildName of guildsToDelete) {
                const deleteQuery = 'DELETE FROM guilds WHERE name = ?';
                await runAsync(deleteQuery, [guildName]);
                console.log(`Deleted guild '${guildName}' from the 'guilds' table.`);

                const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL WHERE guildName = ?';
                await runAsync(updateQuery, [guildName]);
            }

            for (const guildName of guildsNotInTable) {
                if (hitLimit) break;

                await updateGuild(guildName);
            }
        } catch (err) {
            console.error('Error updating list of guilds: ', err);
        }
    } catch (error) {
        console.error('Error fetching guild list: ', error);
        return;
    }
}

async function updateGuild(guildName) {
    try {
        const guild = await wynnAPI.fetchGuild(guildName).catch((error) => {
            if (error instanceof RangeError) {
                hitLimit = true;
                return;
            }
        });

        if (!guild) {
            hitLimit = true;
            return;
        }

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
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0)`, [guild.name, guild.tag],
            (err) => {
                if (err) {
                    console.error('Failed to add new guild:', err);
                    return;
                }
            },
        );

        for (const member of guild.members) {
            if (hitLimit) return;
            
            await updatePlayersGuild(member.uuid, member.name, guild.name, member.rank);
        }
    } catch (error) {
        console.error('Error adding new guild: ', error);
        return;
    }
}

async function updatePlayersGuild(playerUuid, playerName, guildName, guildRank) {
    const outdatedDate = new Date();
    outdatedDate.setDate(outdatedDate.getDate() - 14);
    const outdatedDateString = outdatedDate.toISOString().split('T')[0];

    const query = `
        INSERT OR REPLACE INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, lastUpdated, onlineWorld)
        VALUES (?, ?, ?, ?, null, 0, ?, 0, ?, null)
        `;

    try {
        await runAsync(query, [playerUuid, playerName, guildName, guildRank, outdatedDateString, outdatedDateString]);
    } catch (error) {
        console.error(`Error updating player ${playerName} guild information:`, error);
    }
}

async function updateGuildMembers() {
    try {
        const query = 'SELECT name FROM guilds';
        const rows = await allAsync(query, []);

        const existingGuildNames = rows.map((row) => row.name);

        const endIndex = existingGuildNames.length - 1;

        while (!hitLimit) {
            const name = existingGuildNames[currentGuildIndex];

            await updateGuild(name);

            if (hitLimit) {
                return;
            }

            currentGuildIndex++;

            if (currentGuildIndex > endIndex) {
                currentGuildIndex = 0;
            }
        }

        return;
    } catch (err) {
        console.error('Error updating guild members: ', err);
        return;
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
    hitLimit = false;

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
        // Gets all players who haven't been updated in a fortnight.
        console.log('Getting outdated players');
        await getOutdatedPlayers();

        // Updates the rank for players that haven't been updated in a fortnight.
        console.log('Updating outdated players');
        await updateOutdatedPlayers();

        console.log('Completed tasks for every 20 minutes');
    }

    // Update hourly
    if (now.getUTCMinutes() == 0) {
        // Updates the guilds database with new guilds and removes deleted guilds.
        console.log('Updating list of all guilds.');
        await updateGuilds();

        // Updates the guild and guild rank for each member of each guild.
        console.log('Updating guild members');
        await updateGuildMembers();

        // Updates the average online players & captain+'s for each guild.
        console.log('Updating guild activity');
        await updateGuildActivity();

        console.log('Completed hourly tasks');
    }

    now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    setTimeout(runFunction, secondsToNextMinute * 1000);
}

wynnAPI.setConfig({ throwOnRatelimitError: true });
wynnAPI.setConfig({ maxQueueLength: 0 });

runFunction();