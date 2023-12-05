const sqlite3 = require('sqlite3').verbose();

async function findPrefix(name) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('database/database_updateranks.db');

        const query = 'SELECT prefix FROM guilds WHERE name = ?';
        db.get(query, [name], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                resolve(row.prefix);
                db.close();
            } else {
                resolve(null);
                db.close();
            }
        });
    });
}

module.exports = findPrefix;
