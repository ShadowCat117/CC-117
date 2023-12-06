const fs = require('fs').promises;
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

async function updateRanks(guild) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guild.id}.json`);
    let updatedMembers = 0;
    let messageStart = 'Updated roles for 0 members.';
    let messageEnd = '';

    try {
        let config = {};

        try {
            await fs.access(filePath);
            const fileData = await fs.readFile(filePath, 'utf-8');
            config = JSON.parse(fileData);
        } catch (err) {
            return 'The server you are in does not have a guild set.';
        }

        const guildName = config.guildName;

        if (!guildName) {
            return 'The server you are in does not have a guild set.';
        }

        const rows = await allAsync('SELECT UUID, username FROM players WHERE guildName = ?', [guildName]);

        const verifiedServerMembers = [];

        const serverMembersToIgnore = [];

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

                if (guildMember.username === nickname || guildMember.username === serverMember.user.globalName || guildMember.username === serverMember.user.username) {
                    const updated = await applyRoles(guild, guildMember.UUID, serverMember);

                    serverMembersToIgnore.push(serverMember.user.username);

                    const formattedName = serverMember.user.username.replace(/_/g, '\\_');

                    if (updated > 0) {
                        if (updatedMembers > 0) {
                            messageEnd += `, ${formattedName}`;

                            updatedMembers++;
                            messageStart = `Updated roles for ${updatedMembers} members.`;
                        } else {
                            messageEnd += `\n(${formattedName}`;

                            updatedMembers++;
                            messageStart = `Updated roles for ${updatedMembers} member.`;
                        }
                    }

                    if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                        verifiedServerMembers.push(serverMember.user.username);
                    }

                    rows.splice(i, 1);
                    break;
                }
            }
        }

        for (const allyGuild of config.allies) {
            const allyRows = await allAsync('SELECT UUID, username FROM players WHERE guildName = ?', [allyGuild]);

            for (const serverMember of guild.members.cache.values()) {
                if (serverMember.user.bot || serverMembersToIgnore.includes(serverMember.user.username)) {
                    continue;
                }

                for (let i = 0; i < allyRows.length; i++) {
                    const guildMember = allyRows[i];

                    let nickname = undefined;

                    if (serverMember.nickname) {
                        nickname = serverMember.nickname.split(' [')[0];
                    }

                    if (guildMember.username === nickname || guildMember.username === serverMember.user.globalName || guildMember.username === serverMember.user.username) {
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);

                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');

                        if (updated > 0) {
                            if (updatedMembers > 0) {
                                messageEnd += `, ${formattedName}`;

                                updatedMembers++;
                                messageStart = `Updated roles for ${updatedMembers} members.`;
                            } else {
                                messageEnd += `\n(${formattedName}`;

                                updatedMembers++;
                                messageStart = `Updated roles for ${updatedMembers} member.`;
                            }
                        }

                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }

                        allyRows.splice(i, 1);
                        break;
                    }
                }
            }
        }

        for (const serverMember of guild.members.cache.values()) {
            if (verifiedServerMembers.includes(serverMember.user.username) || serverMember.user.bot) {
                continue;
            }

            let player = await getAsync('SELECT UUID FROM players WHERE username = ?', [serverMember.user.username]);

            if (!player) {
                player = await getAsync('SELECT UUID FROM players WHERE username = ?', [serverMember.user.globalName]);
            }

            if (!player) {
                if (serverMember.nickname) {
                    const nickname = serverMember.nickname.split(' [')[0];

                    player = await getAsync('SELECT UUID FROM players WHERE username = ?', [nickname]);
                }
            }

            let uuid = null;
            
            if (player) {
                uuid = player['UUID'];
            }

            const updated = await applyRoles(guild, uuid, serverMember, true);

            const formattedName = serverMember.user.username.replace(/_/g, '\\_');

            if (updated > 0) {
                if (updatedMembers > 0) {
                    messageEnd += `, ${formattedName}`;

                    updatedMembers++;
                    messageStart = `Updated roles for ${updatedMembers} members.`;
                } else {
                    messageEnd += `\n(${formattedName}`;

                    updatedMembers++;
                    messageStart = `Updated roles for ${updatedMembers} member.`;
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
}

module.exports = updateRanks;
