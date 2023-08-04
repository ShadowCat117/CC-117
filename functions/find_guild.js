const sqlite3 = require('sqlite3').verbose();
const https = require('https');

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
                    console.log(`No guild matching ${input}, searching API`);

                    https.get(`https://api.wynncraft.com/public_api.php?action=guildStats&command=${input}`, (resp) => {
                        let data = '';

                        resp.on('data', (chunk) => {
                            data += chunk;
                        });

                        resp.on('end', () => {
                            const json = JSON.parse(data);

                            if (json.name === undefined) {
                                resolve(null);
                                db.close();
                            } else {
                                db.run(
                                    'INSERT INTO guilds (name, prefix) VALUES (?, ?)', [
                                    json.name,
                                    json.prefix,
                                ],
                                    (err) => {
                                        if (err) {
                                            console.error('Failed to insert guild:', err);
                                        }
                                    },
                                );
                                resolve(input);
                                db.close();
                            }
                        });
                    }).on('error', () => {
                        resolve(null);
                        db.close();
                    });
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
