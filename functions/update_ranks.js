const fs = require('fs');
const path = require('path');
const applyRoles = require('./apply_roles');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

function allAsync(query, params) {
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

async function updateRanks(guild) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guild.id}.json`);
    let updatedMembers = 0;
    let messageStart = 'Updated roles for 0 members.';
    let messageEnd = '';

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildName = config.guildName;

        if (!guildName) {
            return 'The server you are in does not have a guild set.';
        }

        try {
            const rows = await allAsync('SELECT UUID, username FROM players WHERE guildName = ?', [guildName]);

            for (const serverMember of guild.members.cache.values()) {
                if (serverMember.user.bot) {
                    continue;
                }

                for (let i = 0; i < rows.length; i++) {
                    const guildMember = rows[i];

                    let nickname = undefined;

                    if (serverMember.nickname) {
                        nickname = serverMember.nickname.split(' [')[0];
                    }

                    if (guildMember.username === serverMember.user.username || guildMember.username === nickname) {
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);

                        if (updated > 0) {
                            if (updatedMembers > 0) {
                                messageEnd += `, ${serverMember.user.username}`;

                                updatedMembers++;
                                messageStart = `Updated roles for ${updatedMembers} members.`;
                            } else {
                                messageEnd += `\n(${serverMember.user.username}`;

                                updatedMembers++;
                                messageStart = `Updated roles for ${updatedMembers} member.`;
                            }
                        }

                        rows.splice(i, 1);
                        break;
                    }
                }
            }

            for (const allyGuild of config.allies) {
                const allyRows = await allAsync('SELECT UUID, username FROM players WHERE guildName = ?', [allyGuild]);

                for (const serverMember of guild.members.cache.values()) {
                    if (serverMember.user.bot) {
                        continue;
                    }

                    for (let i = 0; i < allyRows.length; i++) {
                        const guildMember = allyRows[i];

                        let nickname = undefined;

                        if (serverMember.nickname) {
                            nickname = serverMember.nickname.split(' [')[0];
                        }

                        if (guildMember.username === serverMember.user.username || guildMember.username === nickname) {
                            const updated = await applyRoles(guild, guildMember.UUID, serverMember);

                            if (updated > 0) {
                                if (updatedMembers > 0) {
                                    messageEnd += `, ${serverMember.user.username}`;

                                    updatedMembers++;
                                    messageStart = `Updated roles for ${updatedMembers} members.`;
                                } else {
                                    messageEnd += `\n(${serverMember.user.username}`;

                                    updatedMembers++;
                                    messageStart = `Updated roles for ${updatedMembers} member.`;
                                }
                            }

                            allyRows.splice(i, 1);
                            break;
                        }
                    }
                }
            }

            if (updatedMembers > 0) {
                messageEnd += ')';
                return (messageStart + messageEnd);
            } else {
                return (messageStart);
            }
        } catch (err) {
            console.log(err);
            return 'Problem updating ranks';
        }
    } catch (err) {
        return 'Problem updating ranks';
    }
}

module.exports = updateRanks;
