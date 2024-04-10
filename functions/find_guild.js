const sqlite3 = require('sqlite3').verbose();

function findGuild(input, force = false) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('database/database.db');

        if (!force) {
            const query = 'SELECT * FROM guilds WHERE UPPER(prefix) = UPPER(?) OR UPPER(name) = UPPER(?)';
            db.all(query, [input, input], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (rows.length === 0) {
                    resolve(null);
                } else if (rows.length === 1) {
                    resolve(rows[0].name);
                    db.close();
                } else {
                    const guildNames = rows.map((row) => row.name);
                    resolve({
                        message: 'Multiple possibilities found',
                        guildNames: guildNames,
                    });
                    db.close();
                }
            });
        } else {
            const query = 'SELECT * FROM guilds WHERE name = ?';
            db.all(query, [input], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (rows.length === 0) {
                    console.log(`${input} does not exist in the table, force was incorrect`);
                    resolve(null);
                    db.close();
                } else if (rows.length === 1) {
                    resolve(rows[0].name);
                    db.close();
                }
            });
        }
    });
}

module.exports = findGuild;
