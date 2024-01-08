const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs').promises;
const path = require('path');
let freeFunctionRuns = 0;
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
        const onlinePlayers = (await axios.get('https://api.wynncraft.com/v3/player?identifier=uuid')).data;
    
        // FIXME: May need to handle API limit better
        if (onlinePlayers) {
            await setOfflinePlayers(onlinePlayers.players);

            const newPlayers = await updatePlayerStatus(onlinePlayers.players, onlinePlayers.total);
        
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

async function setOfflinePlayers(onlinePlayers) {
    const selectQuery = 'SELECT UUID FROM players WHERE isOnline = 1';

    const rows = await allAsync(selectQuery, []);

    const onlineUUIDs = [];

    for (const player in onlinePlayers) {
        onlineUUIDs.push(player);
    }

    for (const player of rows) {
        if (!onlineUUIDs.includes(player.UUID)) {
            await runAsync('UPDATE players SET isOnline = 0, onlineWorld = NULL WHERE UUID = ?', [player.UUID]);
        }
    }
}

async function updatePlayerStatus(players, playersCount) {
    return new Promise((resolve, reject) => {
        const playersToUpdate = [];

        let processedCount = 0;

        const processPlayer = (playerUUID, worldNumber) => {
            db.get('SELECT * FROM players WHERE UUID = ?', playerUUID, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    const currentDate = new Date().toISOString().split('T')[0];
                    db.run('UPDATE players SET isOnline = 1, lastJoin = ?, onlineWorld = ? WHERE UUID = ?', [currentDate, worldNumber, playerUUID], (err) => {
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
                    playersToUpdate.push(playerUUID);

                    processedCount++;
                    if (processedCount === playersCount) {
                        resolve(playersToUpdate);
                    }
                }
            });
        };
          
        for (const player in players) {
            processPlayer(player, players[player]);
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
            console.log('Error reading priority players file.');
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
        const veteran = playerJson.veteran ? 1 : 0;

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
    const primaryGuilds = [];
    const secondaryGuilds = [];

    try {
        const configFiles = await fs.readdir(configsPath);
        let updateGuildsFile = {};

        for (const file of configFiles) {
            const configFilePath = path.join(configsPath, file);

            const data = await fs.readFile(configFilePath, 'utf8');
            const config = JSON.parse(data);

            if (config.guildName && !primaryGuilds.includes(config.guildName)) {
                primaryGuilds.push(config.guildName);
            }

            config.allies.forEach(name => {
                if (name && !secondaryGuilds.includes(name) && !primaryGuilds.includes(name)) {
                    secondaryGuilds.push(name);
                }
            });

            config.trackedGuilds.forEach(name => {
                if (name && !secondaryGuilds.includes(name) && !primaryGuilds.includes(name)) {
                    secondaryGuilds.push(name);
                }
            });
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
                    if (secondaryGuilds.includes(priorityGuild)) {
                        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(guild => guild !== priorityGuild);
                        updateGuildsFile.guilds.push(priorityGuild);
                    } else if (!primaryGuilds.includes(priorityGuild)) {
                        updateGuildsFile.guilds = updateGuildsFile.guilds.filter(guild => guild !== priorityGuild);
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

        const seasonRanks = guildJson.seasonRanks;
        let rating = 0;

        if (Object.keys(seasonRanks).length > 0) {
            const seasonNumbers = Object.keys(seasonRanks).map(Number);
            const maxSeasonNumber = Math.max(...seasonNumbers);
            rating = seasonRanks[maxSeasonNumber].rating;
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

        const updateQuery = `UPDATE guilds SET level = ?, xpPercent = ?, wars = ?, rating = ? WHERE name = '${guildJson.name}'`;
        await runAsync(updateQuery, [guildJson.level, guildJson.xpPercent, guildJson.wars, rating]);

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
        if (row.guildName !== guildName) {
            await addPlayerToPriority(playerUuid);
        }

        const updateQuery = `UPDATE players SET guildName = ?, guildRank = ?, contributedGuildXP = ?, guildJoinDate = ? WHERE UUID = '${playerUuid}'`;
        await runAsync(updateQuery, [guildName, guildRank, contributedGuildXP, joinDate]);
    } else {
        const today = new Date();
        today.setDate(today.getDate() - 14);
        const todayString = today.toISOString().split('T')[0];
        const insertQuery = 'INSERT INTO players (UUID, username, guildName, guildRank, rank, veteran, lastJoin, isOnline, onlineWorld, contributedGuildXP, highestClassLevel, guildJoinDate, serverRank, firstJoin, completedQuests, totalCombatLevel, playtime, wars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await runAsync(insertQuery, [playerUuid, playerName, guildName, guildRank, null, 0, todayString, isOnline, onlineWorld, contributedGuildXP, 0, joinDate, null, null, 0, 0, 0, 0]);

        await addPlayerToPriority(playerUuid);
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

// This can almost certainly be done better, using the old system of just having one average for each hour and updating that
// average every 10 mins but using the current minute (eg xx:10 or xx:20) and the averageCount to have a mini running average
// for the hour. That would make it the most accurate but would either require another guild activity wipe or figuring out a
// way to quickly merge all of the hours activity back into 1 column.
async function updateGuildActivity(currentHour, currentMinute) {
    try {
        const currentTime = `${currentHour}${currentMinute}`;
        const query = 'SELECT name, averageCount, average' + currentTime + ', captains' + currentTime + ' FROM guilds';
        const guilds = await allAsync(query, []);

        for (const guild of guilds) {
            const guildName = guild.name;
            let averageCount = guild.averageCount;
            const currentAverage = guild['average' + currentTime];
            const currentCaptains = guild['captains' + currentTime];

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

            if (currentTime === '2345') {
                if (averageCount >= 7) {
                    averageCount = 1;
                } else {
                    averageCount += 1;
                }
            }

            const updateQuery = 'UPDATE guilds SET average' + currentTime + ' = ?, captains' + currentTime + ' = ?, averageCount = ? WHERE name = ?';

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
            console.log('Error reading priority players file.');
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

async function updatePlayerActivity() {
    const configsPath = path.join(__dirname, 'configs');

    const primaryGuilds = [];

    try {
        const files = await fs.readdir(configsPath);

        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            if (config.guildName && !primaryGuilds.includes(config.guildName)) {
                primaryGuilds.push(config.guildName);
            }
        }
    } catch (err) {
        console.log('Error creating player activity tables');
    }

    for (const guildName of primaryGuilds) {
        const tableName = guildName.replaceAll(' ', '_');
        const tableExists = await doesTableExist(tableName);

        const guildMembers = await allAsync('SELECT UUID, playtime FROM players WHERE guildName = ?', [guildName]);

        if (!tableExists) {
            await runAsync(`CREATE TABLE ${tableName} (UUID TEXT NOT NULL PRIMARY KEY, playtimeStart INT, averagePlaytime INT, averageCount INT)`);

            for (const member of guildMembers) {
                await runAsync(`INSERT INTO ${tableName} (UUID, playtimeStart, averagePlaytime, averageCount) VALUES (?, ?, -1, 0)`, [member.UUID, member.playtime]);
            }
        } else {
            const existingMembers = await allAsync(`SELECT * FROM ${tableName}`);

            for (const member of existingMembers) {
                const currentMember = guildMembers.find(guildMember => member.UUID === guildMember.UUID);
                if (!currentMember) continue;
                const currentPlaytime = currentMember.playtime;

                const weekPlaytime = currentPlaytime - member.playtimeStart;
                let averageCount = member.averageCount;

                let newAverage;

                if (averageCount >= 4) {
                    newAverage = member.averagePlaytime + weekPlaytime / 2;
                } else if (averageCount > 0) {
                    newAverage = (member.averagePlaytime * averageCount + weekPlaytime) / (averageCount + 1);
                } else {
                    newAverage = weekPlaytime;
                }

                if (averageCount >= 4) {
                    averageCount = 1;
                } else {
                    averageCount += 1;
                }

                const updateQuery = `UPDATE ${tableName} SET playtimeStart = ?, averagePlaytime = ?, averageCount = ? WHERE UUID = ?`;

                await runAsync(updateQuery, [currentPlaytime, newAverage, averageCount, member.UUID]);
            }

            for (const member of guildMembers) {
                await runAsync(`INSERT OR IGNORE INTO ${tableName} (UUID, playtimeStart, averagePlaytime, averageCount) VALUES (?, ?, -1, 0)`, [member.UUID, member.playtime]);
            }
        }
    }
}

async function doesTableExist(tableName) {
    const result = await getAsync('SELECT name FROM sqlite_master WHERE type = \'table\' AND name = ?', [tableName]);
    return !!result;
}

async function updateExceptions() {
    const configsPath = path.join(__dirname, 'configs');

    try {
        const files = await fs.readdir(configsPath);

        for (const file of files) {
            const filePath = path.join(configsPath, file);

            const data = await fs.readFile(filePath, 'utf8');
            const config = JSON.parse(data);

            if (config['demotionExceptions']) {
                for (const [username, period] of Object.entries(config['demotionExceptions'])) {
                    if (period > 1) {
                        config['demotionExceptions'][username] = period - 1;
                    } else if (period === 1) {
                        delete config['demotionExceptions'][username];
                    }
                }
            }

            if (config['promotionExceptions']) {
                for (const [username, period] of Object.entries(config['promotionExceptions'])) {
                    if (period > 1) {
                        config['promotionExceptions'][username] = period - 1;
                    } else if (period === 1) {
                        delete config['promotionExceptions'][username];
                    }
                }
            }

            fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
        }
    } catch (err) {
        console.error('Error updating exceptions:', err);
    }
}

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

    if (freeFunctionRuns % 10 === 0) {
        // Updates the guild and guild rank for each member of each guild.
        console.log('Updating guild members');
        await updateGuildMembers();
    }

    if (freeFunctionRuns == 50) {
        // Updates the guilds database with new guilds and removes deleted guilds.
        console.log('Updating list of all guilds.');
        await updateGuilds();

        freeFunctionRuns = -1;
    }

    freeFunctionRuns++;

    runFreeFunction();
}

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

async function setup() {
    const guildTableExists = await doesTableExist('guilds');
    const playerTableExists = await doesTableExist('players');

    if (!guildTableExists) {
        await runAsync('CREATE TABLE "guilds" (name TEXT NOT NULL PRIMARY KEY, prefix TEXT, level INT, xpPercent INT, wars INT, rating INT, average0000 DECIMAL, captains0000 DECIMAL, average0015 DECIMAL, captains0015 DECIMAL, average0030 DECIMAL, captains0030 DECIMAL, average0045 DECIMAL, captains0045 DECIMAL, average0100 DECIMAL, captains0100 DECIMAL, average0115 DECIMAL, captains0115 DECIMAL, average0130 DECIMAL, captains0130 DECIMAL, average0145 DECIMAL, captains0145 DECIMAL, average0200 DECIMAL, captains0200 DECIMAL, average0215 DECIMAL, captains0215 DECIMAL, average0230 DECIMAL, captains0230 DECIMAL, average0245 DECIMAL, captains0245 DECIMAL, average0300 DECIMAL, captains0300 DECIMAL, average0315 DECIMAL, captains0315 DECIMAL, average0330 DECIMAL, captains0330 DECIMAL, average0345 DECIMAL, captains0345 DECIMAL, average0400 DECIMAL, captains0400 DECIMAL, average0415 DECIMAL, captains0415 DECIMAL, average0430 DECIMAL, captains0430 DECIMAL, average0445 DECIMAL, captains0445 DECIMAL, average0500 DECIMAL, captains0500 DECIMAL, average0515 DECIMAL, captains0515 DECIMAL, average0530 DECIMAL, captains0530 DECIMAL, average0545 DECIMAL, captains0545 DECIMAL, average0600 DECIMAL, captains0600 DECIMAL, average0615 DECIMAL, captains0615 DECIMAL, average0630 DECIMAL, captains0630 DECIMAL, average0645 DECIMAL, captains0645 DECIMAL, average0700 DECIMAL, captains0700 DECIMAL, average0715 DECIMAL, captains0715 DECIMAL, average0730 DECIMAL, captains0730 DECIMAL, average0745 DECIMAL, captains0745 DECIMAL, average0800 DECIMAL, captains0800 DECIMAL, average0815 DECIMAL, captains0815 DECIMAL, average0830 DECIMAL, captains0830 DECIMAL, average0845 DECIMAL, captains0845 DECIMAL, average0900 DECIMAL, captains0900 DECIMAL, average0915 DECIMAL, captains0915 DECIMAL, average0930 DECIMAL, captains0930 DECIMAL, average0945 DECIMAL, captains0945 DECIMAL, average1000 DECIMAL, captains1000 DECIMAL, average1015 DECIMAL, captains1015 DECIMAL, average1030 DECIMAL, captains1030 DECIMAL, average1045 DECIMAL, captains1045 DECIMAL, average1100 DECIMAL, captains1100 DECIMAL, average1115 DECIMAL, captains1115 DECIMAL, average1130 DECIMAL, captains1130 DECIMAL, average1145 DECIMAL, captains1145 DECIMAL, average1200 DECIMAL, captains1200 DECIMAL, average1215 DECIMAL, captains1215 DECIMAL, average1230 DECIMAL, captains1230 DECIMAL, average1245 DECIMAL, captains1245 DECIMAL, average1300 DECIMAL, captains1300 DECIMAL, average1315 DECIMAL, captains1315 DECIMAL, average1330 DECIMAL, captains1330 DECIMAL, average1345 DECIMAL, captains1345 DECIMAL, average1400 DECIMAL, captains1400 DECIMAL, average1415 DECIMAL, captains1415 DECIMAL, average1430 DECIMAL, captains1430 DECIMAL, average1445 DECIMAL, captains1445 DECIMAL, average1500 DECIMAL, captains1500 DECIMAL, average1515 DECIMAL, captains1515 DECIMAL, average1530 DECIMAL, captains1530 DECIMAL, average1545 DECIMAL, captains1545 DECIMAL, average1600 DECIMAL, captains1600 DECIMAL, average1615 DECIMAL, captains1615 DECIMAL, average1630 DECIMAL, captains1630 DECIMAL, average1645 DECIMAL, captains1645 DECIMAL, average1700 DECIMAL, captains1700 DECIMAL, average1715 DECIMAL, captains1715 DECIMAL, average1730 DECIMAL, captains1730 DECIMAL, average1745 DECIMAL, captains1745 DECIMAL, average1800 DECIMAL, captains1800 DECIMAL, average1815 DECIMAL, captains1815 DECIMAL, average1830 DECIMAL, captains1830 DECIMAL, average1845 DECIMAL, captains1845 DECIMAL, average1900 DECIMAL, captains1900 DECIMAL, average1915 DECIMAL, captains1915 DECIMAL, average1930 DECIMAL, captains1930 DECIMAL, average1945 DECIMAL, captains1945 DECIMAL, average2000 DECIMAL, captains2000 DECIMAL, average2015 DECIMAL, captains2015 DECIMAL, average2030 DECIMAL, captains2030 DECIMAL, average2045 DECIMAL, captains2045 DECIMAL, average2100 DECIMAL, captains2100 DECIMAL, average2115 DECIMAL, captains2115 DECIMAL, average2130 DECIMAL, captains2130 DECIMAL, average2145 DECIMAL, captains2145 DECIMAL, average2200 DECIMAL, captains2200 DECIMAL, average2215 DECIMAL, captains2215 DECIMAL, average2230 DECIMAL, captains2230 DECIMAL, average2245 DECIMAL, captains2245 DECIMAL, average2300 DECIMAL, captains2300 DECIMAL, average2315 DECIMAL, captains2315 DECIMAL, average2330 DECIMAL, captains2330 DECIMAL, average2345 DECIMAL, captains2345 DECIMAL, averageCount INTEGER)');
        await runAsync('CREATE INDEX idx_guildName ON guilds (name)');
    }

    if (!playerTableExists) {
        await runAsync('CREATE TABLE "players" (UUID TEXT NOT NULL PRIMARY KEY, username TEXT, guildName TEXT, guildRank TEXT, rank TEXT, veteran INT, lastJoin TEXT, isOnline INT, onlineWorld TEXT, contributedGuildXP INT, highestClassLevel INT, guildJoinDate TEXT, serverRank TEXT, firstJoin TEXT, completedQuests INT, totalCombatLevel INT, playtime INT, wars INT)');
        await runAsync('CREATE INDEX "idx_playerGuild" ON "players" (guildName)');
    }

    runFreeFunction();
    runScheduledFunction();
}

setup();
