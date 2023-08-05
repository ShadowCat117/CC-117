const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const ButtonedMessage = require('../message_type/ButtonedMessage');
const db = new sqlite3.Database('database/database.db');
const VerifiedMember = require('../message_objects/VerifiedMember');

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

async function verified(interaction) {
    const guildId = interaction.guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildName = config.guildName;

        if (!guildName) {
            return new ButtonedMessage('', [], '', ['You have not set a guild.']);
        }

        const rows = await allAsync('SELECT username FROM players WHERE guildName = ? ORDER BY username DESC', [guildName]);

        if (rows.length === 0) {
            return new ButtonedMessage('', [], '', [`No members of ${guildName} found.`]);
        }

        const verifiedMembers = rows.map(row => {
            return new VerifiedMember(row.username, interaction.guild.members.cache.values());
        });

        const pages = [];
        let verifiedMembersPage = '```diff\n';
        let counter = 0;

        verifiedMembers.forEach((player) => {
            if (counter === 20) {
                verifiedMembersPage += '```';
                pages.push(verifiedMembersPage);
                verifiedMembersPage = '```diff\n' + player.toString();
                counter = 1;
            } else {
                verifiedMembersPage += player.toString();
                counter++;
            }
        });

        if (counter !== 20) {
            verifiedMembersPage += '```';
            pages.push(verifiedMembersPage);
        }

        return new ButtonedMessage('', [], '', pages);
    } catch (error) {
        console.log(error);
        return new ButtonedMessage('', [], '', ['Error checking for verified members.']);
    }
}

module.exports = verified;
