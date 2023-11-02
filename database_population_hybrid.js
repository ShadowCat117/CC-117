const wynnAPI = require('gavel-gateway-js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs').promises;
const path = require('path');
let currentGuildIndex = 0;
let hitLimit = false;
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    try {
        const onlinePlayers = await wynnAPI.fetchOnlinePlayers();
        const worlds = onlinePlayers.list;

        await setOfflinePlayers(worlds);

        const newPlayers = await updatePlayerStatus(worlds);

        if (newPlayers) {
            for (const newPlayer of newPlayers) {
                await updatePlayer(newPlayer);
            }
        }
    } catch (error) {
        console.error(`Error updating online players: ${error}`);
    }
}

async function setOfflinePlayers(worldData) {
    const selectQuery = 'SELECT UUID, username FROM players WHERE isOnline = 1';

    const rows = await allAsync(selectQuery, []);

    const onlinePlayers = [];

    for (const world of worldData) {
        onlinePlayers.push(...world.players);
    }

    for (const player of rows) {
        if (!onlinePlayers.includes(player.username)) {
            await runAsync('UPDATE players SET isOnline = 0, onlineWorld = NULL WHERE UUID = ?', [player.UUID]);
        }
    }
}

async function updatePlayerStatus(worldData) {
    return new Promise((resolve, reject) => {
        const playersToUpdate = [];

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
                            resolve(playersToUpdate);
                        }
                    });
                } else {
                    playersToUpdate.push(playerName);

                    processedCount++;
                    if (processedCount === playersCount) {
                        resolve(playersToUpdate);
                    }
                }
            });
        };

        let playersCount = 0;

        for (const worldIndex in worldData) {
            const world = worldData[worldIndex];

            playersCount += world.players.length;

            for (const playerName of world.players) {
                processPlayer(playerName, world.name);
            }
        }
    });
}

async function updatePriorityPlayers() {
    const filePath = path.join(__dirname, 'updatePlayers.json');

    try {
        let updatePlayersFile = {};

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updatePlayersFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority players file does not exist.');
            return;
        }

        const priorityPlayers = updatePlayersFile.players;
        const maxToUpdate = 100;

        let updated = 0;

        if (priorityPlayers.length > 0) {
            console.log('Updating priority players');

            for (const priorityPlayer of priorityPlayers) {
                if (hitLimit) break;
                if (updated === maxToUpdate) break;

                await updatePlayer(priorityPlayer);

                if (!hitLimit) {
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

async function updatePlayer(playerName) {
    if (hitLimit) return;

    try {
        const playerJson = (await axios.get(`https://api.wynncraft.com/v3/player/${playerName}?fullResult=True`)).data;

        // FIXME: May need to handle API limit better
        if (!playerJson) {
            hitLimit = true;
            return;
        }

        if (!playerJson.username) {
            return;
        }

        const selectQuery = 'SELECT * FROM players WHERE UUID = ?';
        const selectParams = [playerJson.uuid];

        const row = await getAsync(selectQuery, selectParams);

        let supportRank = playerJson.supportRank ? playerJson.supportRank.toUpperCase() : null;
        
        if (supportRank === 'VIPPLUS') {
            supportRank = 'VIP+';
        }

        const guildName = playerJson.guild ? playerJson.guild.name : null;
        const guildRank = playerJson.guild ? playerJson.guild.rank : null;
        let highestClassLevel = 0;
        let totalCombatLevel = 0;

        for (const character in playerJson.characters) {
            const characterJson = playerJson.characters[character];

            if (characterJson.level > highestClassLevel) {
                highestClassLevel = characterJson.level;
            }

            totalCombatLevel += characterJson.level;
        }

        const isOnline = playerJson.online ? 1 : 0;

        if (row) {
            const contributedGuildXP = row.contributedGuildXP !== null ? row.contributedGuildXP : null;
            const guildJoinDate = row.guildJoinDate !== null ? row.guildJoinDate : null;

            const insertQuery = 'INSERT OR REPLACE INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const insertParams = [
                playerJson.uuid,
                playerJson.username,
                guildName,
                guildRank,
                supportRank,
                row.veteran,
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
            const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';


            const insertParams = [
                playerJson.uuid,
                playerJson.username,
                guildName,
                guildRank,
                supportRank,
                0,
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
        console.error(`Error fetching ${playerName}:`, error);
        return;
    }
}

async function updateGuilds() {
    if (hitLimit) return;

    try {
        const guildJson = (await axios.get('https://api.wynncraft.com/v3/guild/list/guild')).data;

        // FIXME: May need to handle API limit better
        if (!guildJson) {
            hitLimit = true;
            return;
        }

        const allGuilds = guildJson.map(guild => guild.name);

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

                const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL, contributedGuildXP = 0, guildJoinDate = NULL WHERE guildName = ?';
                await runAsync(updateQuery, [guildName]);
            }

            for (const guildName of guildsNotInTable) {
                if (hitLimit) break;

                await updateGuild(guildName);

                guildsNotInTable.pop(guildName);
            }

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

async function updatePriorityGuilds() {
    const filePath = path.join(__dirname, 'updateGuilds.json');
    const configsPath = path.join(__dirname, 'configs');
    const mainGuilds = [];

    try {
        const configFiles = await fs.readdir(configsPath);
        let updateGuildsFile = {};

        for (const file of configFiles) {
            const configFilePath = path.join(configsPath, file);

            const data = await fs.readFile(configFilePath, 'utf8');
            const config = JSON.parse(data);

            if (config.guildName && !mainGuilds.includes(config.guildName)) {
                mainGuilds.push(config.guildName);
            }
        }

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            return;
        }

        const priorityGuilds = updateGuildsFile.guilds;
        const maxToUpdate = 25;

        let updated = 0;

        if (priorityGuilds.length > 0) {
            console.log('Updating priority guilds.');

            for (const priorityGuild of priorityGuilds) {
                if (hitLimit) break;
                if (updated === maxToUpdate) break;

                await updateGuild(priorityGuild);

                if (!hitLimit) {
                    if (!mainGuilds.includes(priorityGuild)) {
                        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(guild => guild !== priorityGuild);
                        updateGuildsFile.guilds.push(priorityGuild);
                    }

                    updated++;
                }
            }

            const updatedData = JSON.stringify(updateGuildsFile);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            console.log('Updated priority guilds.');
        }
    } catch (error) {
        console.error('Error updating priority guilds', error);
    }
}

async function updateGuild(guildName) {
    try {
        const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/${guildName}`)).data;

        // FIXME: May need to handle API limit better
        if (!guildJson) {
            hitLimit = true;
            return;
        }

        if (!guildJson.name) {
            return;
        }

        const allUuids = [
        ...Object.values(guildJson.members.owner).map(member => member.uuid),
        ...Object.values(guildJson.members.chief).map(member => member.uuid),
        ...Object.values(guildJson.members.strategist).map(member => member.uuid),
        ...Object.values(guildJson.members.captain).map(member => member.uuid),
        ...Object.values(guildJson.members.recruiter).map(member => member.uuid),
        ...Object.values(guildJson.members.recruit).map(member => member.uuid),
        ];

        db.run(
            `INSERT OR IGNORE INTO guilds (name, prefix, level, xpPercent, wars,
            average00, captains00, average01, captains01, average02, captains02, 
            average03, captains03, average04, captains04, average05, captains05, 
            average06, captains06, average07, captains07, average08, captains08, 
            average09, captains09, average10, captains10, average11, captains11, 
            average12, captains12, average13, captains13, average14, captains14, 
            average15, captains15, average16, captains16, average17, captains17, 
            average18, captains18, average19, captains19, average20, captains20, 
            average21, captains21, average22, captains22, average23, captains23,
            averageCount) 
            VALUES (?, ?, ?, ?, ?, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0)`, [guildJson.name, guildJson.prefix, guildJson.level,
                guildJson.xpPercent],
            (err) => {
                if (err) {
                    console.error('Failed to add new guild:', err);
                    return;
                }
            },
        );

        const updateQuery = `UPDATE guilds SET level = ?, xpPercent = ?, wars = ? WHERE name = '${guildJson.name}'`;
        await runAsync(updateQuery, [guildJson.level, guildJson.xpPercent, guildJson.wars]);

        await removeGuildMembers(guildName, allUuids);

        if (hitLimit) return;

        for (const rank in guildJson.members) {
            if (rank === 'total') continue;
            
            const members = guildJson.members[rank];

            const rankUpperCase = rank.toUpperCase();
            
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

async function removeGuildMembers(guildName, allUuids) {
    const selectQuery = 'SELECT UUID FROM players WHERE guildName = ?';

    const rows = await allAsync(selectQuery, [guildName]);

    if (rows) {
        const uuids = rows.map((row) => row.UUID);

        for (const uuid of uuids) {
            if (allUuids.includes(uuid)) {
                continue;
            }

            const updateQuery = 'UPDATE players SET guildName = NULL, guildRank = NULL, contributedGuildXP = 0, guildJoinDate = NULL WHERE UUID = ?';
            await runAsync(updateQuery, [uuid]);
        }

        return;
    } else {
        return;
    }
}

async function updatePlayersGuild(playerUuid, playerName, guildName, guildRank, contributedGuildXP, joinDate, isOnline, onlineWorld) {
    const selectQuery = 'SELECT * FROM players WHERE UUID = ?';

    const row = await getAsync(selectQuery, [playerUuid]);

    if (row) {
        const updateQuery = `UPDATE players SET guildName = ?, guildRank = ?, contributedGuildXP = ?, guildJoinDate = ? WHERE UUID = '${playerUuid}'`;
        await runAsync(updateQuery, [guildName, guildRank, contributedGuildXP, joinDate]);
    } else {
        const today = new Date();
        today.setDate(today.getDate() - 14);
        const todayString = today.toISOString().split('T')[0];
        const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await runAsync(insertQuery, [playerUuid, playerName, guildName, guildRank, null, 0, todayString, isOnline, onlineWorld, contributedGuildXP, 0, joinDate, null, null, 0, 0, 0, 0]);
    }
}

async function updateGuildMembers() {
    try {
        const query = 'SELECT name FROM guilds ORDER BY level';
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
                return;
            }

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

            if (currentHour === '23') {
                if (averageCount >= 7) {
                    averageCount = 1;
                } else {
                    averageCount += 1;
                }
            }

            const updateQuery = 'UPDATE guilds SET average' + currentHour + ' = ?, captains' + currentHour + ' = ?, averageCount = ? WHERE name = ?';

            await runAsync(updateQuery, [newAverage, newCaptains, averageCount, guildName]);
        }

        return Promise.resolve();
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
}

async function addPriorityGuilds() {
    const configsPath = path.join(__dirname, 'configs');

    const uniqueGuildNames = [];

    try {
        const files = await fs.readdir(configsPath);

        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            if (config.guildName && !uniqueGuildNames.includes(config.guildName)) {
                uniqueGuildNames.push(config.guildName);
            }

            config.allies.forEach(name => {
                if (name && !uniqueGuildNames.includes(name)) {
                    uniqueGuildNames.push(name);
                }
            });

            config.trackedGuilds.forEach(name => {
                if (name && !uniqueGuildNames.includes(name)) {
                    uniqueGuildNames.push(name);
                }
            });
        }

        for (const priorityGuild of uniqueGuildNames) {
            const memberUuids = await allAsync('SELECT UUID FROM players WHERE guildName = ?', [priorityGuild]);

            const uuids = memberUuids.map(row => row.UUID);

            for (const uuid of uuids) {
                await addPlayerToPriority(uuid);
            }
        }

        const filePath = path.join(__dirname, 'updateGuilds.json');
        let updateGuildsFile = {};

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            return;
        }

        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(name => !uniqueGuildNames.includes(name));

        updateGuildsFile.guilds.push(...uniqueGuildNames);

        const updatedData = JSON.stringify(updateGuildsFile, null, 2);
        await fs.writeFile(filePath, updatedData, 'utf-8');
    } catch (err) {
        console.error('Error adding priority guilds:', err);
    }
}

async function addPriorityGuild(guildName) {
    try {
        const filePath = path.join(__dirname, 'updateGuilds.json');
        let updateGuildsFile = {};

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updateGuildsFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority guilds file does not exist.');
            updateGuildsFile.guilds = [];
        }

        if (!updateGuildsFile.guilds.includes(guildName)) {
            updateGuildsFile.guilds.push(guildName);

            const updatedData = JSON.stringify(updateGuildsFile, null, 2);
            await fs.writeFile(filePath, updatedData, 'utf-8');
            console.log(`Guild "${guildName}" added to priority.`);
        }
    } catch (err) {
        console.error('Error adding priority guild:', err);
    }
}

async function addPlayerToPriority(playerUuid) {
    const filePath = path.join(__dirname, 'updatePlayers.json');

    try {
        let updatePlayersFile = {};

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            updatePlayersFile = JSON.parse(fileData);
        } catch (err) {
            console.log('Priority players file does not exist.');
            return;
        }

        updatePlayersFile.players = updatePlayersFile.players.filter(item => item !== null);

        if (!updatePlayersFile.players.includes(playerUuid)) {
            updatePlayersFile.players.push(playerUuid);

            const updatedData = JSON.stringify(updatePlayersFile, null, 2);
            await fs.writeFile(filePath, updatedData, 'utf-8');

            return;
        }
    } catch (error) {
        console.error('Error adding player to priority', error);
    }
}

async function runFreeFunction() {
    hitLimit = false;

    // Updates the players that are online.
    console.log('Updating all online players.');
    await updateOnlinePlayers();
    console.log('Updated all online players');

    // Update the list of priority guilds
    await updatePriorityGuilds();

    // Update the list of priority players
    await updatePriorityPlayers();

    const now = new Date();

    if (now.getUTCMinutes() == 0) {
        // Updates the guilds database with new guilds and removes deleted guilds.
        console.log('Updating list of all guilds.');
        await updateGuilds();

        // Updates the guild and guild rank for each member of each guild.
        console.log('Updating guild members');
        await updateGuildMembers();
    }

    runFreeFunction();
}

async function runScheduledFunction() {
    let now = new Date();

    // Update hourly
    if (now.getUTCMinutes() == 0) {
        // Updates the average online players & captain+'s for each guild.
        console.log('Updating guild activity');
        await updateGuildActivity();

        console.log('Completed hourly tasks');
    }

    // Update daily
    if (now.getUTCHours() == 23 && now.getUTCMinutes() == 0) {
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

    now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();

    setTimeout(runScheduledFunction, secondsToNextMinute * 1000);
}

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

runFreeFunction();
runScheduledFunction();
