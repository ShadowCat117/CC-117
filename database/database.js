const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database('database/database.db');
const utilities = require('../functions/utilities');
const PlayerLastLogin = require('../message_objects/PlayerLastLogin');
const GuildActiveHours = require('../message_objects/GuildActiveHours');
const TrackedGuild = require('../message_objects/TrackedGuild');
const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
const priorityGuilds = [];
const priorityPlayers = [];

let pausePlayerUpdates = false;

// Call run queries on the database with promises
async function runAsync(query, params) {
    return new Promise((resolve, reject) => {
        database.run(query, params, function (err) {
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
        database.get(query, params, function (err, rows) {
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
        database.all(query, params, function (err, rows) {
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
async function findGuild(input, force) {
    if (force) {
        const query = 'SELECT uuid, name, prefix FROM guilds WHERE uuid = ?';
        const guilds = await allAsync(query, [input]);

        if (guilds.length === 0 || guilds.length > 1) {
            console.log(
                `${input} does not exist in the table, force was incorrect`,
            );
            return null;
        } else {
            return {
                uuid: guilds[0].uuid,
                name: guilds[0].name,
                prefix: guilds[0].prefix,
            };
        }
    } else {
        let query =
            'SELECT uuid, name, prefix FROM guilds WHERE UPPER(prefix) = UPPER(?)';
        const prefixGuilds = await allAsync(query, [input]);

        if (prefixGuilds.length === 0) {
            query =
                'SELECT uuid, name, prefix FROM guilds WHERE UPPER(name) = UPPER(?)';
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
// guildUuid: The guild to expect the player to be in
async function findPlayer(input, force, guildUuid) {
    if (force) {
        let players;

        if (guildUuid) {
            const query =
                'SELECT uuid, username FROM players WHERE uuid = ? AND guildUuid = ?';
            players = await allAsync(query, [input, guildUuid]);
        } else {
            const query = 'SELECT uuid, username FROM players WHERE uuid = ?';
            players = await allAsync(query, [input]);
        }

        if (players.length === 0 || players.length > 1) {
            console.log(
                `${input} does not exist in the table, force was incorrect`,
            );
            return null;
        } else {
            return {
                uuid: players[0].uuid,
                username: players[0].username,
            };
        }
    } else {
        let players;

        if (guildUuid) {
            const query =
                'SELECT uuid, username, guildUuid, guildRank, supportRank FROM players WHERE UPPER(username) = UPPER(?) AND guildUuid = ?';
            players = await allAsync(query, [input, guildUuid]);
        } else {
            const query =
                'SELECT uuid, username, guildUuid, guildRank, supportRank FROM players WHERE UPPER(username) = UPPER(?)';
            players = await allAsync(query, [input]);
        }

        if (players.length === 0) {
            return null;
        } else if (players.length > 1) {
            const playerUuids = players.map((row) => row.uuid);
            const playerUsernames = players.map((row) => row.username);
            const playerRanks = players.map((row) => row.supportRank);
            const playerGuildRanks = players.map((row) => row.guildRank);
            const playerGuildNames = [];

            for (const row of players) {
                const guildQuery = 'SELECT name FROM guilds WHERE uuid = ?';
                const guild = await getAsync(guildQuery, [row.guildUuid]);
                playerGuildNames.push(guild.name);
            }

            return {
                message: 'Multiple possibilities found',
                playerUuids: playerUuids,
                playerUsernames: playerUsernames,
                playerRanks: playerRanks,
                playerGuildRanks: playerGuildRanks,
                playerGuildNames: playerGuildNames,
            };
        } else {
            return {
                uuid: players[0].uuid,
                username: players[0].username,
            };
        }
    }
}

// Set all online players
async function handleOnlinePlayers(onlinePlayers) {
    try {
        const now = new Date();
        const uuids = Object.keys(onlinePlayers);

        for (const uuid of uuids) {
            const existingPlayer = await getAsync(
                'SELECT * FROM players WHERE uuid = ?',
                [uuid],
            );

            if (existingPlayer) {
                const sessionStart = existingPlayer.online
                    ? existingPlayer.sessionStart
                    : now.toISOString();
                // Update existing player, set online to true and lastLogin to current date
                await runAsync(
                    'UPDATE players SET online = true, lastLogin = ?, sessionStart = ? WHERE uuid = ?',
                    [now.toISOString(), sessionStart, uuid],
                );
            } else {
                // Insert new player with available details
                await runAsync(
                    'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, null, null, null, true, ?, null, null, null, 0, 1, ?, 0, -1, 0)',
                    [uuid, now.toISOString(), now.toISOString()],
                );

                // Add to priority so their other details are updated
                if (!priorityPlayers.includes(uuid)) {
                    priorityPlayers.push(uuid);
                }
            }
        }

        console.log('Handling offline players');

        await handleOfflinePlayers(uuids);
    } catch (error) {
        console.error('Error processing data:', error);
    }
}

// Set previously online players as offline
async function handleOfflinePlayers(onlinePlayers) {
    try {
        const now = new Date();

        const placeholders = onlinePlayers.map(() => '?').join(', ');

        // Get all offline players who are online in database
        const offlinePlayers = await allAsync(
            `SELECT uuid, weeklyPlaytime, sessionStart FROM players WHERE uuid NOT IN (${placeholders}) AND online = 1`,
            onlinePlayers,
        );

        // Calculate the session duration for each player and set them as offline
        for (const player of offlinePlayers) {
            const sessionStart = new Date(player.sessionStart);
            const sessionDurationHours =
                (now - sessionStart) / (1000 * 60 * 60);

            // Update weekly playtime and reset session start
            await runAsync(
                'UPDATE players SET online = false, lastLogin = ?, weeklyPlaytime = ?, sessionStart = null WHERE uuid = ?',
                [
                    now.toISOString(),
                    player.weeklyPlaytime + sessionDurationHours,
                    player.uuid,
                ],
            );
        }

        console.log('Updated activity for offline players');
    } catch (error) {
        console.error('Error processing data:', error);
    }
}

// Update the list of all known guilds
async function updateGuildList(guildList) {
    const currentGuildsQuery = 'SELECT uuid FROM guilds';
    const currentGuilds = await allAsync(currentGuildsQuery);
    const guildsInTable = currentGuilds.map((guild) => guild.uuid);

    for (const uuid in guildList) {
        const { name, prefix } = guildList[uuid];

        // If the guild is in the table remove them from the list so they won't be deleted
        if (guildsInTable.includes(uuid)) {
            const index = guildsInTable.indexOf(uuid);
            guildsInTable.splice(index, 1);
        }

        const existingQuery =
            'SELECT uuid, name, prefix FROM guilds WHERE uuid = ?';
        const existing = await getAsync(existingQuery, [uuid]);

        if (
            existing &&
            (existing.name !== name || existing.prefix !== prefix)
        ) {
            // Update the name and prefix if it's different
            const updateQuery =
                'UPDATE guilds SET name = ?, prefix = ? WHERE uuid = ?';
            await runAsync(updateQuery, [name, prefix, uuid]);
        } else if (!existing) {
            // Add new guild
            const insertQuery =
                'INSERT INTO guilds (uuid, name, prefix, average00, captains00, averageCount00, average01, captains01, averageCount01, average02, captains02, averageCount02, average03, captains03, averageCount03, average04, captains04, averageCount04, average05, captains05, averageCount05, average06, captains06, averageCount06, average07, captains07, averageCount07, average08, captains08, averageCount08, average09, captains09, averageCount09, average10, captains10, averageCount10, average11, captains11, averageCount11, average12, captains12, averageCount12, average13, captains13, averageCount13, average14, captains14, averageCount14, average15, captains15, averageCount15, average16, captains16, averageCount16, average17, captains17, averageCount17, average18, captains18, averageCount18, average19, captains19, averageCount19, average20, captains20, averageCount20, average21, captains21, averageCount21, average22, captains22, averageCount22, average23, captains23, averageCount23) VALUES (?, ?, ?, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);';
            await runAsync(insertQuery, [uuid, name, prefix]);
        }
    }

    await deleteGuilds(guildsInTable);
}

// Update the average activity of each guild at the different intervals
async function updateGuildActivity(currentHour, currentMinute) {
    try {
        // Get current average at current hour
        const query =
            'SELECT uuid, average' +
            currentHour +
            ', captains' +
            currentHour +
            ', averageCount' +
            currentHour +
            ' FROM guilds';
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
            const playerQuery =
                'SELECT COUNT(*) as count FROM players WHERE guildUuid = ? AND online = 1';
            const playerResult = await getAsync(playerQuery, [guildUuid]);
            const currentOnline = playerResult.count;

            // Get the players from guild at or above the rank of captain
            const captainRanks = ['captain', 'strategist', 'chief', 'owner'];
            const captainQuery =
                'SELECT COUNT(*) as count FROM players WHERE guildUuid = ? AND online = 1 AND guildRank IN (' +
                captainRanks.map(() => '?').join(',') +
                ')';
            const captainResult = await getAsync(captainQuery, [
                guildUuid,
                ...captainRanks,
            ]);
            const captainsOnline = captainResult.count;

            let newAverage;
            let newCaptains;

            // Calculate new average
            if (hourAverageCount >= 42) {
                newAverage = (currentAverage + currentOnline) / 2;
                newCaptains = (currentCaptains + captainsOnline) / 2;
            } else if (currentAverage > 0) {
                newAverage =
                    (currentAverage * hourAverageCount + currentOnline) /
                    (hourAverageCount + 1);
                newCaptains =
                    (currentCaptains * hourAverageCount + captainsOnline) /
                    (hourAverageCount + 1);
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
            const updateQuery =
                'UPDATE guilds SET average' +
                currentHour +
                ' = ?, captains' +
                currentHour +
                ' = ?, averageCount' +
                currentHour +
                ' = ? WHERE uuid = ?';
            await runAsync(updateQuery, [
                newAverage,
                newCaptains,
                hourAverageCount,
                guildUuid,
            ]);
        }
    } catch (err) {
        console.error('Error updating guild activity', err);
    }
}

// Update the average activity of every player at the end of the week
async function updatePlayerActivity() {
    try {
        const now = new Date();
        const currentTimestamp = now.toISOString();

        // Get all players and their weekly playtimes
        const players = await allAsync(
            'SELECT uuid, sessionStart, weeklyPlaytime, averagePlaytime, averageCount FROM players WHERE sessionStart IS NOT NULL OR weeklyPlaytime > 0',
        );

        for (const player of players) {
            let newSessionStart = null;
            let newWeeklyPlaytime = player.weeklyPlaytime;

            // If the player is still online at the end of the week, add their current session to total playtime and set
            // their session start to now
            if (player.sessionStart !== null) {
                const sessionStart = new Date(player.sessionStart);
                const sessionDurationHours =
                    (now - sessionStart) / (1000 * 60 * 60);

                newWeeklyPlaytime += sessionDurationHours;
                newSessionStart = currentTimestamp;
            }

            let newAverage;

            // Calculate their average playtime, reset the weekly average every 4 weeks
            if (player.averageCount >= 4) {
                newAverage = player.averagePlaytime + newWeeklyPlaytime / 2;
            } else if (player.averageCount > 0) {
                newAverage =
                    (player.averagePlaytime * player.averageCount +
                        newWeeklyPlaytime) /
                    (player.averageCount + 1);
            } else {
                newAverage = newWeeklyPlaytime;
            }

            let newAverageCount = player.averageCount;

            if (newAverageCount >= 4) {
                newAverageCount = 1;
            } else {
                newAverageCount += 1;
            }

            await runAsync(
                'UPDATE players SET sessionStart = ?, weeklyPlaytime = 0, averagePlaytime = ?, averageCount = ? WHERE uuid = ?',
                [newSessionStart, newAverage, newAverageCount, player.uuid],
            );
        }
    } catch (err) {
        console.error('Error updating player activity', err);
    }
}

// Add priority guilds from config files.
// Set guilds, allies and tracked guilds can all be updated since we know bot users use them.
async function setPriorityGuilds() {
    const configsPath = path.join(__dirname, '..', 'configs');

    try {
        // Read all config files
        const configFiles = await fs.readdir(configsPath);

        for (const file of configFiles) {
            const configFilePath = path.join(configsPath, file);

            const data = await fs.readFile(configFilePath, 'utf8');
            const config = JSON.parse(data);

            // Add set guilds
            if (config.guild) {
                if (!priorityGuilds.includes(config.guild)) {
                    priorityGuilds.push(config.guild);
                }
            }

            // Add any allies
            for (const guild of config.allies) {
                if (!priorityGuilds.includes(guild)) {
                    priorityGuilds.push(guild);
                }
            }

            // Add any tracked guilds
            for (const guild of config.trackedGuilds) {
                if (!priorityGuilds.includes(guild)) {
                    priorityGuilds.push(guild);
                }
            }
        }
    } catch (error) {
        console.error('Error setting priority guilds', error);
    }
}

// Add every player that does not have a username in the database to the priority list.
// If a player was added from the online list they won't have a username but do get added to the priority
// automatically there, however the bot may be restarted before they are updated.
async function setPriorityPlayers() {
    const players = await allAsync(
        'SELECT uuid FROM players WHERE username IS NULL',
    );

    for (const player of players) {
        if (!priorityPlayers.includes(player.uuid)) {
            priorityPlayers.push(player.uuid);
        }
    }
}

// Update up to 20 priority guilds
async function updatePriorityGuilds() {
    if (priorityGuilds.length === 0) return;
    console.log('Updating 20 priority guilds');
    let updated = 0;

    for (const guild of priorityGuilds) {
        if (updated === 20) break;

        await utilities.waitForRateLimit();

        let response;

        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/guild/uuid/${guild}`,
            );
        } catch (error) {
            console.error(error);
            continue;
        }

        utilities.updateRateLimit(
            response.headers['ratelimit-remaining'],
            response.headers['ratelimit-reset'],
        );

        const guildJson = response.data;

        if (guildJson && guildJson.name) {
            const memberUuids = [];

            for (const rank in guildJson.members) {
                if (rank === 'total') continue;

                const rankMembers = guildJson.members[rank];

                for (const member in rankMembers) {
                    const guildMember = rankMembers[member];

                    memberUuids.push(guildMember.uuid);

                    // Check if the UUID exists in the players table
                    const existingPlayer = await getAsync(
                        'SELECT * FROM players WHERE uuid = ?',
                        [guildMember.uuid],
                    );

                    if (existingPlayer) {
                        // Update existing player
                        await runAsync(
                            'UPDATE players SET username = ?, guildUuid = ?, guildRank = ? WHERE uuid = ?',
                            [member, guildJson.uuid, rank, guildMember.uuid],
                        );
                    } else {
                        // Insert new player
                        await runAsync(
                            'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, false, null, null, false, null, 0, 1, null, 0, -1, 0)',
                            [guildMember.uuid, member, guildJson.uuid, rank],
                        );
                    }

                    if (!priorityPlayers.includes(guildMember.uuid)) {
                        priorityPlayers.push(guildMember.uuid);
                    }
                }
            }

            await removeGuildMembers(guildJson.uuid, memberUuids);

            updated++;
        } else {
            break;
        }
    }

    for (let i = 0; i < updated; i++) {
        priorityGuilds.shift();
    }

    console.log(`Updated ${updated} priority guilds.`);
}

// Update up to 20 priority players
async function updatePriorityPlayers() {
    if (priorityPlayers.length === 0) return;
    console.log('Updating 20 priority players');
    let updated = 0;

    for (const player of priorityPlayers) {
        if (updated === 20) break;

        await utilities.waitForRateLimit();

        let response;

        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/player/${player}?fullResult=True`,
            );
        } catch (error) {
            console.error(error);
            continue;
        }

        utilities.updateRateLimit(
            response.headers['ratelimit-remaining'],
            response.headers['ratelimit-reset'],
        );
        const playerJson = response.data;

        if (playerJson && playerJson.username) {
            let highestCharcterLevel = 0;

            for (const character in playerJson.characters) {
                const characterJson = playerJson.characters[character];

                // If character level is higher than current tracked highest, set as new highest
                if (characterJson.level > highestCharcterLevel) {
                    highestCharcterLevel = characterJson.level;
                }
            }

            let guildUuid = null;
            let guildRank = null;

            if (playerJson.guild) {
                guildUuid = playerJson.guild.uuid;
                guildRank = playerJson.guild.rank.toLowerCase();
            }

            const veteran = playerJson.veteran ? playerJson.veteran : false;

            const existingPlayer = await getAsync(
                'SELECT * FROM players WHERE uuid = ?',
                [playerJson.uuid],
            );

            if (existingPlayer) {
                const online = existingPlayer.online
                    ? existingPlayer.online
                    : false;
                const lastLogin = existingPlayer.lastLogin
                    ? existingPlayer.lastLogin
                    : playerJson.lastJoin;
                await runAsync(
                    'UPDATE players SET username = ?, guildUuid = ?, guildRank = ?, online = ?, lastLogin = ?, supportRank = ?, veteran = ?, serverRank = ?, wars = ?, highestCharacterLevel = ? WHERE uuid = ?',
                    [
                        playerJson.username,
                        guildUuid,
                        guildRank,
                        online,
                        lastLogin,
                        playerJson.supportRank,
                        veteran,
                        playerJson.rank,
                        playerJson.globalData.wars,
                        highestCharcterLevel,
                        playerJson.uuid,
                    ],
                );
            } else {
                await runAsync(
                    'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, null, 0, -1, 0)',
                    [
                        playerJson.uuid,
                        playerJson.username,
                        guildUuid,
                        guildRank,
                        playerJson.lastJoin,
                        playerJson.supportRank,
                        veteran,
                        playerJson.rank,
                        playerJson.globalData.wars,
                        highestCharcterLevel,
                    ],
                );
            }

            updated++;
        } else {
            break;
        }
    }

    for (let i = 0; i < updated; i++) {
        priorityPlayers.shift();
    }

    console.log(`Updated ${updated} priority players.`);
}

// Delete guilds from the table and remove all references to them in any config files.
async function deleteGuilds(guilds) {
    const deleteQuery = 'DELETE FROM guilds WHERE uuid = ?';
    const configsPath = path.join(__dirname, '..', 'configs');

    for (const guild of guilds) {
        console.log(`Deleting ${guild}`);

        const playerQuery = 'SELECT uuid FROM players WHERE guildUuid = ?';
        const guildMembers = await allAsync(playerQuery, [guild]);
        const memberUuids = guildMembers.map((player) => player.uuid);

        for (const member of memberUuids) {
            const memberQuery =
                'UPDATE players SET guildUuid = ?, guildRank = ? WHERE uuid = ?';
            await runAsync(memberQuery, [null, null, member]);

            if (!priorityPlayers.includes(member)) {
                priorityPlayers.push(member);
            }
        }

        await runAsync(deleteQuery, [guild]);
        console.log(`Deleted ${guild}`);

        // Loop through config files, remove all references to deleted guilds.
        // If set guild, set to null. Remove from allies and trackedGuilds
        try {
            const files = await fs.readdir(configsPath);

            for (const file of files) {
                const filePath = path.join(configsPath, file);

                const data = await fs.readFile(filePath, 'utf8');
                const config = JSON.parse(data);

                if (config['guild'] === guild) {
                    config['guild'] = null;
                }

                if (config['allies'].includes(guild)) {
                    config['allies'] = config['allies'].filter(
                        (allyGuild) => allyGuild !== guild,
                    );
                }

                if (config['trackedGuilds'].includes(guild)) {
                    config['trackedGuilds'] = config['trackedGuilds'].filter(
                        (trackedGuild) => trackedGuild !== guild,
                    );
                }

                fs.writeFile(
                    filePath,
                    JSON.stringify(config, null, 2),
                    'utf-8',
                );
            }
        } catch (error) {
            console.error('Error removing guild from config files: ', error);
        }
    }
}

// Removes players from their guild if they are no longer in the member list
// guild: The UUID of the guild
// members: The UUID's of all the guilds current members
async function removeGuildMembers(guild, members) {
    const placeholders = members.map(() => '?').join(', ');

    const query = `UPDATE players SET guildUuid = NULL, guildRank = NULL WHERE guildUuid = '${guild}' AND uuid NOT IN (${placeholders})`;

    await runAsync(query, members);
}

// When the bot calls the api for player info, we can update the database
// information for that player
// player: The details of the player to update
async function updatePlayer(player) {
    // Check if the UUID exists in the players table
    const existingPlayer = await getAsync(
        'SELECT * FROM players WHERE uuid = ?',
        [player.uuid],
    );

    if (existingPlayer) {
        const online = existingPlayer.online
            ? existingPlayer.online
            : player.online;
        const lastLogin = existingPlayer.lastLogin
            ? existingPlayer.lastLogin
            : player.lastJoin;

        await runAsync(
            'UPDATE players SET username = ?, guildUuid = ?, guildRank = ?, online = ?, lastLogin = ?, supportRank = ?, veteran = ?, serverRank = ?, wars = ?, highestCharacterLevel = ? WHERE uuid = ?',
            [
                player.username,
                player.guildUuid,
                player.guildRank,
                online,
                lastLogin,
                player.supportRank,
                player.veteran,
                player.serverRank,
                player.wars,
                player.highestCharcterLevel,
                player.uuid,
            ],
        );
    } else {
        // Insert new player
        await runAsync(
            'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 0, -1, 0)',
            [
                player.uuid,
                player.username,
                player.guildUuid,
                player.guildRank,
                player.online,
                player.lastLogin,
                player.supportRank,
                player.veteran,
                player.serverRank,
                player.wars,
                player.highestCharcterLevel,
            ],
        );
    }
}

// When the updateguildmembers command is ran, we get a list of all the guild members for that guild and we can update their guild related info
async function updateGuildMembers(uuid, guildMembers) {
    for (const guildMember of guildMembers) {
        // Check if the UUID exists in the players table
        const existingPlayer = await getAsync(
            'SELECT * FROM players WHERE uuid = ?',
            [guildMember.uuid],
        );

        if (existingPlayer) {
            // Update existing player
            await runAsync(
                'UPDATE players SET username = ?, guildUuid = ?, guildRank = ? WHERE uuid = ?',
                [
                    guildMember.username,
                    uuid,
                    guildMember.rank,
                    guildMember.uuid,
                ],
            );
        } else {
            // Insert new player
            await runAsync(
                'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, false, null, null, false, null, 0, 1, null, 0, -1, 0)',
                [
                    guildMember.uuid,
                    guildMember.username,
                    uuid,
                    guildMember.rank,
                ],
            );
        }

        if (!priorityPlayers.includes(guildMember.uuid)) {
            priorityPlayers.push(guildMember.uuid);
        }
    }

    const memberUuids = guildMembers.map((member) => member.uuid);

    await removeGuildMembers(uuid, memberUuids);
}

// Checks for banned players in a guild
// players: Banned players
// guild: Guild UUID to check
async function checkForPlayers(players, guild) {
    const placeholders = players.map(() => '?').join(', ');

    const query = `SELECT username FROM players WHERE guildUuid = '${guild}' AND uuid IN (${placeholders})`;

    const bannedPlayersInGuild = await allAsync(query, players);

    return bannedPlayersInGuild.map((player) => player.username);
}

// Gets the guild members of a given guild
// guild: Guild UUID
async function getGuildMembers(guild) {
    const query = 'SELECT uuid FROM players WHERE guildUuid = ?';

    const guildMembers = await allAsync(query, guild);

    return guildMembers.map((player) => player.uuid);
}

// Get the information for last login timestamps for each member of a guild.
// First call the API to update the list of guild members to ensure the database is up to date and then
// return the information
// guild: Guild UUID
// exemptUuids: List of players who are exempt from inactivity
async function getLastLogins(guild, exemptUuids) {
    await utilities.waitForRateLimit();

    let response;

    try {
        response = await axios.get(
            `https://api.wynncraft.com/v3/guild/uuid/${guild}`,
        );
    } catch (error) {
        console.error(error);
    }

    if (response) {
        utilities.updateRateLimit(
            response.headers['ratelimit-remaining'],
            response.headers['ratelimit-reset'],
        );

        const guildJson = response.data;

        // If we got a valid response, then update the members of the guild
        if (guildJson && guildJson.name) {
            for (const rank in guildJson.members) {
                if (rank === 'total') continue;

                const rankMembers = guildJson.members[rank];

                for (const member in rankMembers) {
                    const guildMember = rankMembers[member];

                    const existingPlayer = await getAsync(
                        'SELECT * FROM players WHERE uuid = ?',
                        [guildMember.uuid],
                    );

                    if (existingPlayer) {
                        await runAsync(
                            'UPDATE players SET username = ?, guildUuid = ?, guildRank = ? WHERE uuid = ?',
                            [member, guild, rank, guildMember.uuid],
                        );
                    } else {
                        await utilities.waitForRateLimit();

                        let playerResponse;

                        try {
                            playerResponse = await axios.get(
                                `https://api.wynncraft.com/v3/player/${guildMember.uuid}?fullResult=True`,
                            );
                        } catch (error) {
                            console.error(error);
                            continue;
                        }

                        utilities.updateRateLimit(
                            response.headers['ratelimit-remaining'],
                            response.headers['ratelimit-reset'],
                        );

                        const playerJson = playerResponse.data;

                        if (playerJson && playerJson.username) {
                            let highestCharcterLevel = 0;

                            for (const character in playerJson.characters) {
                                const characterJson =
                                    playerJson.characters[character];

                                // If character level is higher than current tracked highest, set as new highest
                                if (
                                    characterJson.level > highestCharcterLevel
                                ) {
                                    highestCharcterLevel = characterJson.level;
                                }
                            }

                            const veteran = playerJson.veteran
                                ? playerJson.veteran
                                : false;

                            await runAsync(
                                'INSERT INTO players (uuid, username, guildUuid, guildRank, online, lastLogin, supportRank, veteran, serverRank, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime, averageCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, 0, -1, 0)',
                                [
                                    playerJson.uuid,
                                    playerJson.username,
                                    guild,
                                    rank,
                                    playerJson.online,
                                    playerJson.lastJoin,
                                    playerJson.supportRank,
                                    veteran,
                                    playerJson.rank,
                                    playerJson.globalData.wars,
                                    highestCharcterLevel,
                                ],
                            );
                        }
                    }
                }
            }
        }
    }

    const rows = await allAsync(
        'SELECT uuid, username, guildRank, online, lastLogin, highestCharacterLevel FROM players WHERE guildUuid = ?',
        [guild],
    );

    const playerLastLogins = rows.map((row) => {
        const { uuid, guildRank, online, lastLogin, highestCharacterLevel } =
            row;

        let username = row.username;

        if (exemptUuids.includes(uuid)) {
            username += '*';
        }

        return new PlayerLastLogin(
            uuid,
            username,
            guildRank,
            online,
            lastLogin,
            highestCharacterLevel,
        );
    });

    playerLastLogins.sort((a, b) => a.compareTo(b));

    return playerLastLogins;
}

// Gets the active hours for a specific guild.
async function getActiveHours(guild, timezoneOffset, sortByActivity) {
    const guildActiveHours = [];

    for (let i = 0; i < 24; i++) {
        const currentHour = i.toString().padStart(2, '0');
        const averageKey = 'average' + currentHour;
        const captainsKey = 'captains' + currentHour;

        const query =
            'SELECT ' +
            averageKey +
            ', ' +
            captainsKey +
            ' FROM guilds WHERE uuid = ?';
        const result = await getAsync(query, [guild]);

        if (result[averageKey] !== null && result[averageKey] !== -1) {
            guildActiveHours.push(
                new GuildActiveHours(
                    currentHour,
                    result[averageKey],
                    result[captainsKey],
                    timezoneOffset,
                ),
            );
        }
    }

    if (sortByActivity) {
        guildActiveHours.sort((a, b) => a.compareToActivity(b));
    } else {
        guildActiveHours.sort((a, b) => a.compareToTime(b));
    }

    return guildActiveHours;
}

// Returns the timestamp for when a player was last online.
// An assumption is made from the caller that the player is offline.
async function getLastLogin(player) {
    const row = await getAsync('SELECT lastLogin FROM players WHERE uuid = ?', [
        player,
    ]);

    if (row) {
        return row.lastLogin;
    } else {
        return null;
    }
}

// Returns the most recently seen offline players in a guild.
// Only returns the x most recent where x is determined by the count parameter
async function getRecentPlayers(guild, count) {
    const row = await allAsync(
        'SELECT username, lastLogin FROM players WHERE guildUuid = ? AND online = 0 ORDER BY lastLogin DESC LIMIT ?',
        [guild, count],
    );

    return row;
}

// Returns the number of wars a player has participated in as part of the guild.
// Note, currently the database stores all wars not guild specific. This may or may not be changed.
async function getWars(player) {
    const row = await getAsync('SELECT wars FROM players WHERE uuid = ?', [
        player,
    ]);

    if (row) {
        return row.wars;
    } else {
        return 0;
    }
}

// Returns the average playtime of the requested player.
// If no playtime has yet been calculated it will return the playtime for the current week.
async function getAveragePlaytime(player) {
    const row = await getAsync(
        'SELECT sessionStart, weeklyPlaytime, averagePlaytime FROM players WHERE uuid = ?',
        [player],
    );

    if (!row) {
        return -1;
    } else {
        if (row.averagePlaytime !== -1) {
            return row.averagePlaytime;
        } else {
            // No average playtime yet, use current weekly playtime
            let weeklyPlaytime = row.weeklyPlaytime;

            // If in an active session, add current sessions playtime
            if (row.sessionStart) {
                const now = new Date();
                const sessionStart = new Date(row.sessionStart);
                const sessionDurationHours =
                    (now - sessionStart) / (1000 * 60 * 60);

                weeklyPlaytime += sessionDurationHours;
            }

            return weeklyPlaytime;
        }
    }
}

// Returns the amount of hours played in the current week for the requested player
async function getWeeklyPlaytime(player) {
    const row = await getAsync(
        'SELECT weeklyPlaytime FROM players WHERE uuid = ?',
        [player],
    );

    if (!row) {
        return 0;
    } else {
        return row.weeklyPlaytime;
    }
}

// Returns a list of TrackedGuild objects, for every guild passed in.
async function getGuildActivities(guilds) {
    const trackedGuilds = [];
    let averageQuery = 'SELECT uuid, name, prefix';

    for (let i = 0; i < 24; i++) {
        const currentHour = i.toString().padStart(2, '0');
        const averageKey = 'average' + currentHour;
        const captainsKey = 'captains' + currentHour;

        averageQuery += ', ' + averageKey + ', ' + captainsKey;
    }

    const placeholders = guilds.map(() => '?').join(', ');

    averageQuery += ` FROM guilds WHERE uuid IN (${placeholders})`;

    const averageResult = await allAsync(averageQuery, guilds);

    for (const guild in averageResult) {
        const trackedGuild = averageResult[guild];

        let totalAverageOnline = 0;
        let totalAverageCaptains = 0;
        let divideBy = 0;

        for (let i = 0; i < 24; i++) {
            const currentHour = i.toString().padStart(2, '0');
            const averageKey = 'average' + currentHour;
            const captainsKey = 'captains' + currentHour;

            const hourAverageOnline = trackedGuild[averageKey];
            const hourAverageCaptains = trackedGuild[captainsKey];

            if (hourAverageOnline !== -1) {
                totalAverageOnline += hourAverageOnline;
                totalAverageCaptains += hourAverageCaptains;

                divideBy++;
            }
        }

        if (divideBy !== 0) {
            const averageOnline = totalAverageOnline / divideBy;
            const averageCaptains = totalAverageCaptains / divideBy;
            let currentOnline = 0;
            let currentCaptains = 0;

            const onlineMembers = await getOnlineGuildMembers(
                trackedGuild.uuid,
            );

            for (const member in onlineMembers) {
                currentOnline++;

                if (
                    onlineMembers[member].guildRank !== 'recruit' &&
                    onlineMembers[member].guildRank !== 'recruiter'
                ) {
                    currentCaptains++;
                }
            }

            trackedGuilds.push(
                new TrackedGuild(
                    trackedGuild.name,
                    trackedGuild.prefix,
                    averageOnline,
                    averageCaptains,
                    currentOnline,
                    currentCaptains,
                ),
            );
        }
    }

    trackedGuilds.sort((a, b) => a.compareTo(b));

    return trackedGuilds;
}

// Returns the average online players for a single guild
async function getGuildActivity(guild) {
    let averageQuery = 'SELECT ';

    for (let i = 0; i < 24; i++) {
        const currentHour = i.toString().padStart(2, '0');
        const averageKey = 'average' + currentHour;
        const captainsKey = 'captains' + currentHour;

        averageQuery += averageKey + ', ' + captainsKey;

        if (i !== 23) {
            averageQuery += ', ';
        }
    }

    averageQuery += ' FROM guilds WHERE uuid = ?';

    const averageResult = await getAsync(averageQuery, [guild]);

    let totalAverageOnline = 0;
    let divideBy = 0;

    for (let i = 0; i < 24; i++) {
        const currentHour = i.toString().padStart(2, '0');
        const averageKey = 'average' + currentHour;

        const hourAverageOnline = averageResult[averageKey];

        if (hourAverageOnline !== -1) {
            totalAverageOnline += hourAverageOnline;

            divideBy++;
        }
    }

    let averageOnline = 0;

    if (divideBy !== 0) {
        averageOnline = totalAverageOnline / divideBy;
    }

    return averageOnline;
}

// Gets all of the online members in a guild
// guild: Guild UUID
async function getOnlineGuildMembers(guild) {
    const query =
        'SELECT guildRank FROM players WHERE online = 1 AND guildUuid = ?';

    return await allAsync(query, guild);
}

// Returns all the player info that is used in updating roles
async function getAllPlayerInfo() {
    const query = `
        SELECT p.username, p.guildUuid, p.guildRank, p.supportRank, p.veteran, p.serverRank, p.highestCharacterLevel, g.prefix
        FROM players p
        LEFT JOIN guilds g ON p.guildUuid = g.uuid;
        `;

    const results = await allAsync(query);

    const playerInfoMap = new Map();
    results.forEach((row) => {
        const {
            username,
            guildUuid,
            guildRank,
            supportRank,
            veteran,
            serverRank,
            highestCharacterLevel,
            prefix,
        } = row;
        playerInfoMap.set(username, {
            username: username,
            guildUuid: guildUuid,
            guildRank: guildRank,
            guildPrefix: prefix,
            supportRank: supportRank,
            veteran: veteran,
            serverRank: serverRank,
            highestCharacterLevel: highestCharacterLevel,
        });
    });

    return playerInfoMap;
}

// Returns player info that is relevant to promotions
// guild: Guild UUID
async function getPromotionInfo(guild) {
    const query =
        'SELECT uuid, wars, highestCharacterLevel, sessionStart, weeklyPlaytime, averagePlaytime FROM players WHERE guildUuid = ?';

    return await allAsync(query, [guild]);
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

// Runs the online player check every 10 seconds.
// Separate to runUpdateFunctions as we don't want this slowed down by any
// long operations in that function.
async function runOnlinePlayerFunction() {
    await utilities.waitForRateLimit();

    // If the player weekly activity is being updated, don't update the online players list
    if (!pausePlayerUpdates) {
        console.log('Updating online players');

        // Get all of the online players by UUID
        let response;

        try {
            response = await axios.get(
                'https://api.wynncraft.com/v3/player?identifier=uuid',
            );
        } catch (error) {
            console.error(error);
        }

        if (response) {
            utilities.updateRateLimit(
                response.headers['ratelimit-remaining'],
                response.headers['ratelimit-reset'],
            );

            const onlinePlayers = response.data;

            if (onlinePlayers) {
                await handleOnlinePlayers(onlinePlayers.players);
            }
        }

        console.log('Updated online players');
    }

    // Run the function every 10 seconds
    const now = new Date();
    const remainingSeconds = 10 - (now.getUTCSeconds() % 10);

    setTimeout(runOnlinePlayerFunction, remainingSeconds * 1000);
}

// Calls various update functions every minute. (Or more if an operation takes too long)
async function runUpdateFunctions() {
    let now = new Date();
    await updatePriorityGuilds();
    await updatePriorityPlayers();

    // Update every 5 minutes
    if (now.getUTCMinutes() % 5 === 0) {
        await setPriorityPlayers();
    }

    // Update every 10 minutes
    if (now.getUTCMinutes() % 10 === 0) {
        // Updates the average online players & captain+'s for each guild.
        console.log(
            `Updating guild activity at ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
        );
        await updateGuildActivity(
            now.getUTCHours().toString().padStart(2, '0'),
            now.getUTCMinutes().toString().padStart(2, '0'),
        );

        console.log(
            `Updated guild activity for ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
        );
    }

    // Update twice an hour
    if (now.getUTCMinutes() % 30 === 0) {
        await setPriorityGuilds();
    }

    // Update hourly
    if (now.getUTCMinutes() === 0) {
        await utilities.waitForRateLimit();
        console.log('Updating list of all guilds');

        // Get all guilds
        let response;

        try {
            response = await axios.get(
                'https://api.wynncraft.com/v3/guild/list/guild?identifier=uuid',
            );
        } catch (error) {
            console.error(error);
        }

        if (response) {
            utilities.updateRateLimit(
                response.headers['ratelimit-remaining'],
                response.headers['ratelimit-reset'],
            );

            const guildList = response.data;

            // Make sure there are guilds, once the API returned no guilds so don't want it to delete all guilds
            if (guildList && Object.keys(guildList).length !== 0) {
                await updateGuildList(guildList);
            }
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

    now = new Date();
    const secondsToNextMinute = 60 - now.getUTCSeconds();

    // Run this function again at the next minute
    setTimeout(runUpdateFunctions, secondsToNextMinute * 1000);
}

// Runs the update player activity function weekly
async function runPlayerActivityFunction() {
    let now = new Date();

    // Update weekly
    if (
        now.getUTCDay() === 1 &&
        now.getUTCHours() === 0 &&
        now.getUTCMinutes() === 0
    ) {
        console.log('Updating all player activity');

        pausePlayerUpdates = true;
        await updatePlayerActivity();
        pausePlayerUpdates = false;

        console.log('Updated all player activity');
    }

    now = new Date();
    const timeUntilNextHour =
        (60 - now.getUTCMinutes()) * 60 * 1000 -
        (now.getUTCSeconds() * 1000 + now.getUTCMilliseconds());

    // Run this function again at the next hour
    setTimeout(runPlayerActivityFunction, timeUntilNextHour);
}

// Setup the two tables
async function setup() {
    // If the guilds table does not exist, create it
    let guildsCreateQuery =
        'CREATE TABLE IF NOT EXISTS guilds (uuid TEXT NOT NULL PRIMARY KEY, name TEXT, prefix TEXT, ';

    for (let i = 0; i < 24; i++) {
        guildsCreateQuery += `average${i.toString().padStart(2, '0')} DECIMAL, captains${i.toString().padStart(2, '0')} DECIMAL, averageCount${i.toString().padStart(2, '0')} INT`;

        if (i !== 23) {
            guildsCreateQuery += ', ';
        }
    }

    guildsCreateQuery += ');';

    await runAsync(`${guildsCreateQuery}`);
    await runAsync(
        'CREATE INDEX IF NOT EXISTS idx_guildName ON guilds (name);',
    );

    // If the players table does not exist, create it
    await runAsync(
        'CREATE TABLE IF NOT EXISTS players (uuid TEXT NOT NULL PRIMARY KEY, username TEXT, guildUuid TEXT, guildRank TEXT, online BOOLEAN, lastLogin TEXT, supportRank TEXT, veteran BOOLEAN, serverRank TEXT, wars INT, highestCharacterLevel INT, sessionStart TEXT, weeklyPlaytime DECIMAL, averagePlaytime DECIMAL, averageCount INT, FOREIGN KEY (guildUuid) REFERENCES guilds(uuid));',
    );
    await runAsync(
        'CREATE INDEX IF NOT EXISTS idx_playerGuild ON players (guildUuid);',
    );

    console.log('Database setup complete');

    runOnlinePlayerFunction();
    runUpdateFunctions();
    runPlayerActivityFunction();
}

module.exports = {
    findGuild,
    findPlayer,
    updatePlayer,
    updateGuildMembers,
    checkForPlayers,
    getGuildMembers,
    getLastLogins,
    getActiveHours,
    getLastLogin,
    getRecentPlayers,
    getWars,
    getAveragePlaytime,
    getWeeklyPlaytime,
    getGuildActivities,
    getGuildActivity,
    getAllPlayerInfo,
    getPromotionInfo,
    setup,
};
