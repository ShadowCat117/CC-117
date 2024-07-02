const axios = require('axios');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database('database/database.db');
const PlayerLastLogin = require('../message_objects/PlayerLastLogin');
const RATE_LIMIT = 180;
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let remainingRateLimit = RATE_LIMIT;
let rateLimitReset;
let pausePlayerUpdates = false;

// Call run queries on the database with promises
async function runAsync(query, params) {
    return new Promise((resolve, reject) => {
        database.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

// Call get queries on the database with promises
async function getAsync(query, params) {
    return new Promise((resolve, reject) => {
        database.get(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Call all queries on the database with promises
async function allAsync(query, params) {
    return new Promise((resolve, reject) => {
        database.all(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Used for finding a guild from an input
// input: The given input to look for
// force: If the input is expected to be correct then this will be set to true
async function findGuild(input, force = false) {
    if (force) {
        const query = 'SELECT uuid, name, prefix FROM guilds WHERE uuid = ?';
        const guilds = await allAsync(query, [input]);

        if (guilds.length === 0 || guilds.length > 1) {
            console.log(`${input} does not exist in the table, force was incorrect`);
            return null;
        } else {
            return {
                uuid: guilds[0].uuid,
                name: guilds[0].name,
                prefix: guilds[0].prefix,
            };
        }
    } else {
        let query = 'SELECT uuid, name, prefix FROM guilds WHERE UPPER(prefix) = UPPER(?)';
        const prefixGuilds = await allAsync(query, [input]);

        if (prefixGuilds.length === 0) {
            query = 'SELECT uuid, name, prefix FROM guilds WHERE UPPER(name) = UPPER(?)';
            const nameGuilds = await allAsync(query, [input]);

            if (nameGuilds.length === 0) {
                return null;
            } else if (prefixGuilds.length > 1) {
                const guildUuids = nameGuilds.map((row) => row.uuid);
                const guildNames = nameGuilds.map((row) => row.name);
                const guildPrefixes = nameGuilds.map((row) => row.prefix);
    
                return {
                    message: 'Multiple possibilities found',
                    guildUuids: guildUuids,
                    guildNames: guildNames,
                    guildPrefixes: guildPrefixes,
                };
            } else {
                return {
                    uuid: nameGuilds[0].uuid,
                    name: nameGuilds[0].name,
                    prefix: nameGuilds[0].prefix,
                };
            }
        } else if (prefixGuilds.length > 1) {
            const guildUuids = prefixGuilds.map((row) => row.uuid);
            const guildNames = prefixGuilds.map((row) => row.name);
            const guildPrefixes = prefixGuilds.map((row) => row.prefix);

            return {
                message: 'Multiple possibilities found',
                guildUuids: guildUuids,
                guildNames: guildNames,
                guildPrefixes: guildPrefixes,
            };
        } else {
            return {
                uuid: prefixGuilds[0].uuid,
                name: prefixGuilds[0].name,
                prefix: prefixGuilds[0].prefix,
            };
        }
    }
}

// Used for finding a player from an input
// input: The given input to look for
// force: If the input is expected to be correct then this will be set to true
async function findPlayer(input, force = false) {
    if (force) {
        const query = 'SELECT uuid, username FROM players WHERE uuid = ?';
        const players = await allAsync(query, [input]);

        if (players.length === 0 || players.length > 1) {
            console.log(`${input} does not exist in the table, force was incorrect`);
            return null;
        } else {
            return {
                uuid: players[0].uuid,
                username: players[0].username,
            };
        }
    } else {
        const query = 'SELECT uuid, username FROM players WHERE UPPER(username) = UPPER(?)';
        const players = await allAsync(query, [input]);

        if (players.length === 0) {
            return null;
        } else if (players.length > 1) {
            const playeruuids = players.map((row) => row.uuid);
            const playerUsernames = players.map((row) => row.username);

            return {
                message: 'Multiple possibilities found',
                playeruuids: playeruuids,
                playerUsernames: playerUsernames,
            };
        } else {
            return {
                uuid: players[0].uuid,
                username: players[0].username,
            };
        }
    }
}

async function handleOnlinePlayers(onlinePlayers) {
    try {
        const now = new Date();
        const uuids = Object.keys(onlinePlayers);

        for (const uuid of uuids) {
            // Check if the UUID exists in the players table
            const existingPlayer = await getAsync('SELECT * FROM players WHERE uuid = ?', [uuid]);

            if (existingPlayer) {
                // If the player is already online, we don't need to change anything
                if (existingPlayer.online === false) {
                    // Update existing player, set online to true and lastLogin to current date
                    await runAsync('UPDATE players SET online = true, lastLogin = ?, sessionStart = ? WHERE uuid = ?', [now.toISOString(), now.toISOString(), uuid]);
                }
            } else {
                // Insert new player with available details
                await runAsync('INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, null, null, null, true, ?, -1, -1, ?, 0, -1, 0)', [uuid, now.toISOString(), now.toISOString()]);
            }
        }

        console.log('Handling offline players');

        await handleOfflinePlayers(uuids);
    } catch (error) {
        console.error('Error processing data:', error);
    }
}

async function handleOfflinePlayers(onlinePlayers) {
    try {
        const now = new Date();

        const placeholders = onlinePlayers.map(() => '?').join(', ');

        // Get all offline players
        const offlinePlayers = await allAsync(`SELECT uuid, weeklyPlaytime, sessionStart FROM players WHERE uuid NOT IN (${placeholders}) AND online = true`, onlinePlayers);

        // Calculate the session duration for each offline player and set them as offline
        for (const player of offlinePlayers) {
            const sessionStart = new Date(player.sessionStart);
            const sessionDurationHours = (now - sessionStart) / (1000 * 60 * 60);

            // Update weekly playtime and reset session start
            await runAsync('UPDATE players SET online = false, lastLogin = ?, weeklyPlaytime = ?, sessionStart = null WHERE uuid = ?', [now.toISOString(), (player.weeklyPlaytime + sessionDurationHours), player.uuid]);
        }

        console.log('Updated activity for offline players');
    } catch (error) {
        console.error('Error processing data:', error);
    }
}

async function updateGuildList(guildList) {
    const insertQuery = 'INSERT OR IGNORE INTO guilds (uuid, name, prefix, average00, captains00, averageCount00, average01, captains01, averageCount01, average02, captains02, averageCount02, average03, captains03, averageCount03, average04, captains04, averageCount04, average05, captains05, averageCount05, average06, captains06, averageCount06, average07, captains07, averageCount07, average08, captains08, averageCount08, average09, captains09, averageCount09, average10, captains10, averageCount10, average11, captains11, averageCount11, average12, captains12, averageCount12, average13, captains13, averageCount13, average14, captains14, averageCount14, average15, captains15, averageCount15, average16, captains16, averageCount16, average17, captains17, averageCount17, average18, captains18, averageCount18, average19, captains19, averageCount19, average20, captains20, averageCount20, average21, captains21, averageCount21, average22, captains22, averageCount22, average23, captains23, averageCount23) VALUES (?, ?, ?, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);';
    
    for (const uuid in guildList) {
        const { name, prefix } = guildList[uuid];

        await runAsync(insertQuery, [uuid, name, prefix]);
    }
}

// Update the average activity of each guild at the different intervals
async function updateGuildActivity(currentHour, currentMinute) {
    try {
        // Get current average at current hour
        const query = 'SELECT uuid, average' + currentHour + ', captains' + currentHour + ', averageCount' + currentHour + ' FROM guilds';
        // Get all guilds and their averages for current time
        const guilds = await allAsync(query);

        // Loop through every guild
        for (const guild of guilds) {
            const guildUuid = guild.uuid;
            let hourAverageCount = guild['averageCount' + currentHour];
            // Current averages
            const currentAverage = guild['average' + currentHour];
            const currentCaptains = guild['captains' + currentHour];

            // Get the players from guild
            const playerQuery = 'SELECT COUNT(*) as count FROM players WHERE guildUuid = ? AND isOnline = true';
            const playerResult = await getAsync(playerQuery, [guildUuid]);
            const currentOnline = playerResult.count;

            // Get the players from guild at or above the rank of captain
            const captainRanks = ['captain', 'strategist', 'chief', 'owner'];
            const captainQuery = 'SELECT COUNT(*) as count FROM players WHERE guildUuid = ? AND isOnline = true AND guildRank IN (' + captainRanks.map(() => '?').join(',') + ')';
            const captainResult = await getAsync(captainQuery, [guildUuid]);
            const captainsOnline = captainResult.count;

            let newAverage;
            let newCaptains;

            // Calculate new average
            if (hourAverageCount >= 42) {
                newAverage = (currentAverage + currentOnline) / 2;
                newCaptains = (currentCaptains + captainsOnline) / 2;
            } else if (currentAverage > 0) {
                newAverage = (currentAverage * hourAverageCount + currentOnline) / (hourAverageCount + 1);
                newCaptains = (currentCaptains * hourAverageCount + captainsOnline) / (hourAverageCount + 1);
            } else {
                newAverage = currentOnline;
                newCaptains = captainsOnline;
            }

            // Increment hourAverageCount unless it has a week of data in which case it's reset to 1
            if (currentMinute === '50') {
                if (hourAverageCount >= 42) {
                    hourAverageCount = 1;
                }
            } else {
                hourAverageCount += 1;
            }

            // Update activity
            const updateQuery = 'UPDATE guilds SET average' + currentHour + ' = ?, captains' + currentHour + ' = ?, averageCount' + currentHour + ' = ? WHERE uuid = ?';
            await runAsync(updateQuery, [newAverage, newCaptains, hourAverageCount, guildUuid]);
        }
    } catch (err) {
        console.error('Error updating guild activity', err);
    }
}

async function updatePlayerActivity() {
    try {
        const now = new Date();
        const currentTimestamp = now.toISOString();

        // Get current average at current hour
        const query = 'SELECT uuid, sessionStart, weeklyPlaytime, averagePlaytime, averageCount FROM players WHERE weeklyPlaytime != 0 OR sessionStart IS NOT NULL';
        // Get all players and their weekly playtimes
        const players = await allAsync(query);

        for (const player of players) {
            let newSessionStart = null;
            let newWeeklyPlaytime = player.weeklyPlaytime;

            // If the player is still online at the end of the week, add their current session to total playtime and set
            // their session start to now
            if (player.sessionStart !== null) {
                const sessionStart = new Date(player.sessionStart);
                const sessionDurationHours = (now - sessionStart) / (1000 * 60 * 60);

                newWeeklyPlaytime += sessionDurationHours;
                newSessionStart = currentTimestamp;
            }

            let newAverage;

            // Calculate their average playtime, reset the weekly average every 4 weeks
            if (player.averageCount >= 4) {
                newAverage = player.averagePlaytime + newWeeklyPlaytime / 2;
            } else if (player.averageCount > 0) {
                newAverage = (player.averagePlaytime * player.averageCount + newWeeklyPlaytime) / (player.averageCount + 1);
            } else {
                newAverage = newWeeklyPlaytime;
            }

            let newAverageCount = player.averageCount;

            if (newAverageCount >= 4) {
                newAverageCount = 1;
            } else {
                newAverageCount += 1;
            }

            await runAsync('UPDATE players SET sessionStart = ?, weeklyPlaytime = 0, averagePlaytime = ?, averageCount = ? WHERE uuid = ?', [newSessionStart, newAverage, newAverageCount, player.uuid]);
        }
    } catch (err) {
        console.error('Error updating player activity', err);
    }
}

// When the bot calls the api for player info, we can update the database
// information for that player
// player: The details of the player to update
async function updatePlayer(player) {
    // Check if the UUID exists in the players table
    const existingPlayer = await getAsync('SELECT * FROM players WHERE uuid = ?', [player.uuid]);

    if (existingPlayer) {
        // Update existing player, don't update online or lastLogin as that is handled elsewhere
        await runAsync('UPDATE players SET username = ?, guildUuid = ?, guildRank = ?, supportRank = ?, veteran = ?, wars = ?, highestCharacterLevel = ? WHERE uuid = ?', [player.username, player.guildUuid, player.guildRank, player.supportRank, player.veteran, player.wars, player.highestCharcterLevel, player.uuid]);
    } else {
        // Insert new player
        await runAsync('INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 0, -1, 0)', [player.uuid, player.username, player.guildUuid, player.guildRank, player.online, player.lastLogin, player.supportRank, player.veteran, player.wars, player.highestCharcterLevel]);
    }
}

// Get the information for last login timestamps for each member of a guild.
// First call the API to update the list of guild members to ensure the database is up to date and then 
async function getLastLogins(guild) {
    await waitForRateLimit();

    const response = await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${guild}`);

    remainingRateLimit = response.headers['ratelimit-remaining'];
    rateLimitReset = response.headers['ratelimit-reset'];
    const guildJson = response.data;

    // If we got a valid response, then update the members of the guild
    if (guildJson && guildJson.name) {
        for (const rank in guildJson.members) {
            if (rank === 'total') continue;
    
            const rankMembers = guildJson.members[rank];
    
            for (const member in rankMembers) {
                const guildMember = rankMembers[member];

                const existingPlayer = await getAsync('SELECT * FROM players WHERE uuid = ?', [guildMember.uuid]);

                if (existingPlayer) {
                    await runAsync('UPDATE players SET username = ?, guildUuid = ?, guildRank = ? WHERE uuid = ?', [member, guild, rank, guildMember.uuid]);
                } else {
                    await waitForRateLimit();

                    const playerResponse = await axios.get(`https://api.wynncraft.com/v3/player/${guildMember.uuid}?fullResult=True`);

                    remainingRateLimit = playerResponse.headers['ratelimit-remaining'];
                    rateLimitReset = playerResponse.headers['ratelimit-reset'];
                    const playerJson = playerResponse.data;

                    if (playerJson && playerJson.username) {
                        let highestCharcterLevel = 0;

                        for (const character in playerJson.characters) {
                            const characterJson = playerJson.characters[character];

                            // If character level is higher than current tracked highest, set as new highest
                            if (characterJson.level > highestCharcterLevel) {
                                highestCharcterLevel = characterJson.level;
                            }
                        }

                        const veteran = playerJson.veteran ? playerJson.veteran : 0;

                        await runAsync('INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 0, -1, 0)', [playerJson.uuid, playerJson.username, guild, rank, playerJson.online, playerJson.lastJoin, playerJson.supportRank, veteran, playerJson.globalData.wars, highestCharcterLevel]);
                    }
                }
            }
        }
    }

    const rows = await allAsync('SELECT username, guildRank, online, lastLogin FROM players WHERE guildUuid = ?', [guild]);

    const playerLastLogins = rows.map(row => {
        const {
            username,
            guildRank,
            online,
            lastLogin,
        } = row;

        return new PlayerLastLogin(username, guildRank, online, lastLogin);
    });
    
    playerLastLogins.sort((a, b) => a.compareTo(b));

    return playerLastLogins;
}

// Create a backup of the database
async function createDatabaseBackup(backupFilename) {
    const sourceFile = 'database/database.db';
    const destinationFile = `database/${backupFilename}`;

    try {
        await fs.copyFile(sourceFile, destinationFile);
        console.log('Backup created successfully.');
    } catch (err) {
        console.error('Error creating backup:', err);
    }
}

async function runFreeFunctions() {
    await waitForRateLimit();

    // If the player weekly activity is being updated, don't update the online players list
    if (!pausePlayerUpdates) {
        console.log('Updating online players');

        // Get all of the online players by UUID
        const response = await axios.get('https://api.wynncraft.com/v3/player?identifier=uuid');

        remainingRateLimit = response.headers['ratelimit-remaining'];
        rateLimitReset = response.headers['ratelimit-reset'];
        const onlinePlayers = response.data;

        if (onlinePlayers) {
            await handleOnlinePlayers(onlinePlayers.players);
        }

        console.log('Updated online players');
    }

    runFreeFunctions();
}

async function runScheduledFunctions() {
    let now = new Date();

    // Update every 10 minutes
    if (now.getUTCMinutes() % 10 == 0) {
        // Updates the average online players & captain+'s for each guild.
        console.log(`Updating guild activity at ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`);
        await updateGuildActivity(now.getUTCHours().toString().padStart(2, '0'), now.getUTCMinutes().toString().padStart(2, '0'));

        console.log(`Updated guild activity for ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`);
    }

    // Update hourly
    if (now.getUTCMinutes() === 0) {
        await waitForRateLimit();
        console.log('Updating list of all guilds');

        // Get all guilds
        const response = await axios.get('https://api.wynncraft.com/v3/guild/list/guild?identifier=uuid');
    
        remainingRateLimit = response.headers['ratelimit-remaining'];
        rateLimitReset = response.headers['ratelimit-reset'];
        const guildList = response.data;

        if (guildList) {
            await updateGuildList(guildList);
        }

        console.log('Updated guild list');
    }

    // Update daily
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        // Creates a copy of the database
        const dayOfWeek = DAYS_OF_WEEK[now.getUTCDay()];
        const backupFilename = `database_backup_${dayOfWeek}.db`;

        console.log(`Creating database backup ${dayOfWeek}`);
        await createDatabaseBackup(backupFilename);

        console.log(`Created database backup ${dayOfWeek}`);
    }

    // Update weekly
    if (now.getUTCDay() === 6) {
        console.log('Updating all player activity');

        pausePlayerUpdates = true;
        await updatePlayerActivity();
        pausePlayerUpdates = false;
        
        console.log('Updated all player activity');

    }

    now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    // Run this function again at the next minute
    setTimeout(runScheduledFunctions, secondsToNextMinute * 1000);
}

async function waitForRateLimit() {
    if (remainingRateLimit === 0) {
        const timeToWait = (rateLimitReset - Date.now()) * 1000;

        await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }
}

// Setup the two tables
async function setup() {
    // If the guilds table does not exist, create it
    let guildsCreateQuery = 'CREATE TABLE IF NOT EXISTS guilds (uuid TEXT NOT NULL PRIMARY KEY, name TEXT, prefix TEXT, ';

    for (let i = 0; i < 24; i++) {
        guildsCreateQuery += `average${i.toString().padStart(2, '0')} DECIMAL, captains${i.toString().padStart(2, '0')} DECIMAL, averageCount${i.toString().padStart(2, '0')} INT`;

        if (i !== 23) {
            guildsCreateQuery += ', ';
        }
    }

    guildsCreateQuery += ');';

    await runAsync(`${guildsCreateQuery}`);
    await runAsync('CREATE INDEX IF NOT EXISTS idx_guildName ON guilds (name);');

    // If the players table does not exist, create it
    await runAsync('CREATE TABLE IF NOT EXISTS players (uuid TEXT NOT NULL PRIMARY KEY, username TEXT, guildUuid TEXT, guildRank TEXT, online BOOLEAN, lastLogin TEXT, supportRank TEXT, veteran BOOLEAN, wars INT, highestCharacterLevel INT, sessionStart TEXT, weeklyPlaytime DECIMAL, averagePlaytime DECIMAL, averageCount INT, FOREIGN KEY (guildUuid) REFERENCES guilds(uuid));');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_playerGuild ON players (guildUuid);');

    console.log('Database setup complete');

    runFreeFunctions();
    runScheduledFunctions();
}

module.exports = {
    findGuild,
    findPlayer,
    updatePlayer,
    getLastLogins,
    setup,
};