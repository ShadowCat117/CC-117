const fs = require('fs').promises;
const path = require('path');
const applyRoles = require('./apply_roles');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const minecraftNamePattern = /^[a-zA-Z0-9_]{3,16}$/;

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

async function updateRoles(guild) {
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
            return 'Error reading config file.';
        }

        const guildName = config.guildName;

        const verifiedServerMembers = [];

        const serverMembersToIgnore = [];

        // Verify members of set guild
        if (guildName) {
            // Get all members of guild
            const rows = await allAsync('SELECT UUID, username, discordId FROM players WHERE guildName = ?', [guildName]);

            // Loop through all server members
            for (const serverMember of guild.members.cache.values()) {
                // Ignore bots
                if (serverMember.user.bot) {
                    continue;
                }

                // Loop through all guild members
                for (let i = 0; i < rows.length; i++) {
                    const guildMember = rows[i];

                    if (guildMember.discordId === serverMember.user.id) {
                        // Call applyRoles
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);
    
                        // Set member as to be ignored in future loops
                        serverMembersToIgnore.push(serverMember.user.username);
    
                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');
    
                        if (updated > 0) {
                            // Update message
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
    
                        // Set member as one who has been verified
                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }
    
                        rows.splice(i, 1);
                        break;
                    }
    
                    let nickname = undefined;
    
                    // If they have a nickname, remove the guild tag suffix
                    if (serverMember.nickname) {
                        nickname = serverMember.nickname.split(' [')[0];
                    }
    
                    // Check for valid nickname first as that is more likely to be correct
                    if (guildMember.username === nickname) {
                        // Call applyRoles
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);
    
                        // Set member as to be ignored in future loops
                        serverMembersToIgnore.push(serverMember.user.username);
    
                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');
    
                        if (updated > 0) {
                            // Update message
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
    
                        // Set member as one who has been verified
                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }
    
                        rows.splice(i, 1);
                        break;
                    } else if (guildMember.username === serverMember.user.globalName || guildMember.username === serverMember.user.username) {
                        // Call applyRoles
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);
    
                        // Set member as to be ignored in future loops
                        serverMembersToIgnore.push(serverMember.user.username);
    
                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');
    
                        if (updated > 0) {
                            // Update message
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
    
                        // Set member as one who has been verified
                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }
    
                        rows.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Loop through all set allies
        for (const allyGuild of config.allies) {
            // Get members of current ally
            const allyRows = await allAsync('SELECT UUID, username, discordId FROM players WHERE guildName = ?', [allyGuild]);

            // Loop through all server members
            for (const serverMember of guild.members.cache.values()) {
                // Ignore bots and members who were verified previously
                if (serverMember.user.bot || serverMembersToIgnore.includes(serverMember.user.username)) {
                    continue;
                }

                // Loop through guild members
                for (let i = 0; i < allyRows.length; i++) {
                    const guildMember = allyRows[i];

                    if (guildMember.discordId === serverMember.user.id) {
                        // Call applyRoles
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);
    
                        // Set member as to be ignored in future loops
                        serverMembersToIgnore.push(serverMember.user.username);
    
                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');
    
                        if (updated > 0) {
                            // Update message
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
    
                        // Set member as one who has been verified
                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }
    
                        allyRows.splice(i, 1);
                        break;
                    }

                    let nickname = undefined;

                    // Remove guild tag suffix from nickname
                    if (serverMember.nickname) {
                        nickname = serverMember.nickname.split(' [')[0];
                    }

                    // Check for valid nickname first as that is more likely to be correct
                    if (guildMember.username === nickname) {
                        // Call applyRoles
                        const updated = await applyRoles(guild, guildMember.UUID, serverMember);

                        const formattedName = serverMember.user.username.replace(/_/g, '\\_');

                        if (updated > 0) {
                            // Update message
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
                    } else if (guildMember.username === serverMember.user.globalName || guildMember.username === serverMember.user.username) {
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

                        // Add as a verified server member
                        if (verifiedServerMembers.indexOf(serverMember.user.username) === -1) {
                            verifiedServerMembers.push(serverMember.user.username);
                        }

                        allyRows.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Loop through all remaining server members, skipping bots and verified members
        for (const serverMember of guild.members.cache.values()) {
            if (verifiedServerMembers.includes(serverMember.user.username) || serverMember.user.bot) {
                continue;
            }

            // Try and get the player by seeing if there is a player with their discord ID registered
            let player = await getAsync('SELECT UUID FROM players WHERE discordId = ?', [serverMember.user.id]);

            // Check for valid nickname first as that is more likely to be correct
            if (!player && serverMember.nickname) {
                const nickname = serverMember.nickname.split(' [')[0];

                // As we are now checking every single remaining member, try and limit what is checked by nickname is a valid username
                if (minecraftNamePattern.test(nickname)) {
                    player = await getAsync('SELECT UUID FROM players WHERE username = ?', [nickname]);
                }
            }

            // No player found from nickname, test for valid global name and retry
            if (!player && minecraftNamePattern.test(serverMember.user.globalName)) {
                player = await getAsync('SELECT UUID FROM players WHERE username = ?', [serverMember.user.globalName]);
            }

            // Still no player, try username. Already has same constraints as a Minecraft username
            if (!player) {
                player = await getAsync('SELECT UUID FROM players WHERE username = ?', [serverMember.user.username]);
            }

            let uuid = null;
            
            if (player) {
                uuid = player['UUID'];
            }

            // Call applyRoles
            const updated = await applyRoles(guild, uuid, serverMember);

            const formattedName = serverMember.user.username.replace(/_/g, '\\_');

            if (updated > 0) {
                // Update message
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

        // Return message
        if (updatedMembers > 0) {
            messageEnd += ')';
            return (messageStart + messageEnd);
        } else {
            return (messageStart);
        }
    } catch (err) {
        console.log(err);
        
        // Currently concurrency errors can happen, so send a response when indication of interruption
        if (updatedMembers > 0) {
            messageEnd += ')';
            return (messageStart + messageEnd + ' (interrupted)');
        } else {
            return (messageStart + ' (interrupted)');
        }
    }
}

module.exports = updateRoles;
