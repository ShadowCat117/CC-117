const fs = require('fs');
const path = require('path');
const sendMessage = require('./send_message');
const findPrefix = require('./find_prefix');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

async function applyRoles(guild, uuid, member) {
    const guildId = guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);
    let hasUpdated = false;

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const ownerRole = guild.roles.cache.get(config['ownerRole']);
        const chiefRole = guild.roles.cache.get(config['chiefRole']);
        const strategistRole = guild.roles.cache.get(config['strategistRole']);
        const captainRole = guild.roles.cache.get(config['captainRole']);
        const recruiterRole = guild.roles.cache.get(config['recruiterRole']);
        const recruitRole = guild.roles.cache.get(config['recruitRole']);
        const championRole = guild.roles.cache.get(config['championRole']);
        const heroRole = guild.roles.cache.get(config['heroRole']);
        const vipPlusRole = guild.roles.cache.get(config['vipPlusRole']);
        const vipRole = guild.roles.cache.get(config['vipRole']);
        const unverifiedRole = guild.roles.cache.get(config['unverifiedRole']);
        const allyOwnerRole = guild.roles.cache.get(config['allyOwnerRole']);
        const allyRole = guild.roles.cache.get(config['allyRole']);
        const memberOfRole = guild.roles.cache.get(config['memberOfRole']);
        const veteranRole = guild.roles.cache.get(config['vetRole']);

        const guildRoles = [ownerRole, chiefRole, strategistRole, captainRole, recruiterRole, recruitRole];
        const rankRoles = [championRole, heroRole, vipPlusRole, vipRole];
        const allyRoles = [allyOwnerRole, allyRole];

        return new Promise((resolve, reject) => {
            db.get(
                'SELECT username, guildName, guildRank, rank, veteran FROM players WHERE UUID = ?', [uuid],
                async (err, row) => {
                    if (err) {
                        console.error('Error retrieving player data:', err);
                        reject(err);
                        return;
                    }

                    const memberRoles = member.roles.cache;

                    if (!row) {
                        for (const role of memberRoles.values()) {
                            if (guildRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed guild rank role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove guild rank role ${role.name} from ${member.user.username}.\n`;
                                    });
                            } else if (allyRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed ally role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove ally role ${role.name} from ${member.user.username}.\n`;
                                    });
                            } else if (rankRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed rank role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove rank role ${role.name} from ${member.user.username}.\n`;
                                    });
                            } else if (veteranRole && memberRoles.has(veteranRole.id)) {
                                await member.roles.remove(veteranRole)
                                    .then(() => {
                                        console.log(`Removed veteran role from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove veteran role from ${member.user.username}.\n`;
                                    });
                            } else if (memberOfRole && memberRoles.has(memberOfRole.id)) {
                                await member.roles.remove(memberOfRole)
                                    .then(() => {
                                        console.log(`Removed member of role from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove member of role from ${member.user.username}.\n`;
                                    });
                            }
                        }

                        if (config.verifyMembers && (unverifiedRole && !memberRoles.has(unverifiedRole.id))) {
                            await member.roles.add(unverifiedRole)
                                .then(() => {
                                    console.log(`Added unverified role to ${member.user.username}`);
                                    hasUpdated = true;
                                })
                                .catch(() => {
                                    errorMessage += `Failed to add unverified role to ${member.user.username}.\n`;
                                });
                        }

                        let response = 0;

                        if (hasUpdated) {
                            response = true;
                        }

                        resolve(response);
                        return;
                    }

                    const guildRank = row.guildRank;
                    const rank = row.rank;
                    const veteran = row.veteran;

                    let errorMessage = '';

                    let verified = false;

                    if (guildRank) {
                        verified = true;
                        if (row.guildName === config.guildName) {
                            const guildRankRole = guild.roles.cache.get(config[guildRank.toLowerCase() + 'Role']);

                            if (guildRankRole && !memberRoles.has(guildRankRole.id)) {
                                await member.roles.add(guildRankRole)
                                    .then(() => {
                                        console.log(`Added guild rank role ${guildRankRole.name} to ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to add guild rank role ${guildRankRole.name} to ${member.user.username}.\n`;
                                    });
                            } else if (!guildRankRole) {
                                errorMessage += `Guild rank role ${guildRank} is not defined in the config or is invalid.\n`;
                            }

                            if (config.memberOf) {
                                if (memberOfRole && !memberRoles.has(memberOfRole.id)) {
                                    await member.roles.add(memberOfRole)
                                        .then(() => {
                                            console.log(`Added member of role ${memberOfRole.name} to ${member.user.username}`);
                                            hasUpdated = true;
                                        })
                                        .catch(() => {
                                            errorMessage += `Failed to add member of role ${memberOfRole.name} to ${member.user.username}.\n`;
                                        });
                                } else if (!memberOfRole) {
                                    errorMessage += 'Member of role is not defined in the config or is invalid.\n';
                                }
                            }

                            for (const role of memberRoles.values()) {
                                if (guildRoles.includes(role) && role !== guildRankRole) {
                                    await member.roles.remove(role)
                                        .then(() => {
                                            console.log(`Removed guild rank role ${role.name} from ${member.user.username}`);
                                            hasUpdated = true;
                                        })
                                        .catch(() => {
                                            errorMessage += `Failed to remove guild rank role ${role.name} from ${member.user.username}.\n`;
                                        });
                                } else if (allyRoles.includes(role)) {
                                    await member.roles.remove(role)
                                        .then(() => {
                                            console.log(`Removed ally role ${role.name} from ${member.user.username}`);
                                            hasUpdated = true;
                                        })
                                        .catch(() => {
                                            errorMessage += `Failed to remove ally role ${role.name} from ${member.user.username}.\n`;
                                        });
                                }
                            }
                        } else {
                            let guildRankRole;

                            if (guildRank === 'OWNER') {
                                guildRankRole = guild.roles.cache.get(config['allyOwnerRole']);
                            } else {
                                guildRankRole = guild.roles.cache.get(config['allyRole']);
                            }

                            if (guildRankRole && !memberRoles.has(guildRankRole.id)) {
                                await member.roles.add(guildRankRole)
                                    .then(() => {
                                        console.log(`Added ally guild rank role to ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to add ally guild rank role to ${member.user.username}.\n`;
                                    });
                            } else if (!guildRankRole) {
                                errorMessage += `Ally guild rank role ${guildRank} is not defined in the config or is invalid.\n`;
                            }

                            for (const role of memberRoles.values()) {
                                if (guildRoles.includes(role)) {
                                    await member.roles.remove(role)
                                        .then(() => {
                                            console.log(`Removed guild rank role ${role.name} from ${member.user.username}`);
                                            hasUpdated = true;
                                        })
                                        .catch(() => {
                                            errorMessage += `Failed to remove guild rank role ${role.name} from ${member.user.username}.\n`;
                                        });
                                } else if (role === memberOfRole && config.memberOf) {
                                    await member.roles.remove(role)
                                        .then(() => {
                                            console.log(`Removed member of role ${role.name} from ${member.user.username}`);
                                            hasUpdated = true;
                                        })
                                        .catch(() => {
                                            errorMessage += `Failed to remove member of role ${role.name} from ${member.user.username}.\n`;
                                        });
                                }
                            }
                        }
                    } else {
                        for (const role of memberRoles.values()) {
                            if (guildRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed guild rank role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove guild rank role ${role.name} from ${member.user.username}.\n`;
                                    });
                            } else if (allyRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed ally role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove ally role ${role.name} from ${member.user.username}.\n`;
                                    });
                            } else if (role === memberOfRole && config.memberOf) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed member of role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove member of role ${role.name} from ${member.user.username}.\n`;
                                    });
                            }
                        }
                    }

                    if (rank) {
                        let rankRole;

                        if (rank === 'VIP+') {
                            rankRole = guild.roles.cache.get(config['vipPlusRole']);
                        } else {
                            rankRole = guild.roles.cache.get(config[rank.toLowerCase() + 'Role']);
                        }

                        if (rankRole && !memberRoles.has(rankRole.id)) {
                            await member.roles.add(rankRole)
                                .then(() => {
                                    console.log(`Added rank role to ${member.user.username}`);
                                    hasUpdated = true;
                                })
                                .catch(() => {
                                    errorMessage += `Failed to add rank role to ${member.user.username}.\n`;
                                });
                        } else if (!rankRole) {
                            errorMessage += `Rank role ${rank} is not defined in the config or is invalid.\n`;
                        }

                        for (const role of memberRoles.values()) {
                            if (rankRoles.includes(role) && role !== rankRole) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed rank role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove rank role ${role.name} from ${member.user.username}.\n`;
                                    });
                            }
                        }
                    } else {
                        for (const role of memberRoles.values()) {
                            if (rankRoles.includes(role)) {
                                await member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed rank role ${role.name} from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove rank role ${role.name} from ${member.user.username}.\n`;
                                    });
                            }
                        }
                    }

                    if (config.veteranRole) {
                        if (veteran === 1) {
                            if (veteranRole && !memberRoles.has(veteranRole.id)) {
                                await member.roles.add(veteranRole)
                                    .then(() => {
                                        console.log(`Added veteran role to ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to add veteran role to ${member.user.username}.\n`;
                                    });
                            } else if (!veteranRole) {
                                errorMessage += 'Veteran role is not defined in the config or is invalid.\n';
                            }
                        } else {
                            if (veteranRole && memberRoles.has(veteranRole.id)) {
                                await member.roles.remove(veteranRole)
                                    .then(() => {
                                        console.log(`Removed veteran role from ${member.user.username}`);
                                        hasUpdated = true;
                                    })
                                    .catch(() => {
                                        errorMessage += `Failed to remove veteran role from ${member.user.username}.\n`;
                                    });
                            }
                        }
                    }

                    if (config.verifyMembers && unverifiedRole && memberRoles.has(unverifiedRole.id) && verified) {
                        await member.roles.remove(unverifiedRole)
                            .then(() => console.log(`Removed unverified role from ${member.user.username}`))
                            .catch(() => {
                                errorMessage += `Failed to remove unverified role from ${member.user.username}.\n`;
                            });
                    } else if (config.verifyMembers && unverifiedRole && !memberRoles.has(unverifiedRole.id) && !verified) {
                        await member.roles.add(unverifiedRole)
                            .then(() => {
                                console.log(`Added unverified role to ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to add unverified role to ${member.user.username}.\n`;
                            });
                    } else if (config.verifyMembers && !unverifiedRole) {
                        errorMessage += 'Unverified role is not defined in the config or is invalid.\n';
                    }

                    if (errorMessage !== '' && config.logMessages) {
                        sendMessage(guild, config.logChannel, errorMessage);
                    }

                    let response;

                    if (hasUpdated === false) {
                        response = 0;
                    } else {
                        response = 1;
                    }

                    if (config.changeNicknames) {
                        if (config.guildName === row.guildName) {
                            if (config.changeNicknames && member.user.username !== row.username && member.nickname !== row.username && member.id !== member.guild.ownerId) {
                                await member.setNickname(row.username);
                            }
                        } else {
                            const guildPrefix = await findPrefix(row.guildName);

                            if (guildPrefix && config.changeNicknames && member.nickname !== `${row.username} [${guildPrefix}]` && member.id !== member.guild.ownerId) {
                                await member.setNickname(`${row.username} [${guildPrefix}]`);
                            }
                        }
                    }

                    resolve(response);
                    return;
                });
        });
    } catch (err) {
        console.log(err);
        return -1;
    }
}

module.exports = applyRoles;
