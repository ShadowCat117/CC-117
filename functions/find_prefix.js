const sqlite3 = require('sqlite3').verbose();

async function findPrefix(name) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('database/database.db');

      const query = 'SELECT prefix FROM guilds WHERE name = ?';
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row.prefix);
        db.close();
      });
    });
}

module.exports = findPrefix;
