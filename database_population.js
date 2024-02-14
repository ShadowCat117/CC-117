const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs').promises;
const path = require('path');
let freeFunctionRuns = 0;
let currentGuildIndex = 0;
let hitLimit = false;
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
                    // Remove player from priority players file
                    updatePlayersFile.players = updatePlayersFile.players.filter(player => player !== priorityPlayer);
                    updated++;
                }
            }

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

        // Insert into the table if it's new (this is horrible)
        db.run(
            `INSERT OR IGNORE INTO guilds (name, prefix, level, xpPercent, wars, rating,
            average0000, captains0000, average0015, captains0015, average0030, captains0030, average0045, captains0045,
            average0100, captains0100, average0115, captains0115, average0130, captains0130, average0145, captains0145,
            average0200, captains0200, average0215, captains0215, average0230, captains0230, average0245, captains0245,
            average0300, captains0300, average0315, captains0315, average0330, captains0330, average0345, captains0345,
            average0400, captains0400, average0415, captains0415, average0430, captains0430, average0445, captains0445,
            average0500, captains0500, average0515, captains0515, average0530, captains0530, average0545, captains0545,
            average0600, captains0600, average0615, captains0615, average0630, captains0630, average0645, captains0645,
            average0700, captains0700, average0715, captains0715, average0730, captains0730, average0745, captains0745,
            average0800, captains0800, average0815, captains0815, average0830, captains0830, average0845, captains0845,
            average0900, captains0900, average0915, captains0915, average0930, captains0930, average0945, captains0945,
            average1000, captains1000, average1015, captains1015, average1030, captains1030, average1045, captains1045,
            average1100, captains1100, average1115, captains1115, average1130, captains1130, average1145, captains1145,
            average1200, captains1200, average1215, captains1215, average1230, captains1230, average1245, captains1245,
            average1300, captains1300, average1315, captains1315, average1330, captains1330, average1345, captains1345,
            average1400, captains1400, average1415, captains1415, average1430, captains1430, average1445, captains1445,
            average1500, captains1500, average1515, captains1515, average1530, captains1530, average1545, captains1545,
            average1600, captains1600, average1615, captains1615, average1630, captains1630, average1645, captains1645,
            average1700, captains1700, average1715, captains1715, average1730, captains1730, average1745, captains1745,
            average1800, captains1800, average1815, captains1815, average1830, captains1830, average1845, captains1845,
            average1900, captains1900, average1915, captains1915, average1930, captains1930, average1945, captains1945,
            average2000, captains2000, average2015, captains2015, average2030, captains2030, average2045, captains2045,
            average2100, captains2100, average2115, captains2115, average2130, captains2130, average2145, captains2145,
            average2200, captains2200, average2215, captains2215, average2230, captains2230, average2245, captains2245,
            average2300, captains2300, average2315, captains2315, average2330, captains2330, average2345, captains2345,
            averageCount) 
            VALUES (?, ?, ?, ?, ?, ?,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1,
            0)`, [guildJson.name, guildJson.prefix, guildJson.level,
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

// This can almost certainly be done better, using the old system of just having one average for each hour and updating that
// average every 10 mins but using the current minute (eg xx:10 or xx:20) and the averageCount to have a mini running average
// for the hour. That would make it the most accurate but would either require another guild activity wipe or figuring out a
// way to quickly merge all of the hours activity back into 1 column.

// Update the average activity of each guild at the different intervals
async function updateGuildActivity(currentHour, currentMinute) {
    try {
        // Get the current time in a format for the column
        const currentTime = `${currentHour}${currentMinute}`;
        // Get current average at current time
        const query = 'SELECT name, averageCount, average' + currentTime + ', captains' + currentTime + ' FROM guilds';
        // Get all guilds and their averages for current time
        const guilds = await allAsync(query, []);

        // Loop through every guild
        for (const guild of guilds) {
            const guildName = guild.name;
            let averageCount = guild.averageCount;
            // Current averages
            const currentAverage = guild['average' + currentTime];
            const currentCaptains = guild['captains' + currentTime];

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
            if (averageCount >= 7) {
                newAverage = currentAverage + currentOnline / 2;
                newCaptains = currentCaptains + captainsOnline / 2;
            } else if (currentAverage > 0) {
                newAverage = (currentAverage * averageCount + currentOnline) / (averageCount + 1);
                newCaptains = (currentCaptains * averageCount + captainsOnline) / (averageCount + 1);
            } else {
                newAverage = currentOnline;
                newCaptains = captainsOnline;
            }

            // If end of the week, check if average should be reset
            if (currentTime === '2345') {
                if (averageCount >= 7) {
                    averageCount = 1;
                } else {
                    averageCount += 1;
                }
            }

            // Update activity
            const updateQuery = 'UPDATE guilds SET average' + currentTime + ' = ?, captains' + currentTime + ' = ?, averageCount = ? WHERE name = ?';

            await runAsync(updateQuery, [newAverage, newCaptains, averageCount, guildName]);
        }

        return Promise.resolve();
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
}

// Add guilds to priority list based on config files
async function addPriorityGuilds() {
    const configsPath = path.join(__dirname, 'configs');

    const uniqueGuildNames = [];

    try {
        const files = await fs.readdir(configsPath);

        // Loop through all config files
        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            // If config has a set guild and it isn't already present in the unique list, add it
            if (config.guildName && !uniqueGuildNames.includes(config.guildName)) {
                uniqueGuildNames.push(config.guildName);
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

        // For each guild in the priority list, add all members of that list to the priority players list
        for (const priorityGuild of uniqueGuildNames) {
            // Get all members of the guild
            const memberUuids = await allAsync('SELECT UUID FROM players WHERE guildName = ?', [priorityGuild]);

            // Get all uuids in a list
            const uuids = memberUuids.map(row => row.UUID);

            // Add each to the priority
            for (const uuid of uuids) {
                await addPlayerToPriority(uuid);
            }
        }

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

    // Run function again
    runFreeFunction();
}

// Runs every minute, unless an operation takes longer then it will run at the next minute
async function runScheduledFunction() {
    let now = new Date();

    // Update quarter hourly
    if (now.getUTCMinutes() == 0 || now.getUTCMinutes() == 15 || now.getUTCMinutes() == 30 || now.getUTCMinutes() == 45) {
        // Updates the average online players & captain+'s for each guild.
        console.log(`Updating guild activity at ${now.getUTCHours()}:${now.getUTCMinutes()}`);
        await updateGuildActivity(now.getUTCHours().toString().padStart(2, '0'), now.getUTCMinutes().toString().padStart(2, '0'));

        console.log('Completed quarter hourly tasks');
    }

    // Update daily
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        // Updates the days for how long players are exempt from promotion/demotion
        console.log('Updating promotion and demotion exceptions.');
        await updateExceptions();

        // Removes chiefs from the list so their promotion message can be displayed again
        console.log('Removing eligible chief promotions.');
        await removeEligibleChiefs();

        // Updates priority guilds with new set, allied and tracked guilds. Also add all members to priority.
        console.log('Adding used guilds to priority');
        await addPriorityGuilds();

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
        await runAsync('CREATE TABLE "guilds" (name TEXT NOT NULL PRIMARY KEY, prefix TEXT, level INT, xpPercent INT, wars INT, rating INT, average0000 DECIMAL, captains0000 DECIMAL, average0015 DECIMAL, captains0015 DECIMAL, average0030 DECIMAL, captains0030 DECIMAL, average0045 DECIMAL, captains0045 DECIMAL, average0100 DECIMAL, captains0100 DECIMAL, average0115 DECIMAL, captains0115 DECIMAL, average0130 DECIMAL, captains0130 DECIMAL, average0145 DECIMAL, captains0145 DECIMAL, average0200 DECIMAL, captains0200 DECIMAL, average0215 DECIMAL, captains0215 DECIMAL, average0230 DECIMAL, captains0230 DECIMAL, average0245 DECIMAL, captains0245 DECIMAL, average0300 DECIMAL, captains0300 DECIMAL, average0315 DECIMAL, captains0315 DECIMAL, average0330 DECIMAL, captains0330 DECIMAL, average0345 DECIMAL, captains0345 DECIMAL, average0400 DECIMAL, captains0400 DECIMAL, average0415 DECIMAL, captains0415 DECIMAL, average0430 DECIMAL, captains0430 DECIMAL, average0445 DECIMAL, captains0445 DECIMAL, average0500 DECIMAL, captains0500 DECIMAL, average0515 DECIMAL, captains0515 DECIMAL, average0530 DECIMAL, captains0530 DECIMAL, average0545 DECIMAL, captains0545 DECIMAL, average0600 DECIMAL, captains0600 DECIMAL, average0615 DECIMAL, captains0615 DECIMAL, average0630 DECIMAL, captains0630 DECIMAL, average0645 DECIMAL, captains0645 DECIMAL, average0700 DECIMAL, captains0700 DECIMAL, average0715 DECIMAL, captains0715 DECIMAL, average0730 DECIMAL, captains0730 DECIMAL, average0745 DECIMAL, captains0745 DECIMAL, average0800 DECIMAL, captains0800 DECIMAL, average0815 DECIMAL, captains0815 DECIMAL, average0830 DECIMAL, captains0830 DECIMAL, average0845 DECIMAL, captains0845 DECIMAL, average0900 DECIMAL, captains0900 DECIMAL, average0915 DECIMAL, captains0915 DECIMAL, average0930 DECIMAL, captains0930 DECIMAL, average0945 DECIMAL, captains0945 DECIMAL, average1000 DECIMAL, captains1000 DECIMAL, average1015 DECIMAL, captains1015 DECIMAL, average1030 DECIMAL, captains1030 DECIMAL, average1045 DECIMAL, captains1045 DECIMAL, average1100 DECIMAL, captains1100 DECIMAL, average1115 DECIMAL, captains1115 DECIMAL, average1130 DECIMAL, captains1130 DECIMAL, average1145 DECIMAL, captains1145 DECIMAL, average1200 DECIMAL, captains1200 DECIMAL, average1215 DECIMAL, captains1215 DECIMAL, average1230 DECIMAL, captains1230 DECIMAL, average1245 DECIMAL, captains1245 DECIMAL, average1300 DECIMAL, captains1300 DECIMAL, average1315 DECIMAL, captains1315 DECIMAL, average1330 DECIMAL, captains1330 DECIMAL, average1345 DECIMAL, captains1345 DECIMAL, average1400 DECIMAL, captains1400 DECIMAL, average1415 DECIMAL, captains1415 DECIMAL, average1430 DECIMAL, captains1430 DECIMAL, average1445 DECIMAL, captains1445 DECIMAL, average1500 DECIMAL, captains1500 DECIMAL, average1515 DECIMAL, captains1515 DECIMAL, average1530 DECIMAL, captains1530 DECIMAL, average1545 DECIMAL, captains1545 DECIMAL, average1600 DECIMAL, captains1600 DECIMAL, average1615 DECIMAL, captains1615 DECIMAL, average1630 DECIMAL, captains1630 DECIMAL, average1645 DECIMAL, captains1645 DECIMAL, average1700 DECIMAL, captains1700 DECIMAL, average1715 DECIMAL, captains1715 DECIMAL, average1730 DECIMAL, captains1730 DECIMAL, average1745 DECIMAL, captains1745 DECIMAL, average1800 DECIMAL, captains1800 DECIMAL, average1815 DECIMAL, captains1815 DECIMAL, average1830 DECIMAL, captains1830 DECIMAL, average1845 DECIMAL, captains1845 DECIMAL, average1900 DECIMAL, captains1900 DECIMAL, average1915 DECIMAL, captains1915 DECIMAL, average1930 DECIMAL, captains1930 DECIMAL, average1945 DECIMAL, captains1945 DECIMAL, average2000 DECIMAL, captains2000 DECIMAL, average2015 DECIMAL, captains2015 DECIMAL, average2030 DECIMAL, captains2030 DECIMAL, average2045 DECIMAL, captains2045 DECIMAL, average2100 DECIMAL, captains2100 DECIMAL, average2115 DECIMAL, captains2115 DECIMAL, average2130 DECIMAL, captains2130 DECIMAL, average2145 DECIMAL, captains2145 DECIMAL, average2200 DECIMAL, captains2200 DECIMAL, average2215 DECIMAL, captains2215 DECIMAL, average2230 DECIMAL, captains2230 DECIMAL, average2245 DECIMAL, captains2245 DECIMAL, average2300 DECIMAL, captains2300 DECIMAL, average2315 DECIMAL, captains2315 DECIMAL, average2330 DECIMAL, captains2330 DECIMAL, average2345 DECIMAL, captains2345 DECIMAL, averageCount INTEGER)');
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
