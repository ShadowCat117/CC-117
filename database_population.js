const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs').promises;
const path = require('path');
let freeFunctionRuns = 0;
let currentGuildIndex = 0;
let hitLimit = false;
let skipPriorityPlayers = false;
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Call run queries on the database with promises
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

// Call get queries on the database with promises
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

// Call all queries on the database with promises

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

// Update the database with all of the online players
async function updateOnlinePlayers() {
    try {
        // Get all of the online players by UUID
        const onlinePlayers = (await axios.get('https://api.wynncraft.com/v3/player?identifier=uuid')).data;
    
        // FIXME: May need to handle API limit better
        if (onlinePlayers) {
            // Set everyone as offline if they aren't in the online list
            await setOfflinePlayers(onlinePlayers.players);

            // Update everyone who is online
            const newPlayers = await updatePlayerStatus(onlinePlayers.players, onlinePlayers.total);
        
            // If they aren't in the database all of their available stats will also be added
            if (newPlayers) {
                for (const newPlayer of newPlayers) {
                    await updatePlayer(newPlayer);
                }
            }
        }    
    } catch (error) {
        console.error(`Error updating online players: ${error}`);
    }
}

// Sets players as offline
async function setOfflinePlayers(onlinePlayers) {
    // Get all players who were online at last check
    const selectQuery = 'SELECT UUID FROM players WHERE isOnline = 1';

    const rows = await allAsync(selectQuery, []);

    const onlineUUIDs = [];

    // Make a list of all online players by UUID
    for (const player in onlinePlayers) {
        onlineUUIDs.push(player);
    }

    // Loop through all previously online players
    for (const player of rows) {
        // If they are not in the current online list, set them as offline
        if (!onlineUUIDs.includes(player.UUID)) {
            await runAsync('UPDATE players SET isOnline = 0, onlineWorld = NULL WHERE UUID = ?', [player.UUID]);
        }
    }
}

// Updates online players to set their online status to online and set what world they are currently on
async function updatePlayerStatus(players, playersCount) {
    return new Promise((resolve, reject) => {
        const playersToUpdate = [];

        let processedCount = 0;

        const processPlayer = (playerUUID, worldNumber) => {
            // Get player by UUID
            db.get('SELECT * FROM players WHERE UUID = ?', playerUUID, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // Update their online status
                    const currentDate = new Date().toISOString().split('T')[0];
                    db.run('UPDATE players SET isOnline = 1, lastJoin = ?, onlineWorld = ? WHERE UUID = ?', [currentDate, worldNumber, playerUUID], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        processedCount++;

                        // If all players have been processed, return
                        if (processedCount === playersCount) {
                            resolve(playersToUpdate);
                        }
                    });
                } else {
                    // They aren't in the database, they will need to be added to the database with all current stats
                    playersToUpdate.push(playerUUID);

                    processedCount++;
                    // If all players have been processed, return
                    if (processedCount === playersCount) {
                        resolve(playersToUpdate);
                    }
                }
            });
        };
        
        // Process every player in the online list
        for (const player in players) {
            processPlayer(player, players[player]);
        }
    });
}

// Updates players who are on the priority list
async function updatePriorityPlayers() {
    if (skipPriorityPlayers) return;
    
    const filePath = path.join(__dirname, 'updatePlayers.json');

    try {
        let updatePlayersFile = {};
        const updatedPlayers = [];

        try {
            // Get the priority players file
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updatePlayersFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Error reading priority players file.');
            let fileData = await fs.readFile(filePath, 'utf-8');

            // Attempt to fix an error where the file becomes unreadable
            if (err instanceof SyntaxError && fileData.startsWith('{"players":[]} [')) {
                const fixedData = '{"players":' + fileData.substring(15);
                updatePlayersFile = JSON.parse(fixedData);
                await fs.writeFile(filePath, fixedData, 'utf-8');

                try {
                    // Try and access again after attempting to fix
                    await fs.access(filePath);
                    fileData = await fs.readFile(filePath, 'utf-8');
                    updatePlayersFile = JSON.parse(fileData);
                    console.log('Fixed priority players file');
                } catch (err) {
                    console.log('Error reading "fixed" priority players file.');
                    return;
                }
            } else {
                console.log('Unable to fix priority players file.');
                return;
            }
        }

        // Get priority players from file
        const priorityPlayers = updatePlayersFile.players;
        const maxToUpdate = 100;

        let updated = 0;

        if (priorityPlayers.length > 0) {
            console.log('Updating priority players');

            // Update priority players
            for (const priorityPlayer of priorityPlayers) {
                if (hitLimit) break;
                if (updated === maxToUpdate) break;

                // Update the player
                await updatePlayer(priorityPlayer);

                if (!hitLimit) {
                    // Add player to updated players list
                    updatedPlayers.push(priorityPlayer);
                    updated++;
                }
            }

            // Read file again
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updatePlayersFile = JSON.parse(fileData);

            // Filter file based on who has been updated
            updatePlayersFile.players = updatePlayersFile.players.filter(player => !updatedPlayers.includes(player));

            // Save file
            const updatedData = JSON.stringify(updatePlayersFile);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            console.log('Updated priority players.');
        }
    } catch (error) {
        console.error('Error updating priority players', error);
    }
}

// Update a players stats from the API
async function updatePlayer(playerName) {
    if (hitLimit) return;

    try {
        // Get the full result of the player stats
        const playerJson = (await axios.get(`https://api.wynncraft.com/v3/player/${playerName}?fullResult=True`)).data;

        // FIXME: May need to handle API limit better
        if (!playerJson) {
            hitLimit = true;
            return;
        }

        // Player has no username, likely invalid call
        if (!playerJson.username) {
            return;
        }

        // Try and find the player in the database
        const selectQuery = 'SELECT * FROM players WHERE UUID = ?';
        const selectParams = [playerJson.uuid];

        const row = await getAsync(selectQuery, selectParams);

        // Handle VIP+
        let supportRank = playerJson.supportRank ? playerJson.supportRank.toUpperCase() : null;
        
        if (supportRank === 'VIPPLUS') {
            supportRank = 'VIP+';
        }

        const guildName = playerJson.guild ? playerJson.guild.name : null;
        const guildRank = playerJson.guild ? playerJson.guild.rank : null;
        let highestClassLevel = 0;
        let totalCombatLevel = 0;

        // Find highest character level and get total combat level across all characters
        for (const character in playerJson.characters) {
            const characterJson = playerJson.characters[character];

            // If character level is higher than current tracked highest, set as new highest
            if (characterJson.level > highestClassLevel) {
                highestClassLevel = characterJson.level;
            }

            // Add to the total combat level
            totalCombatLevel += characterJson.level;
        }

        const isOnline = playerJson.online ? 1 : 0;
        const veteran = playerJson.veteran ? 1 : 0;

        if (row) {
            // They already exist in table, update with latest stats from API
            const contributedGuildXP = row.contributedGuildXP !== null ? row.contributedGuildXP : null;
            const guildJoinDate = row.guildJoinDate !== null ? row.guildJoinDate : null;

            const insertQuery = 'INSERT OR REPLACE INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const insertParams = [
                playerJson.uuid,
                playerJson.username,
                guildName,
                guildRank,
                supportRank,
                veteran,
                JSON.stringify(playerJson.lastJoin).split('T')[0].slice(1),
                isOnline,
                playerJson.server,
                contributedGuildXP,
                highestClassLevel,
                guildJoinDate,
                playerJson.rank,
                JSON.stringify(playerJson.firstJoin).split('T')[0].slice(1),
                playerJson.globalData.completedQuests,
                totalCombatLevel,
                playerJson.playtime,
                playerJson.globalData.wars,
            ];

            await runAsync(insertQuery, insertParams);

            return;
        } else {
            // They don't exist in the table, add them
            const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const insertParams = [
                playerJson.uuid,
                playerJson.username,
                guildName,
                guildRank,
                supportRank,
                veteran,
                JSON.stringify(playerJson.lastJoin).split('T')[0].slice(1),
                isOnline,
                playerJson.server,
                0,
                highestClassLevel,
                null,
                playerJson.rank,
                JSON.stringify(playerJson.firstJoin).split('T')[0].slice(1),
                playerJson.globalData.completedQuests,
                totalCombatLevel,
                playerJson.playtime,
                playerJson.globalData.wars,
            ];

            await runAsync(insertQuery, insertParams);

            return;
        }
    } catch (error) {
        console.error(`Error fetching ${playerName}:`, error.code);
        return;
    }
}

// Update the list of all guilds
async function updateGuilds() {
    if (hitLimit) return;

    try {
        // Get guild list from API
        const guildJson = (await axios.get('https://api.wynncraft.com/v3/guild/list/guild')).data;

        // FIXME: May need to handle API limit better
        if (!guildJson) {
            hitLimit = true;
            return;
        }

        // Get all guild names
        const guildNames = Object.keys(guildJson);

        try {
            // Get all guilds from the table
            const query = 'SELECT name FROM guilds';
            const rows = await allAsync(query, []);

            // Get existing guilds in the table
            const existingGuildNames = rows.map((row) => row.name);

            // Find guilds that haven't been added to table yet
            const guildsNotInTable = guildNames.filter(
                (name) => !existingGuildNames.includes(name),
            );

            // Find guilds that are in the table but no longer exist
            const guildsToDelete = existingGuildNames.filter(
                (name) => !guildNames.includes(name),
            );

            for (const guildName of guildsToDelete) {
                await deleteGuild(guildName);
            }

            // Update every guild that isn't in the table
            for (const guildName of guildsNotInTable) {
                if (hitLimit) break;

                await updateGuild(guildName);

                guildsNotInTable.pop(guildName);
            }

            // If a guild was unable to be updated now, add it to the priority list so it can be updated later
            for (const guildName of guildsNotInTable) {
                await addPriorityGuild(guildName);
            }
        } catch (err) {
            console.error('Error updating list of guilds: ', err);
        }
    } catch (error) {
        console.error('Error fetching guild list: ', error);
        return;
    }
}

// Update the list of priority guilds
async function updatePriorityGuilds() {
    const filePath = path.join(__dirname, 'updateGuilds.json');
    const configsPath = path.join(__dirname, 'configs');
    const primaryGuilds = [];
    let secondaryGuilds = [];

    try {
        // Read all config files
        const configFiles = await fs.readdir(configsPath);
        let updateGuildsFile = {};

        for (const file of configFiles) {
            const configFilePath = path.join(configsPath, file);

            const data = await fs.readFile(configFilePath, 'utf8');
            const config = JSON.parse(data);

            // Get all set guilds from each config and add to primary guild list
            if (config.guildName && !primaryGuilds.includes(config.guildName)) {
                primaryGuilds.push(config.guildName);
            }

            // Get all allies from each config and add to secondary guild list
            config.allies.forEach(name => {
                if (name && !secondaryGuilds.includes(name) && !primaryGuilds.includes(name)) {
                    secondaryGuilds.push(name);
                }
            });

            // Get all tracked guilds from each config and add to secondary guild list
            config.trackedGuilds.forEach(name => {
                if (name && !secondaryGuilds.includes(name) && !primaryGuilds.includes(name)) {
                    secondaryGuilds.push(name);
                }
            });
        }

        // Remove any guild that is primary from the secondary list
        secondaryGuilds = secondaryGuilds.filter(name => !(name && primaryGuilds.includes(name)));

        try {
            // Get priority guilds file
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            return;
        }

        // Get priority guilds
        const priorityGuilds = updateGuildsFile.guilds;
        const maxToUpdate = 25;

        let updated = 0;

        if (priorityGuilds.length > 0) {
            console.log('Updating priority guilds.');

            // Update each priority guild
            for (const priorityGuild of priorityGuilds) {
                if (hitLimit) break;
                if (updated === maxToUpdate) break;

                // Update the guild
                await updateGuild(priorityGuild);

                if (!hitLimit) {
                    // If the guild is in the secondary list, remove it from the file and then add it back to the end.
                    // If the guild is not in the primary list, remove it. This ensures primary guilds will remain at the front
                    if (secondaryGuilds.includes(priorityGuild)) {
                        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(guild => guild !== priorityGuild);
                        updateGuildsFile.guilds.push(priorityGuild);
                    } else if (!primaryGuilds.includes(priorityGuild)) {
                        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(guild => guild !== priorityGuild);
                    }

                    updated++;
                }
            }

            // Update the file
            const updatedData = JSON.stringify(updateGuildsFile);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            console.log('Updated priority guilds.');
        }
    } catch (error) {
        console.error('Error updating priority guilds', error);
    }
}

// Update a guild with new stats from the API
async function updateGuild(guildName) {
    try {
        // Get the guild stats from the API
        const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/${guildName}`)).data;

        // FIXME: May need to handle API limit better
        if (!guildJson) {
            hitLimit = true;
            return;
        }

        // If the guild has no name, it's no good
        if (!guildJson.name) {
            return;
        }

        const seasonRanks = guildJson.seasonRanks;
        let rating = 0;

        // Get the rating from most recent season
        if (Object.keys(seasonRanks).length > 0) {
            const seasonNumbers = Object.keys(seasonRanks).map(Number);
            const maxSeasonNumber = Math.max(...seasonNumbers);
            rating = seasonRanks[maxSeasonNumber].rating;
        }

        // Get uuids of all members
        const allUuids = [
        ...Object.values(guildJson.members.owner).map(member => member.uuid),
        ...Object.values(guildJson.members.chief).map(member => member.uuid),
        ...Object.values(guildJson.members.strategist).map(member => member.uuid),
        ...Object.values(guildJson.members.captain).map(member => member.uuid),
        ...Object.values(guildJson.members.recruiter).map(member => member.uuid),
        ...Object.values(guildJson.members.recruit).map(member => member.uuid),
        ];

        // Insert into the table if it's new
        db.run(
            `INSERT OR IGNORE INTO guilds (name, prefix, level, xpPercent, wars, rating,
            average00, captains00, averageCount00, average01, captains01, averageCount01,
            average03, captains03, averageCount03, average04, captains04, averageCount04,
            average05, captains05, averageCount05, average06, captains06, averageCount06,
            average07, captains07, averageCount07, average08, captains08, averageCount08,
            average09, captains09, averageCount09, average10, captains10, averageCount10,
            average11, captains11, averageCount11, average12, captains12, averageCount12,
            average13, captains13, averageCount13, average14, captains14, averageCount14,
            average15, captains15, averageCount15, average16, captains16, averageCount16,
            average17, captains17, averageCount17, average18, captains18, averageCount18,
            average18, captains18, averageCount18, average19, captains19, averageCount19,
            average20, captains20, averageCount20, average21, captains21, averageCount21,
            average22, captains22, averageCount22, average23, captains23, averageCount23
        ) 
            VALUES (?, ?, ?, ?, ?, ?,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0,
            -1, -1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0)`, [guildJson.name, guildJson.prefix, guildJson.level,
                guildJson.xpPercent, rating],
            (err) => {
                if (err) {
                    console.error('Failed to add new guild:', err);
                    return;
                }
            },
        );

        // Update the guild if it already existed
        const updateQuery = `UPDATE guilds SET level = ?, xpPercent = ?, wars = ?, rating = ? WHERE name = '${guildJson.name}'`;
        await runAsync(updateQuery, [guildJson.level, guildJson.xpPercent, guildJson.wars, rating]);

        // Remove members who are no longer in the guild
        await removeGuildMembers(guildName, allUuids);

        // Loop through all ranks and update their members
        for (const rank in guildJson.members) {
            if (rank === 'total') continue;
            
            const members = guildJson.members[rank];

            const rankUpperCase = rank.toUpperCase();
            
            // Loop through each member of current rank and update their stats
            for (const memberName in members) {
                const member = members[memberName];
                const joinDate = JSON.stringify(member.joined).split('T')[0].slice(1);
                const isOnline = member.online ? 1 : 0;

                await updatePlayersGuild(member.uuid, memberName, guildName, rankUpperCase, member.contributed, joinDate, isOnline, member.server);
            }
        }
    } catch (error) {
        console.error('Error updating guild: ', error);
        return;
    }
}

// Remove members from a guild
async function removeGuildMembers(guildName, allUuids) {
    // Get all players in current guild
    const selectQuery = 'SELECT UUID FROM players WHERE guildName = ?';

    const rows = await allAsync(selectQuery, [guildName]);

    if (rows) {
        // Players found, map all uuids
        const uuids = rows.map((row) => row.UUID);

        // Loop through all uuids
        for (const uuid of uuids) {
            // Make sure member is not a part of the guild
            if (allUuids.includes(uuid)) {
                continue;
            }

            // Remove member from guild
            const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL, contributedGuildXP = 0, guildJoinDate = NULL WHERE UUID = ?';
            await runAsync(updateQuery, [uuid]);
        }

        return;
    } else {
        return;
    }
}

// Update what guild a player is in
async function updatePlayersGuild(playerUuid, playerName, guildName, guildRank, contributedGuildXP, joinDate, isOnline, onlineWorld) {
    // Get player from table
    const selectQuery = 'SELECT * FROM players WHERE UUID = ?';

    const row = await getAsync(selectQuery, [playerUuid]);

    if (row) {
        // They already exist in the table.
        // If their current guild does not equal the new one, add them to the priority players list
        if (row.guildName !== guildName) {
            await addPlayerToPriority(playerUuid);
        }

        // Update their guild related stats
        const updateQuery = `UPDATE players SET guildName = ?, guildRank = ?, contributedGuildXP = ?, guildJoinDate = ? WHERE UUID = '${playerUuid}'`;
        await runAsync(updateQuery, [guildName, guildRank, contributedGuildXP, joinDate]);
    } else {
        // They don't exist in the table.
        // Get a string for 2 weeks ago as a default for lastJoin
        const today = new Date();
        today.setDate(today.getDate() - 14);
        const todayString = today.toISOString().split('T')[0];

        // Add them to the table, with default values for non-guild related stats
        const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await runAsync(insertQuery, [playerUuid, playerName, guildName, guildRank, null, 0, todayString, isOnline, onlineWorld, contributedGuildXP, 0, joinDate, null, null, 0, 0, 0, 0]);

        // Add to priority players list
        await addPlayerToPriority(playerUuid);
    }
}

// Updates the member of all guilds ordered by level.
// Does 10 at a time or until API rate limit reached.
// Keeps track of the index of the guild it reached so it can slowly go through all guilds.
async function updateGuildMembers() {
    try {
        // Get every guild ordered by level
        const query = 'SELECT name FROM guilds ORDER BY level';
        const rows = await allAsync(query, []);

        // Map all names
        const existingGuildNames = rows.map((row) => row.name);

        // Get index of final guild
        const endIndex = existingGuildNames.length - 1;

        // Keep looping till rate limit hit
        while (!hitLimit) {
            // Get name of guild
            const name = existingGuildNames[currentGuildIndex];

            // Update guild
            await updateGuild(name);

            // If hit rate limit then exit loop
            if (hitLimit) {
                return;
            }

            // Increment index reached
            currentGuildIndex++;

            // If reached final guild, reset index to 0 and exit loop
            if (currentGuildIndex > endIndex) {
                currentGuildIndex = 0;
                return;
            }

            // If index is a multiple of 10, exit loop
            if (currentGuildIndex % 10 === 0) {
                return;
            }
        }

        return;
    } catch (err) {
        console.error('Error updating guild members: ', err);
        return;
    }
}

async function deleteGuild(guildName) {
    // Delete guild from the table
    const deleteQuery = 'DELETE FROM guilds WHERE name = ?';
    await runAsync(deleteQuery, [guildName]);

    // For all members who were part of a deleted guilds, set their guild related stats to default
    const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL, contributedGuildXP = 0, guildJoinDate = NULL WHERE guildName = ?';
    await runAsync(updateQuery, [guildName]);

    // Get table friendly name for guild
    const tableName = guildName.replaceAll(' ', '_');

    // Check if table exists
    const guildTableExists = await doesTableExist(tableName);

    // Delete table for guild if exists
    if (guildTableExists) {
        await runAsync(`CREATE TABLE ${tableName} (UUID TEXT NOT NULL PRIMARY KEY, playtimeStart INT, averagePlaytime INT, averageCount INT)`);
    }

    const configsPath = path.join(__dirname, 'configs');

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            // Read the config
            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // If a server has the deleted guild set as their guild, reset it
            if (config['guildName'] === guildName) {
                config['guildName'] = null;
            }

            // If a server is allied with the deleted guild, remove it from their allies
            if (config['allies'].includes(guildName)) {
                config['allies'] = config['allies'].filter(guild => guild !== guildName);
            }

            // If a server is tracking the deleted guild, remove it from their tracked list
            if (config['trackedGuilds'].includes(guildName)) {
                config['trackedGuilds'] = config['trackedGuilds'].filter(guild => guild !== guildName);
            }

            // Update the config file
            fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
        }

        const filePath = path.join(__dirname, 'updateGuilds.json');

        // Get priority guilds file
        await fs.access(filePath);
        const fileData = await fs.readFile(filePath, 'utf-8');
        const updateGuildsFile = JSON.parse(fileData);

        // Remove guild from priority guilds file
        if (updateGuildsFile['guilds'].includes(guildName)) {
            updateGuildsFile['guilds'] = updateGuildsFile['guilds'].filter(guild => guild !== guildName);
        }

        // Save new priority guilds file
        const updatedData = JSON.stringify(updateGuildsFile);
        await fs.writeFile(filePath, updatedData, 'utf-8');

        console.log(`Deleted all references to ${guildName}.`);
    } catch (err) {
        console.error('Error updating exceptions:', err);
    }
}

// Update the average activity of each guild at the different intervals
async function updateGuildActivity(currentHour, currentMinute) {
    try {
        // Get current average at current hour
        const query = 'SELECT name, average' + currentHour + ', captains' + currentHour + ', averageCount' + currentHour + ' FROM guilds';
        // Get all guilds and their averages for current time
        const guilds = await allAsync(query, []);

        // Loop through every guild
        for (const guild of guilds) {
            const guildName = guild.name;
            let hourAverageCount = guild['averageCount' + currentHour];
            // Current averages
            const currentAverage = guild['average' + currentHour];
            const currentCaptains = guild['captains' + currentHour];

            // Get the players from guild
            const playerQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1';
            const playerResult = await getAsync(playerQuery, [guildName]);
            const currentOnline = playerResult.count;

            // Get the players from guild at or above the rank of captain
            const captainRanks = ['CAPTAIN', 'STRATEGIST', 'CHIEF', 'OWNER'];
            const captainQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1 AND guildRank IN (' + captainRanks.map(() => '?').join(',') + ')';
            const captainResult = await getAsync(captainQuery, [guildName, ...captainRanks]);
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
            const updateQuery = 'UPDATE guilds SET average' + currentHour + ' = ?, captains' + currentHour + ' = ?, averageCount' + currentHour + ' = ? WHERE name = ?';
            await runAsync(updateQuery, [newAverage, newCaptains, hourAverageCount, guildName]);
        }

        return Promise.resolve();
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
}


// Add guilds to priority list based on config files
async function addPriorityGuilds(addSecondary) {
    const configsPath = path.join(__dirname, 'configs');

    const uniqueGuildNames = [];
    const primaryGuilds = [];

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // If config has a set guild and it isn't already present in the unique list, add it
            if (config.guildName !== '' && !uniqueGuildNames.includes(config.guildName)) {
                uniqueGuildNames.push(config.guildName);
            }

            // Add the set guild as a primary guild if it isn't already on the primary list
            if (config.guildName !== '' && !primaryGuilds.includes(config.guildName)) {
                primaryGuilds.push(config.guildName);
            }

            // For each ally the config has, add it to the list if it isn't already present in the unique list
            config.allies.forEach(name => {
                if (name && !uniqueGuildNames.includes(name)) {
                    uniqueGuildNames.push(name);
                }
            });

            // For each tracked guild the config has, add it to the list if it isn't already present in the unique list
            config.trackedGuilds.forEach(name => {
                if (name && !uniqueGuildNames.includes(name)) {
                    uniqueGuildNames.push(name);
                }
            });
        }

        skipPriorityPlayers = true;

        // For each guild in the priority list, add all members of that list to the priority players list
        for (const priorityGuild of uniqueGuildNames) {
            // If not adding secondary guild members and priority guild is not primary, skip
            if (!addSecondary && !primaryGuilds.includes(priorityGuild)) continue;

            // Get all members of the guild
            const memberUuids = await allAsync('SELECT UUID FROM players WHERE guildName = ?', [priorityGuild]);

            // Get all uuids in a list
            const uuids = memberUuids.map(row => row.UUID);

            // Add each to the priority
            for (const uuid of uuids) {
                await addPlayerToPriority(uuid);
            }
        }

        skipPriorityPlayers = false;

        const filePath = path.join(__dirname, 'updateGuilds.json');
        let updateGuildsFile = {};

        try {
            // Get the priority guilds file
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            return;
        }

        // Update priority file with new guilds
        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(name => !uniqueGuildNames.includes(name));

        updateGuildsFile.guilds.push(...uniqueGuildNames);

        // Save file
        const updatedData = JSON.stringify(updateGuildsFile, null, 2);
        await fs.writeFile(filePath, updatedData, 'utf-8');
    } catch (err) {
        console.error('Error adding priority guilds:', err);
    }
}

// Add a guild to the priority guilds file
async function addPriorityGuild(guildName) {
    try {
        const filePath = path.join(__dirname, 'updateGuilds.json');
        let updateGuildsFile = {};

        try {
            // Access priority guilds file
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            updateGuildsFile.guilds = [];
        }

        // If the guild isn't already in the priority list, add it
        if (!updateGuildsFile.guilds.includes(guildName)) {
            updateGuildsFile.guilds.push(guildName);

            const updatedData = JSON.stringify(updateGuildsFile, null, 2);
            // Save file
            await fs.writeFile(filePath, updatedData, 'utf-8');
            console.log(`Guild "${guildName}" added to priority.`);
        }
    } catch (err) {
        console.error('Error adding priority guild:', err);
    }
}

// Add a new player to the priority players file
async function addPlayerToPriority(playerUuid) {
    const filePath = path.join(__dirname, 'updatePlayers.json');

    try {
        let updatePlayersFile = {};

        try {
            // Get the priority players file
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updatePlayersFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Error reading priority players file.');
            return;
        }

        updatePlayersFile.players = updatePlayersFile.players.filter(item => item !== null);

        // If the player isn't already on the priority list, add them
        if (!updatePlayersFile.players.includes(playerUuid)) {
            updatePlayersFile.players.push(playerUuid);

            // Save file
            const updatedData = JSON.stringify(updatePlayersFile, null, 2);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            return;
        }
    } catch (error) {
        console.error('Error adding player to priority', error);
    }
}

// Update weekly playtime of each primary guild
async function updatePlayerActivity() {
    const configsPath = path.join(__dirname, 'configs');

    const primaryGuilds = [];

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // Add their set guild to the list of primary guilds if it's not already present
            if (config.guildName && !primaryGuilds.includes(config.guildName)) {
                primaryGuilds.push(config.guildName);
            }
        }
    } catch (err) {
        console.log('Error creating player activity tables');
    }

    // Loop through each guild and either create a table for tracking activity or 
    for (const guildName of primaryGuilds) {
        // Make the guild name an acceptable table name
        const tableName = guildName.replaceAll(' ', '_');
        // Check if the table already exists
        const tableExists = await doesTableExist(tableName);

        // Get guild members for the table
        const guildMembers = await allAsync('SELECT UUID, playtime FROM players WHERE guildName = ?', [guildName]);

        if (!tableExists) {
            // Table does not exist, create it
            await runAsync(`CREATE TABLE ${tableName} (UUID TEXT NOT NULL PRIMARY KEY, playtimeStart INT, averagePlaytime INT, averageCount INT)`);

            // Add all current members to the table with current playtime
            for (const member of guildMembers) {
                await runAsync(`INSERT INTO ${tableName} (UUID, playtimeStart, averagePlaytime, averageCount) VALUES (?, ?, -1, 0)`, [member.UUID, member.playtime]);
            }
        } else {
            // Get all members currently in table
            const existingMembers = await allAsync(`SELECT * FROM ${tableName}`);

            // Loop through each member
            for (const member of existingMembers) {
                // Match guild member to members currently in the guild
                const currentMember = guildMembers.find(guildMember => member.UUID === guildMember.UUID);

                // If they are no longer in the guild, remove them from the table
                if (!currentMember) {
                    await runAsync(`DELETE FROM ${tableName} WHERE UUID = ?`, [member.UUID]);
                    continue;
                }

                // Get the members current playtime
                const currentPlaytime = currentMember.playtime;

                // Calculate how much they played this week
                const weekPlaytime = currentPlaytime - member.playtimeStart;
                let averageCount = member.averageCount;

                let newAverage;

                // Calculate a new running average
                if (averageCount >= 4) {
                    newAverage = member.averagePlaytime + weekPlaytime / 2;
                } else if (averageCount > 0) {
                    newAverage = (member.averagePlaytime * averageCount + weekPlaytime) / (averageCount + 1);
                } else {
                    newAverage = weekPlaytime;
                }

                // Determine if running average needs to be reset
                if (averageCount >= 4) {
                    averageCount = 1;
                } else {
                    averageCount += 1;
                }

                // Update the player
                const updateQuery = `UPDATE ${tableName} SET playtimeStart = ?, averagePlaytime = ?, averageCount = ? WHERE UUID = ?`;

                await runAsync(updateQuery, [currentPlaytime, newAverage, averageCount, member.UUID]);
            }

            // Add members who don't already exist in the table
            for (const member of guildMembers) {
                await runAsync(`INSERT OR IGNORE INTO ${tableName} (UUID, playtimeStart, averagePlaytime, averageCount) VALUES (?, ?, -1, 0)`, [member.UUID, member.playtime]);
            }
        }
    }
}

// Checks if a table exists in the database
async function doesTableExist(tableName) {
    const result = await getAsync('SELECT name FROM sqlite_master WHERE type = \'table\' AND name = ?', [tableName]);
    return !!result;
}

// Reduce the count on all promotion and demotion exceptions
async function updateExceptions() {
    const configsPath = path.join(__dirname, 'configs');

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            // Read the config
            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // If they have demotion exceptions
            if (config['demotionExceptions']) {
                // Loop through each demotion exception and if the duration is longer than 1 day, reduce it by 1.
                // Otherwise, remove them from the exceptions list if the duration is 1
                for (const [username, period] of Object.entries(config['demotionExceptions'])) {
                    if (period > 1) {
                        config['demotionExceptions'][username] = period - 1;
                    } else if (period === 1) {
                        delete config['demotionExceptions'][username];
                    }
                }
            }

            // If they have promotion exceptions
            if (config['promotionExceptions']) {
                // Loop through each promotion exception and if the duration is longer than 1 day, reduce it by 1.
                // Otherwise, remove them from the exceptions list if the duration is 1
                for (const [username, period] of Object.entries(config['promotionExceptions'])) {
                    if (period > 1) {
                        config['promotionExceptions'][username] = period - 1;
                    } else if (period === 1) {
                        delete config['promotionExceptions'][username];
                    }
                }
            }

            // Update the config file
            fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
        }
    } catch (err) {
        console.error('Error updating exceptions:', err);
    }
}

// Remove eligible chiefs from the list so they can be shown the next day
async function removeEligibleChiefs() {
    const configsPath = path.join(__dirname, 'configs');

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            // Read the config
            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // Clear the list
            config['chiefPromotions'] = [];

            // Update the config file
            fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
        }
    } catch (err) {
        console.error('Error updating exceptions:', err);
    }
}

// Runs as fast as it can, as soon as it has done all operations it will run again
async function runFreeFunction() {
    hitLimit = false;

    try {
        // Updates the players that are online.
        console.log('Updating all online players.');
        await updateOnlinePlayers();
        console.log('Updated all online players');

        // // Update the list of priority guilds
        await updatePriorityGuilds();

        // Update the list of priority players
        await updatePriorityPlayers();

        // Run everytime this function has been ran 10 times
        if (freeFunctionRuns % 10 === 0) {
            // Updates the guild and guild rank for each member of each guild.
            console.log('Updating guild members');
            await updateGuildMembers();
        }

        // Run after this function has been ran 50 times
        if (freeFunctionRuns == 50) {
            // Updates the guilds database with new guilds and removes deleted guilds.
            console.log('Updating list of all guilds.');
            await updateGuilds();

            freeFunctionRuns = -1;
        }

        freeFunctionRuns++;
    } catch (err) {
        console.log(err);
    }

    // Run function again
    runFreeFunction();
}

// Runs every minute, unless an operation takes longer then it will run at the next minute
async function runScheduledFunction() {
    let now = new Date();

    // Update every 10 minutes
    if (now.getUTCMinutes() % 10 == 0) {
        // Updates the average online players & captain+'s for each guild.
        console.log(`Updating guild activity at ${now.getUTCHours()}:${now.getUTCMinutes()}`);
        await updateGuildActivity(now.getUTCHours().toString().padStart(2, '0'), now.getUTCMinutes().toString().padStart(2, '0'));

        console.log('Completed 10 minute tasks');
    }

    // Update every 3 hours.
    if ((now.getUTCHours() === 0 || now.getUTCHours() % 3 === 0) && now.getUTCMinutes() === 0) {
        // Updates priority guilds with new set, allied and tracked guilds.
        // Adds members of primary guilds to priority too. Secondary guild members are added daily.
        console.log('Adding used guilds and members to priority');
        await addPriorityGuilds(now.getUTCHours() === 0);
    }

    // Update daily
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        // Updates the days for how long players are exempt from promotion/demotion
        console.log('Updating promotion and demotion exceptions.');
        await updateExceptions();

        // Removes chiefs from the list so their promotion message can be displayed again
        console.log('Removing eligible chief promotions.');
        await removeEligibleChiefs();

        const dayOfWeek = daysOfWeek[now.getUTCDay()];
        const backupFilename = `database_backup_${dayOfWeek}.db`;

        // Creates a copy of the database
        console.log('Creating database backup');
        await createDatabaseBackup(backupFilename);

        console.log('Completed daily tasks');
    }

    // Update weekly
    if (now.getUTCDay() === 1 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        console.log('Checking primary guild members activities');
        await updatePlayerActivity();

        console.log('Completed weekly tasks');
    }

    now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    // Run this function again at the next minute
    setTimeout(runScheduledFunction, secondsToNextMinute * 1000);
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

// Setup the two main tables
async function setup() {
    const guildTableExists = await doesTableExist('guilds');
    const playerTableExists = await doesTableExist('players');

    // If the guilds table does not exist, create it
    if (!guildTableExists) {
        await runAsync('CREATE TABLE "new_guilds" ( name TEXT NOT NULL PRIMARY KEY, prefix TEXT, level INT, xpPercent INT, wars INT, rating INT, average00 DECIMAL, captains00 DECIMAL, averageCount00 INTEGER, average01 DECIMAL, captains01 DECIMAL, averageCount01 INTEGER, average02 DECIMAL, captains02 DECIMAL, averageCount02 INTEGER, average03 DECIMAL, captains03 DECIMAL, averageCount03 INTEGER, average04 DECIMAL, captains04 DECIMAL, averageCount04 INTEGER, average05 DECIMAL, captains05 DECIMAL, averageCount05 INTEGER, average06 DECIMAL, captains06 DECIMAL, averageCount06 INTEGER, average07 DECIMAL, captains07 DECIMAL, averageCount07 INTEGER, average08 DECIMAL, captains08 DECIMAL, averageCount08 INTEGER, average09 DECIMAL, captains09 DECIMAL, averageCount09 INTEGER, average10 DECIMAL, captains10 DECIMAL, averageCount10 INTEGER, average11 DECIMAL, captains11 DECIMAL, averageCount11 INTEGER, average12 DECIMAL, captains12 DECIMAL, averageCount12 INTEGER, average13 DECIMAL, captains13 DECIMAL, averageCount13 INTEGER, average14 DECIMAL, captains14 DECIMAL, averageCount14 INTEGER, average15 DECIMAL, captains15 DECIMAL, averageCount15 INTEGER, average16 DECIMAL, captains16 DECIMAL, averageCount16 INTEGER, average17 DECIMAL, captains17 DECIMAL, averageCount17 INTEGER, average18 DECIMAL, captains18 DECIMAL, averageCount18 INTEGER, average19 DECIMAL, captains19 DECIMAL, averageCount19 INTEGER, average20 DECIMAL, captains20 DECIMAL, averageCount20 INTEGER, average21 DECIMAL, captains21 DECIMAL, averageCount21 INTEGER, average22 DECIMAL, captains22 DECIMAL, averageCount22 INTEGER, average23 DECIMAL, captains23 DECIMAL, averageCount23 INTEGER)');
        await runAsync('CREATE INDEX idx_guildName ON guilds (name)');
    }

    // If the players table does not exist, create it
    if (!playerTableExists) {
        await runAsync('CREATE TABLE "players" (UUID TEXT NOT NULL PRIMARY KEY, username TEXT, guildName TEXT, guildRank TEXT, rank TEXT, veteran INT, lastJoin TEXT, isOnline INT, onlineWorld TEXT, contributedGuildXP INT, highestClassLevel INT, guildJoinDate TEXT, serverRank TEXT, firstJoin TEXT, completedQuests INT, totalCombatLevel INT, playtime INT, wars INT)');
        await runAsync('CREATE INDEX "idx_playerGuild" ON "players" (guildName)');
    }

    runFreeFunction();
    runScheduledFunction();
}

setup();
