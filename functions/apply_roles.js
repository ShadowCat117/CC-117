const fs = require('fs');
const path = require('path');
const ContentTeamValue = require('../values/ContentTeamValue');

// Will apply roles for the given server member
// guild: The current Discord server.
// member: The Discord member to apply the roles to.
// playerInfo: The info on the player to apply roles based on.
async function applyRoles(guild, member, playerInfo) {
    const guildId = guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    const updates = [];
    const errors = [];

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
        const veteranRole = guild.roles.cache.get(config['veteranRole']);
        const administratorRole = guild.roles.cache.get(
            config['administratorRole'],
        );
        const moderatorRole = guild.roles.cache.get(config['moderatorRole']);
        const contentTeamRole = guild.roles.cache.get(
            config['contentTeamRole'],
        );
        const warRole = guild.roles.cache.get(config['warRole']);
        const tankRole = guild.roles.cache.get(config['tankRole']);
        const healerRole = guild.roles.cache.get(config['healerRole']);
        const damageRole = guild.roles.cache.get(config['damageRole']);
        const soloRole = guild.roles.cache.get(config['soloRole']);
        const ecoRole = guild.roles.cache.get(config['ecoRole']);
        const warPingRole = guild.roles.cache.get(config['warPingRole']);
        const giveawayRole = guild.roles.cache.get(config['giveawayRole']);
        const eventsRole = guild.roles.cache.get(config['eventsRole']);
        const guildRaidRole = guild.roles.cache.get(config['guildRaidRole']);
        const levelRoles = [];

        for (const levelRole in config['levelRoles']) {
            levelRoles.push(
                guild.roles.cache.get(config['levelRoles'][levelRole]),
            );
        }

        const allies = config['allies'];

        const guildRoles = [
            ownerRole,
            chiefRole,
            strategistRole,
            captainRole,
            recruiterRole,
            recruitRole,
        ];
        const supportRankRoles = [championRole, heroRole, vipPlusRole, vipRole];
        const allyRoles = [allyOwnerRole, allyRole];
        const serverRankRoles = [
            administratorRole,
            moderatorRole,
            contentTeamRole,
        ];
        const warRoles = [
            warRole,
            tankRole,
            healerRole,
            damageRole,
            soloRole,
            ecoRole,
            warPingRole,
        ];

        const memberRoles = member.roles.cache;

        let nickname = null;

        if (playerInfo === null) {
            // Unverify player, remove all roles given by the bot and reset nickname
            for (const role of memberRoles.values()) {
                if (guildRoles.includes(role)) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed guild rank role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove guild rank role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (allyRoles.includes(role)) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed ally role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove ally role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (supportRankRoles.includes(role)) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed support rank role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove support rank role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    role === veteranRole &&
                    memberRoles.has(veteranRole.id)
                ) {
                    await member.roles
                        .remove(veteranRole)
                        .then(() => {
                            console.log(
                                `Removed veteran role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove veteran role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    role === memberOfRole &&
                    memberRoles.has(memberOfRole.id)
                ) {
                    await member.roles
                        .remove(memberOfRole)
                        .then(() => {
                            console.log(
                                `Removed member of role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove member of role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (levelRoles.includes(role)) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed level role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove level role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    serverRankRoles.includes(role) &&
                    memberRoles.has(role.id)
                ) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed server rank role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove server rank role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    warRoles.includes(role) &&
                    memberRoles.has(role.id)
                ) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed war role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove war role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    role === giveawayRole &&
                    memberRoles.has(giveawayRole.id)
                ) {
                    await member.roles
                        .remove(giveawayRole)
                        .then(() => {
                            console.log(
                                `Removed giveaway role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove giveaway role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    role === eventsRole &&
                    memberRoles.has(eventsRole.id)
                ) {
                    await member.roles
                        .remove(eventsRole)
                        .then(() => {
                            console.log(
                                `Removed events role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove events role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                } else if (
                    role === guildRaidRole &&
                    memberRoles.has(guildRaidRole.id)
                ) {
                    await member.roles
                        .remove(guildRaidRole)
                        .then(() => {
                            console.log(
                                `Removed guild raid role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove guild raid role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                }
            }

            if (unverifiedRole && !memberRoles.has(unverifiedRole.id)) {
                await member.roles
                    .add(unverifiedRole)
                    .then(() => {
                        console.log(
                            `Added unverified role ${unverifiedRole.name} to ${member.user.username}`,
                        );
                        updates.push(`Added ${unverifiedRole}.`);
                    })
                    .catch(() => {
                        console.error(
                            `Failed to add unverified role ${unverifiedRole.name} to ${member.user.username}`,
                        );
                        errors.push(`Failed to add ${unverifiedRole}.`);
                    });
            }

            if (verifiedRole && memberRoles.has(verifiedRole.id)) {
                await member.roles
                    .remove(verifiedRole)
                    .then(() => {
                        console.log(
                            `Removed verified role ${verifiedRole.name} from ${member.user.username}`,
                        );
                        updates.push(`Removed ${verifiedRole}.`);
                    })
                    .catch(() => {
                        console.error(
                            `Failed to remove events role ${verifiedRole.name} from ${member.user.username}`,
                        );
                        errors.push(`Failed to remove ${verifiedRole}.`);
                    });
            }

            if (member.id !== member.guild.ownerId && member.nickname) {
                try {
                    await member.setNickname(null);
                    updates.push('Removed nickname');
                } catch (ex) {
                    console.error(ex);
                    errors.push(`Failed to remove ${member}'s nickname.`);
                }
            }
        } else {
            // Verified member, change nickname to match username and remove unverified role
            const username = playerInfo.username;
            const guildUuid = playerInfo.guildUuid;
            const guildPrefix = playerInfo.guildPrefix;
            const guildRank = playerInfo.guildRank;
            const supportRank = playerInfo.supportRank;
            const veteran = playerInfo.veteran;
            const serverRank = playerInfo.serverRank;
            const level = playerInfo.highestCharacterLevel;

            if (guildUuid === config.guild) {
                // Guild member, apply guild rank role and member of role
                const guildRankRole = guild.roles.cache.get(
                    config[guildRank + 'Role'],
                );

                if (guildRankRole && !memberRoles.has(guildRankRole.id)) {
                    await member.roles
                        .add(guildRankRole)
                        .then(() => {
                            console.log(
                                `Added guild rank role ${guildRankRole.name} to ${member.user.username}`,
                            );
                            updates.push(`Added ${guildRankRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add guild rank role ${guildRankRole.name} to ${member.user.username}`,
                            );
                            errors.push(`Failed to add ${guildRankRole}.`);
                        });
                } else if (!guildRankRole) {
                    errors.push(
                        `Guild rank role ${guildRank}  is not defined in the config or is invalid.`,
                    );
                }

                if (memberOfRole && !memberRoles.has(memberOfRole.id)) {
                    await member.roles
                        .add(memberOfRole)
                        .then(() => {
                            console.log(
                                `Added member of role ${memberOfRole.name} to ${member.user.username}`,
                            );
                            updates.push(`Added ${memberOfRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add member of role ${memberOfRole.name} to ${member.user.username}`,
                            );
                            errors.push(`Failed to add ${memberOfRole}.`);
                        });
                } else if (!memberOfRole) {
                    errors.push(
                        'Member of role is not defined in the config or is invalid.',
                    );
                }

                for (const role of memberRoles.values()) {
                    if (guildRoles.includes(role) && role !== guildRankRole) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed guild rank role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove guild rank role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    }
                }
            } else {
                // Not a guild member, remove guild guild rank, member of role, giveaway role, events role and all war roles.
                for (const role of memberRoles.values()) {
                    if (guildRoles.includes(role)) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed guild rank role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove guild rank role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    } else if (memberOfRole && role === memberOfRole) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed member of role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove member of role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    } else if (
                        warRoles.includes(role) &&
                        memberRoles.has(role.id)
                    ) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed war role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove war role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    } else if (
                        role === giveawayRole &&
                        memberRoles.has(giveawayRole.id)
                    ) {
                        await member.roles
                            .remove(giveawayRole)
                            .then(() => {
                                console.log(
                                    `Removed giveaway role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove giveaway role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    } else if (
                        role === eventsRole &&
                        memberRoles.has(eventsRole.id)
                    ) {
                        await member.roles
                            .remove(eventsRole)
                            .then(() => {
                                console.log(
                                    `Removed events role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove events role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    } else if (
                        role === guildRaidRole &&
                        memberRoles.has(guildRaidRole.id)
                    ) {
                        await member.roles
                            .remove(guildRaidRole)
                            .then(() => {
                                console.log(
                                    `Removed guild raid role ${role.name} from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove guild raid role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    }
                }
            }

            if (allies.includes(guildUuid)) {
                // Add ally role and ally owner role if owner
                if (guildRank === 'owner') {
                    if (allyOwnerRole && !memberRoles.has(allyOwnerRole.id)) {
                        await member.roles
                            .add(allyOwnerRole)
                            .then(() => {
                                console.log(
                                    `Added ally owner role to ${member.user.username}`,
                                );
                                updates.push(`Added ${allyOwnerRole}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to add ally owner role ${allyOwnerRole.name} to ${member.user.username}`,
                                );
                                errors.push(`Failed to add ${allyOwnerRole}.`);
                            });
                    } else if (!allyOwnerRole) {
                        errors.push(
                            'Ally owner role is not defined in the config or is invalid.',
                        );
                    }
                } else {
                    if (allyOwnerRole && memberRoles.has(allyOwnerRole.id)) {
                        await member.roles
                            .remove(allyOwnerRole)
                            .then(() => {
                                console.log(
                                    `Removed ally owner role from ${member.user.username}`,
                                );
                                updates.push(`Removed ${allyOwnerRole}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove ally owner role ${allyOwnerRole.name} from ${member.user.username}`,
                                );
                                errors.push(
                                    `Failed to remove ${allyOwnerRole}.`,
                                );
                            });
                    } else if (!allyOwnerRole) {
                        errors.push(
                            'Ally owner role is not defined in the config or is invalid.',
                        );
                    }
                }

                if (allyRole && !memberRoles.has(allyRole.id)) {
                    await member.roles
                        .add(allyRole)
                        .then(() => {
                            console.log(
                                `Added ally role to ${member.user.username}`,
                            );
                            updates.push(`Added ${allyRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add ally role ${allyRole.name} to ${member.user.username}`,
                            );
                            errors.push(`Failed to add ${allyRole}.`);
                        });
                } else if (!allyRole) {
                    errors.push(
                        'Ally role is not defined in the config or is invalid.',
                    );
                }
            } else {
                // Remove ally/ally owner role
                if (allyOwnerRole && memberRoles.has(allyOwnerRole.id)) {
                    await member.roles
                        .remove(allyOwnerRole)
                        .then(() => {
                            console.log(
                                `Removed ally owner role from ${member.user.username}`,
                            );
                            updates.push(`Removed ${allyOwnerRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove ally owner role ${allyOwnerRole.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${allyOwnerRole}.`);
                        });
                } else if (!allyOwnerRole) {
                    errors.push(
                        'Ally owner role is not defined in the config or is invalid.',
                    );
                }

                if (allyRole && memberRoles.has(allyRole.id)) {
                    await member.roles
                        .remove(allyRole)
                        .then(() => {
                            console.log(
                                `Removed ally role from ${member.user.username}`,
                            );
                            updates.push(`Removed ${allyRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove ally role ${allyRole.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${allyRole}.`);
                        });
                } else if (!allyRole) {
                    errors.push(
                        'Ally role is not defined in the config or is invalid.',
                    );
                }
            }

            if (supportRank) {
                let supportRankRole;

                if (supportRank === 'vipplus') {
                    supportRankRole = guild.roles.cache.get(
                        config['vipPlusRole'],
                    );
                } else {
                    supportRankRole = guild.roles.cache.get(
                        config[supportRank + 'Role'],
                    );
                }

                if (supportRankRole && !memberRoles.has(supportRankRole.id)) {
                    await member.roles
                        .add(supportRankRole)
                        .then(() => {
                            console.log(
                                `Added support rank role ${supportRankRole.name} to ${member.user.username}`,
                            );
                            updates.push(`Added ${supportRankRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add support rank role ${supportRankRole.name} to ${member.user.username}`,
                            );
                            errors.push(`Failed to add ${supportRankRole}.`);
                        });
                } else if (!supportRankRole) {
                    errors.push(
                        `Rank role ${supportRank} is not defined in the config or is invalid.`,
                    );
                }

                for (const role of memberRoles.values()) {
                    if (
                        supportRankRoles.includes(role) &&
                        role !== supportRankRole
                    ) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed support rank ${role.name} role from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove support rank role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    }
                }
            } else {
                for (const role of memberRoles.values()) {
                    if (supportRankRoles.includes(role)) {
                        await member.roles
                            .remove(role)
                            .then(() => {
                                console.log(
                                    `Removed support rank ${role.name} role from ${member.user.username}`,
                                );
                                updates.push(`Removed ${role}.`);
                            })
                            .catch(() => {
                                console.error(
                                    `Failed to remove support rank role ${role.name} from ${member.user.username}`,
                                );
                                errors.push(`Failed to remove ${role}.`);
                            });
                    }
                }
            }

            if (veteranRole) {
                if (veteran && !memberRoles.has(veteranRole.id)) {
                    await member.roles
                        .add(veteranRole)
                        .then(() => {
                            console.log(
                                `Added veteran role ${veteranRole.name} to ${member.user.username}`,
                            );
                            updates.push(`Added ${veteranRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add veteran role ${veteranRole.name} to ${member.user.username}`,
                            );
                            errors.push(`Failed to add ${veteranRole}.`);
                        });
                } else if (!veteran && memberRoles.has(veteranRole.id)) {
                    await member.roles
                        .remove(veteranRole)
                        .then(() => {
                            console.log(
                                `Removed veteran role ${veteranRole.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${veteranRole}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove veteran role ${veteranRole.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${veteranRole}.`);
                        });
                }
            }

            let highestLevel = 0;
            let levelRole;

            for (const roleLevel in config['levelRoles']) {
                const roleLevelInt = parseInt(roleLevel);

                if (roleLevelInt > highestLevel && level >= roleLevelInt) {
                    highestLevel = parseInt(roleLevel);
                    levelRole = guild.roles.cache.get(
                        config['levelRoles'][roleLevel],
                    );
                }
            }

            if (levelRole && !memberRoles.has(levelRole.id)) {
                await member.roles
                    .add(levelRole)
                    .then(() => {
                        console.log(
                            `Added level role ${levelRole.name} to ${member.user.username}`,
                        );
                        updates.push(`Added ${levelRole}.`);
                    })
                    .catch(() => {
                        console.error(
                            `Failed to add level role ${levelRole.name} from ${member.user.username}`,
                        );
                        errors.push(`Failed to add ${levelRole}.`);
                    });
            }

            for (const role of levelRoles) {
                if (role && role !== levelRole && memberRoles.has(role.id)) {
                    await member.roles
                        .remove(role)
                        .then(() => {
                            console.log(
                                `Removed level role ${role.name} from ${member.user.username}`,
                            );
                            updates.push(`Removed ${role}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to remove level role ${role.name} from ${member.user.username}`,
                            );
                            errors.push(`Failed to remove ${role}.`);
                        });
                }
            }

            if (serverRank) {
                let serverRankRoleToApply;

                for (const contentTeamValue of Object.values(
                    ContentTeamValue,
                )) {
                    if (serverRank === contentTeamValue) {
                        serverRankRoleToApply = contentTeamRole;
                    }
                }

                if (!serverRankRoleToApply) {
                    if (serverRank === 'Moderator') {
                        serverRankRoleToApply = moderatorRole;
                    } else if (
                        serverRank === 'Administrator' ||
                        serverRank === 'Developer' ||
                        serverRank === 'WebDev'
                    ) {
                        serverRankRoleToApply = administratorRole;
                    }
                }

                if (
                    serverRankRoleToApply &&
                    !memberRoles.has(serverRankRoleToApply.id)
                ) {
                    await member.roles
                        .add(serverRankRoleToApply)
                        .then(() => {
                            console.log(
                                `Added server rank role ${serverRankRoleToApply.name} to ${member.user.username}`,
                            );
                            updates.push(`Added ${serverRankRoleToApply}.`);
                        })
                        .catch(() => {
                            console.error(
                                `Failed to add server rank role ${serverRankRoleToApply.name} from ${member.user.username}`,
                            );
                            errors.push(
                                `Failed to add ${serverRankRoleToApply}.`,
                            );
                        });

                    for (const role of serverRankRoles.values()) {
                        if (
                            role &&
                            serverRankRoles.includes(role) &&
                            role !== serverRankRoleToApply &&
                            memberRoles.has(role.id)
                        ) {
                            await member.roles
                                .remove(role)
                                .then(() => {
                                    console.log(
                                        `Removed server rank role ${role.name} from ${member.user.username}`,
                                    );
                                    updates.push(`Removed ${role}.`);
                                })
                                .catch(() => {
                                    console.error(
                                        `Failed to remove server rank role ${role.name} from ${member.user.username}`,
                                    );
                                    errors.push(`Failed to remove ${role}.`);
                                });
                        }
                    }
                } else if (!serverRankRoleToApply) {
                    for (const role of serverRankRoles.values()) {
                        if (
                            role &&
                            serverRankRoles.includes(role) &&
                            memberRoles.has(role.id)
                        ) {
                            await member.roles
                                .remove(role)
                                .then(() => {
                                    console.log(
                                        `Removed server rank role ${role.name} from ${member.user.username}`,
                                    );
                                    updates.push(`Removed ${role}.`);
                                })
                                .catch(() => {
                                    console.error(
                                        `Failed to remove server rank role ${role.name} from ${member.user.username}`,
                                    );
                                    errors.push(`Failed to remove ${role}.`);
                                });
                        }
                    }
                }
            }

            if (unverifiedRole && memberRoles.has(unverifiedRole.id)) {
                await member.roles
                    .remove(unverifiedRole)
                    .then(() => {
                        console.log(
                            `Removed unverified role ${unverifiedRole.name} from ${member.user.username}`,
                        );
                        updates.push(`Removed ${unverifiedRole}.`);
                    })
                    .catch(() => {
                        console.error(
                            `Failed to remove unverified role ${unverifiedRole.name} from ${member.user.username}`,
                        );
                        errors.push(`Failed to remove ${unverifiedRole}.`);
                    });
            } else if (!unverifiedRole) {
                errors.push(
                    'Unverified role is not defined in the config or is invalid.',
                );
            }

            if (verifiedRole && !memberRoles.has(verifiedRole.id)) {
                await member.roles
                    .add(verifiedRole)
                    .then(() => {
                        console.log(
                            `Added verified role ${verifiedRole.name} to ${member.user.username}`,
                        );
                        updates.push(`Added ${verifiedRole}.`);
                    })
                    .catch(() => {
                        console.error(
                            `Failed to add verified role ${verifiedRole.name} to ${member.user.username}`,
                        );
                        errors.push(`Failed to add ${verifiedRole}.`);
                    });
            } else if (!verifiedRole) {
                errors.push(
                    'Verified role is not defined in the config or is invalid.',
                );
            }

            nickname = username;

            if (member.id !== member.guild.ownerId) {
                if (
                    config.addGuildPrefixes &&
                    guildPrefix &&
                    guildUuid !== config.guild
                ) {
                    nickname += ` [${guildPrefix}]`;
                }

                const validGlobalName = member.user.globalName === nickname;
                const validNickname = member.nickname === nickname;

                if (!validGlobalName && !validNickname) {
                    try {
                        await member.setNickname(nickname);
                        updates.push(`Changed nickname to ${nickname}.`);
                    } catch (ex) {
                        console.error(ex);
                        errors.push(
                            `Failed to change ${member}'s nickname to ${nickname}.`,
                        );
                    }
                }
            }
        }

        return { username: nickname, updates: updates, errors: errors };
    } catch (error) {
        console.error(error);
        errors.push('Failed to complete applying roles');
        return { updates: updates, errors: errors };
    }
}

module.exports = applyRoles;
