const fs = require('fs');
const path = require('path');
const MessageManager = require('../message_type/MessageManager');
const findGuild = require('../database/database');
const ContentTeamValue = require('../values/ContentTeamValue');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

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
        const verifiedRole = guild.roles.cache.get(config['verifiedRole']);
        const allyOwnerRole = guild.roles.cache.get(config['allyOwnerRole']);
        const allyRole = guild.roles.cache.get(config['allyRole']);
        const memberOfRole = guild.roles.cache.get(config['memberOfRole']);
        const veteranRole = guild.roles.cache.get(config['vetRole']);
        const levelRoleOne = guild.roles.cache.get(config['levelRoleOne']);
        const levelRoleTwo = guild.roles.cache.get(config['levelRoleTwo']);
        const levelRoleThree = guild.roles.cache.get(config['levelRoleThree']);
        const levelRoleFour = guild.roles.cache.get(config['levelRoleFour']);
        const levelRoleFive = guild.roles.cache.get(config['levelRoleFive']);
        const levelRoleSix = guild.roles.cache.get(config['levelRoleSix']);
        const levelRoleSeven = guild.roles.cache.get(config['levelRoleSeven']);
        const levelRoleEight = guild.roles.cache.get(config['levelRoleEight']);
        const levelRoleNine = guild.roles.cache.get(config['levelRoleNine']);
        const levelRoleTen = guild.roles.cache.get(config['levelRoleTen']);
        const administratorRole = guild.roles.cache.get(config['administratorRole']);
        const moderatorRole = guild.roles.cache.get(config['moderatorRole']);
        const contentTeamRole = guild.roles.cache.get(config['contentTeamRole']);
        const warRole = guild.roles.cache.get(config['warRole']);
        const tankRole = guild.roles.cache.get(config['tankRole']);
        const healerRole = guild.roles.cache.get(config['healerRole']);
        const damageRole = guild.roles.cache.get(config['damageRole']);
        const soloRole = guild.roles.cache.get(config['soloRole']);
        const ecoRole = guild.roles.cache.get(config['ecoRole']);
        const warrerRole = guild.roles.cache.get(config['warrerRole']);
        const giveawayRole = guild.roles.cache.get(config['giveawayRole']);
        const eventsRole = guild.roles.cache.get(config['eventsRole']);

        const allies = config['allies'];

        const guildRoles = [ownerRole, chiefRole, strategistRole, captainRole, recruiterRole, recruitRole];
        const rankRoles = [championRole, heroRole, vipPlusRole, vipRole];
        const allyRoles = [allyOwnerRole, allyRole];
        const levelRoles = [levelRoleOne, levelRoleTwo, levelRoleThree, levelRoleFour, levelRoleFive, levelRoleSix, levelRoleSeven, levelRoleEight, levelRoleNine, levelRoleTen];
        const serverRankRoles = [administratorRole, moderatorRole, contentTeamRole];
        const warRoles = [warRole, tankRole, healerRole, damageRole, soloRole, ecoRole, warrerRole];

        const levelRoleLevels = [config['levelRoleOneLevel'], config['levelRoleTwoLevel'], config['levelRoleThreeLevel'], config['levelRoleFourLevel'], config['levelRoleFiveLevel'], config['levelRoleSixLevel'], config['levelRoleSevenLevel'], config['levelRoleEightLevel'], config['levelRoleNineLevel'], config['levelRoleTenLevel']];

        const selectQuery = 'SELECT username, guildName, guildRank, rank, veteran, highestClassLevel, serverRank FROM players WHERE UUID = ?';
        const selectParams = [uuid];

        const row = await getAsync(selectQuery, selectParams);

        const memberRoles = member.roles.cache;

        let errorMessage = '';

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
                } else if (role === veteranRole && memberRoles.has(veteranRole.id)) {
                    await member.roles.remove(veteranRole)
                        .then(() => {
                            console.log(`Removed veteran role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove veteran role from ${member.user.username}.\n`;
                        });
                } else if (role === memberOfRole && memberRoles.has(memberOfRole.id)) {
                    await member.roles.remove(memberOfRole)
                        .then(() => {
                            console.log(`Removed member of role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove member of role from ${member.user.username}.\n`;
                        });
                } else if (levelRoles.includes(role)) {
                    await member.roles.remove(role)
                        .then(() => {
                            console.log(`Removed level role ${role.name} from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove level role ${role.name} from ${member.user.username}.\n`;
                        });
                } else if (serverRankRoles.includes(role) && memberRoles.has(role.id)) {
                    await member.roles.remove(role)
                        .then(() => {
                            console.log(`Removed server rank role ${role.name} from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove server rank role ${role.name} from ${member.user.username}.\n`;
                        });
                } else if (warRoles.includes(role) && memberRoles.has(role.id)) {
                    await member.roles.remove(role)
                        .then(() => {
                            console.log(`Removed war role ${role.name} from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove war role ${role.name} from ${member.user.username}.\n`;
                        });
                } else if (role === giveawayRole && memberRoles.has(giveawayRole.id)) {
                    await member.roles.remove(giveawayRole)
                        .then(() => {
                            console.log(`Removed giveaway role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove giveaway role from ${member.user.username}.\n`;
                        });
                } else if (role === eventsRole && memberRoles.has(eventsRole.id)) {
                    await member.roles.remove(eventsRole)
                        .then(() => {
                            console.log(`Removed events role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove events role from ${member.user.username}.\n`;
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
            
            if (config.verifyMembers && (verifiedRole && memberRoles.has(verifiedRole.id))) {
                await member.roles.remove(verifiedRole)
                        .then(() => {
                            console.log(`Removed verified role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove verified role from ${member.user.username}.\n`;
                        });
            }

            let response = 0;

            if (hasUpdated) {
                response = 1;
            }

            if (member.id !== member.guild.ownerId) {
                try {
                    await member.setNickname(null);
                } catch (ex) {
                    errorMessage += `Failed to change nickname for ${member.user.username}.`;
                }
            }

            if (errorMessage !== '' && config.logMessages) {
                MessageManager.sendMessage(guild, config.logChannel, errorMessage);
            }

            return response;
        }

        const guildRank = row.guildRank;
        const rank = row.rank;
        const veteran = row.veteran;
        const serverRank = row.serverRank;

        if (guildRank) {
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
            } else if (allies.includes(row.guildName)) {
                if (guildRank === 'OWNER') {
                    if (allyOwnerRole && !memberRoles.has(allyOwnerRole.id)) {
                        await member.roles.add(allyOwnerRole)
                            .then(() => {
                                console.log(`Added ally owner role to ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to add ally owner role to ${member.user.username}.\n`;
                            });
                    } else if (!allyOwnerRole) {
                        errorMessage += `Ally owner role ${guildRank} is not defined in the config or is invalid.\n`;
                    }
                } else {
                    if (allyOwnerRole && memberRoles.has(allyOwnerRole.id)) {
                        await member.roles.remove(allyOwnerRole)
                            .then(() => {
                                console.log(`Removed ally owner role from ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to remove ally owner role from ${member.user.username}.\n`;
                            });
                    }
                }

                if (allyRole && !memberRoles.has(allyRole.id)) {
                    await member.roles.add(allyRole)
                        .then(() => {
                            console.log(`Added ally role to ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to add ally role to ${member.user.username}.\n`;
                        });
                } else if (!allyRole) {
                    errorMessage += 'Ally role is not defined in the config or is invalid.\n';
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
                    } else if (warRoles.includes(role) && memberRoles.has(role.id)) {
                        await member.roles.remove(role)
                            .then(() => {
                                console.log(`Removed war role ${role.name} from ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to remove war role ${role.name} from ${member.user.username}.\n`;
                            });
                    } else if (role === giveawayRole && memberRoles.has(giveawayRole.id)) {
                        await member.roles.remove(giveawayRole)
                            .then(() => {
                                console.log(`Removed giveaway role from ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to remove giveaway role from ${member.user.username}.\n`;
                            });
                    } else if (role === eventsRole && memberRoles.has(eventsRole.id)) {
                        await member.roles.remove(eventsRole)
                            .then(() => {
                                console.log(`Removed events role from ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to remove events role from ${member.user.username}.\n`;
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
                } else if (warRoles.includes(role) && memberRoles.has(role.id)) {
                    await member.roles.remove(role)
                        .then(() => {
                            console.log(`Removed war role ${role.name} from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove war role ${role.name} from ${member.user.username}.\n`;
                        });
                } else if (role === giveawayRole && memberRoles.has(giveawayRole.id)) {
                    await member.roles.remove(giveawayRole)
                        .then(() => {
                            console.log(`Removed giveaway role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove giveaway role from ${member.user.username}.\n`;
                        });
                } else if (role === eventsRole && memberRoles.has(eventsRole.id)) {
                    await member.roles.remove(eventsRole)
                        .then(() => {
                            console.log(`Removed events role from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove events role from ${member.user.username}.\n`;
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

        if (config.serverRankRoles) {
            if (serverRank && serverRank !== 'Player') {
                let serverRankRoleToApply;

                for (const contentTeamValue of Object.values(ContentTeamValue)) {
                    if (serverRank === contentTeamValue) {
                        serverRankRoleToApply = contentTeamRole;
                    }
                }

                if (!serverRankRoleToApply) {
                    if (serverRank === 'Moderator') {
                        serverRankRoleToApply = moderatorRole;
                    } else if (serverRank === 'Administrator' || serverRank === 'Developer' || serverRank === 'WebDev') {
                        serverRankRoleToApply = administratorRole;
                    }
                }

                if (serverRankRoleToApply && !memberRoles.has(serverRankRoleToApply.id)) {
                    await member.roles.add(serverRankRoleToApply)
                        .then(() => {
                            console.log(`Added server rank role to ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to add server rank role to ${member.user.username}.\n`;
                        });

                    for (const role of serverRankRoles.values()) {
                        if (serverRankRoles.includes(role) && role !== serverRankRoleToApply && memberRoles.has(role.id)) {
                            await member.roles.remove(role)
                                .then(() => {
                                    console.log(`Removed server rank role ${role.name} from ${member.user.username}`);
                                    hasUpdated = true;
                                })
                                .catch(() => {
                                    errorMessage += `Failed to remove server rank role ${role.name} from ${member.user.username}.\n`;
                                });
                        }
                    }
                }
            } else {
                for (const role of serverRankRoles.values()) {
                    if (serverRankRoles.includes(role) && memberRoles.has(role.id)) {
                        await member.roles.remove(role)
                            .then(() => {
                                console.log(`Removed server rank role ${role.name} from ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to remove server rank role ${role.name} from ${member.user.username}.\n`;
                            });
                    }
                }
            }
        }

        if (config.levelRoles) {
            let levelRoleToApply;

            for (let i = 0; i < levelRoles.length; i++) {
                if (levelRoleLevels[i] && row.highestClassLevel >= levelRoleLevels[i]) {
                    if (levelRoles[i] && !memberRoles.has(levelRoles[i].id)) {
                        levelRoleToApply = levelRoles[i];

                        await member.roles.add(levelRoles[i])
                            .then(() => {
                                console.log(`Added level role to ${member.user.username}`);
                                hasUpdated = true;
                            })
                            .catch(() => {
                                errorMessage += `Failed to add level role to ${member.user.username}.\n`;
                            });

                            break;
                    } else if (!levelRoles[i]) {
                        errorMessage += `Level role ${i + 1} is not defined in the config or is invalid.\n`;
                    } else if (memberRoles.has(levelRoles[i].id)) {
                        levelRoleToApply = levelRoles[i];
                        break;
                    }
                }
            }

            for (const role of memberRoles.values()) {
                if (levelRoles.includes(role) && role !== levelRoleToApply) {
                    await member.roles.remove(role)
                        .then(() => {
                            console.log(`Removed level role ${role.name} from ${member.user.username}`);
                            hasUpdated = true;
                        })
                        .catch(() => {
                            errorMessage += `Failed to remove level role ${role.name} from ${member.user.username}.\n`;
                        });
                }
            }
        }

        if (config.verifyMembers && unverifiedRole && memberRoles.has(unverifiedRole.id)) {
            await member.roles.remove(unverifiedRole)
                .then(() => console.log(`Removed unverified role from ${member.user.username}`))
                .catch(() => {
                    errorMessage += `Failed to remove unverified role from ${member.user.username}.\n`;
                });
        } else if (config.verifyMembers && !unverifiedRole) {
            errorMessage += 'Unverified role is not defined in the config or is invalid.\n';
        }

        if (config.verifyMembers && verifiedRole && !memberRoles.has(verifiedRole.id)) {
            await member.roles.add(verifiedRole)
                .then(() => {
                    console.log(`Added verified role to ${member.user.username}`);
                    hasUpdated = true;
                })
                .catch(() => {
                    errorMessage += `Failed to add verified role to ${member.user.username}.\n`;
                });
        } else if (config.verifyMembers && !verifiedRole) {
            errorMessage += 'Verified role is not defined in the config or is invalid.\n';
        }

        if (errorMessage !== '' && config.logMessages) {
            MessageManager.sendMessage(guild, config.logChannel, errorMessage);
        }

        let response;

        if (hasUpdated === false) {
            response = 0;
        } else {
            response = 1;
        }

        if (config.changeNicknames && member.id !== member.guild.ownerId) {
            if (config.guildName === row.guildName || !row.guildName) {
                const validGlobalName = member.user.globalName === row.username;
                let validNickname = member.nickname === row.username;

                if (validNickname === null) {
                    validNickname = validGlobalName;
                }

                if (!validNickname && member.user.username !== row.username) {
                    try {
                        await member.setNickname(row.username);
                    } catch (ex) {
                        MessageManager.sendMessage(guild, config.logChannel, `Failed to change nickname for ${member.user.username}.`);
                    }
                }
            } else {
                if (row.guildName) {
                    const guildPrefix = await findPrefix(row.guildName);

                    if (guildPrefix && config.changeNicknames && member.nickname !== `${row.username} [${guildPrefix}]`) {
                        try {
                            await member.setNickname(`${row.username} [${guildPrefix}]`);
                        } catch (ex) {
                            MessageManager.sendMessage(guild, config.logChannel, `Failed to change nickname for ${member.user.username}.`);
                        }
                    }
                }
            }
        }

        return response;
    } catch (err) {
        console.log(err);
        return -1;
    }
}

module.exports = applyRoles;
