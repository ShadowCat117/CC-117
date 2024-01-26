const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

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

async function findPlayer(input, guildName = '', force = false) {
    if (!force) {
        let query;
        let inputs;

        if (guildName === '') {
            query = 'SELECT * FROM players WHERE UPPER(username) = UPPER(?)';
            inputs = [input];
        } else {
            query = 'SELECT * FROM players WHERE UPPER(username) = UPPER(?) AND guildName = ?';
            inputs = [input, guildName];
        }

        const players = await allAsync(query, inputs);

        if (players.length === 0) {
            return null;
        } else if (players.length === 1) {
            return {
                uuid: players[0].UUID,
                username: players[0].username,
            };
        } else {
            const playerUuids = players.map((row) => row.UUID);
            const playerUsernames = players.map((row) => row.username);
            const playerRanks = players.map((row) => row.rank);
            const playerGuildRanks = players.map((row) => row.guildRank);
            const playerGuildNames = players.map((row) => row.guildName);
            
            return {
                message: 'Multiple possibilities found',
                playerUuids: playerUuids,
                playerUsernames: playerUsernames,
                playerRanks: playerRanks,
                playerGuildRanks: playerGuildRanks,
                playerGuildNames: playerGuildNames,
            };
        }
    } else {
        const query = 'SELECT UUID, username FROM players WHERE UUID = ?';
        const players = await allAsync(query, [input]);

        if (players.length === 0) {
            console.log(`${input} does not exist in the table, force was incorrect`);
            return null;
        } else if (players.length === 1) {
            return {
                uuid: players[0].UUID,
                username: players[0].username,
            };
        }
    }
}

module.exports = findPlayer;
