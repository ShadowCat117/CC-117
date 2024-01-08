const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const PlayerLastLogin = require('../message_objects/PlayerLastLogin');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const GuildMemberSlots = require('../values/GuildMemberSlots');
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

async function lastLogins(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId;
    }

    const guildName = await findGuild(nameToSearch, force);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

        for (let i = 0; i < guildName.guildNames.length; i++) {
            const name = guildName.guildNames[i];

            textMessage += `\n${i + 1}. ${name}`;
        }

        textMessage += '\nClick button to choose guild.';

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.LAST_LOGINS, []);
    }

    if (guildName) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (config.guildName === guildName) {
                const chiefUpperThreshold = config.chiefUpperThreshold || 730;
                const chiefLowerThreshold = config.chiefLowerThreshold || 365;
                const strategistUpperThreshold = config.strategistUpperThreshold || 50;
                const strategistLowerThreshold = config.strategistLowerThreshold || 30;
                const captainUpperThreshold = config.captainUpperThreshold || 32;
                const captainLowerThreshold = config.captainLowerThreshold || 16;
                const recruiterUpperThreshold = config.recruiterUpperThreshold || 20;
                const recruiterLowerThreshold = config.recruiterLowerThreshold || 10;
                const recruitUpperThreshold = config.recruitUpperThreshold || 20;
                const recruitLowerThreshold = config.recruitLowerThreshold || 10;
                const levelRequirement = config.levelRequirement || 100;
                const extraTimeMultiplier = config.extraTimeMultiplier || 1;
                const averageRequirement = config.averageRequirement || 5;
                const newPlayerMinimumTime = config.newPlayerMinimumTime || 14;
                const newPlayerThreshold = config.newPlayerThreshold || 5;
                const memberThreshold = config.memberThreshold || 0.9;
                const inactivityExceptions = config.inactivityExceptions;

                const rows = await allAsync('SELECT username, guildRank, lastJoin, isOnline, highestClassLevel, guildJoinDate FROM players WHERE guildName = ?', [guildName]);
                const guild = await getAsync('SELECT level FROM guilds WHERE name = ?', [guildName]);

                let averageOnline = 0;
                let divideBy = 0;

                for (let i = 0; i < 24; i++) {
                    const currentHour = i.toString().padStart(2, '0');

                    for (let j = 0; j < 4; j++) {
                        let currentMinute;

                        if (j === 0) {
                            currentMinute = '00';
                        } else if (j === 1) {
                            currentMinute = '15';
                        } else if (j === 2) {
                            currentMinute = '30';
                        } else if (j === 3) {
                            currentMinute = '45';
                        }

                        const currentTime = `${currentHour}${currentMinute}`;

                        const averageKey = 'average' + currentTime;

                        const result = await getAsync('SELECT ' + averageKey + ' FROM guilds WHERE name = ?', [guildName]);

                        if (result[averageKey] !== null && result[averageKey] !== -1) {
                            averageOnline += result[averageKey];
                            divideBy++;
                        }
                    }
                }

                if (divideBy !== 0) {
                    averageOnline /= divideBy;
                }

                const memberSlots = calculateMemberSlots(guild.level);

                let useUpperRequirement = true;

                if (averageOnline < averageRequirement || (rows.length >= memberThreshold * memberSlots)) {
                    useUpperRequirement = false;
                }

                const playerLastLogins = rows.map(row => {
                    const {
                        username,
                        guildRank,
                        lastJoin,
                        isOnline,
                        highestClassLevel,
                        guildJoinDate,
                    } = row;

                    let inactiveThreshold;

                    switch (guildRank) {
                        case 'CHIEF':
                            inactiveThreshold = useUpperRequirement ? chiefUpperThreshold : chiefLowerThreshold;

                            if (highestClassLevel >= levelRequirement) {
                                inactiveThreshold *= extraTimeMultiplier;
                            }
                            
                            break;
                        case 'STRATEGIST':
                            inactiveThreshold = useUpperRequirement ? strategistUpperThreshold : strategistLowerThreshold;

                            if (highestClassLevel >= levelRequirement) {
                                inactiveThreshold *= extraTimeMultiplier;
                            }

                            break;
                        case 'CAPTAIN':
                            inactiveThreshold = useUpperRequirement ? captainUpperThreshold : captainLowerThreshold;

                            if (highestClassLevel >= levelRequirement) {
                                inactiveThreshold *= extraTimeMultiplier;
                            }

                            break;
                        case 'RECRUITER':
                            inactiveThreshold = useUpperRequirement ? recruiterUpperThreshold : recruiterLowerThreshold;

                            if (highestClassLevel >= levelRequirement) {
                                inactiveThreshold *= extraTimeMultiplier;
                            }

                            break;
                        case 'RECRUIT':
                            inactiveThreshold = useUpperRequirement ? recruitUpperThreshold : recruitLowerThreshold;

                            if (highestClassLevel >= levelRequirement) {
                                inactiveThreshold *= extraTimeMultiplier;
                            }

                            break;
                        default:
                            inactiveThreshold = Number.MAX_SAFE_INTEGER;
                            break;
                    }

                    const currentDate = new Date();
                    const lastJoinDate = new Date(lastJoin);
                    const lastJoinTimeDiff = currentDate.getTime() - lastJoinDate.getTime();
                    const daysSinceLastLogin = Math.floor(lastJoinTimeDiff / (1000 * 60 * 60 * 24));
                    const guildJoin = new Date(guildJoinDate);
                    const guildJoinTimeDiff = currentDate.getTime() - guildJoin.getTime();
                    const daysSinceGuildJoin = Math.floor(guildJoinTimeDiff / (1000 * 60 * 60 * 24));

                    if (daysSinceGuildJoin < newPlayerMinimumTime) {
                        inactiveThreshold = newPlayerThreshold;
                    }

                    if (inactivityExceptions && inactivityExceptions[username] !== undefined) {
                        inactiveThreshold = inactivityExceptions[username];
                    }

                    return new PlayerLastLogin(username, guildRank, highestClassLevel, daysSinceLastLogin, isOnline, true, inactiveThreshold);
                });

                playerLastLogins.sort((a, b) => a.compareTo(b));

                const pages = [];
                let lastLoginsPage = '```diff\n';
                let counter = 0;

                playerLastLogins.forEach((player) => {
                    if (counter === 30) {
                        lastLoginsPage += '```';
                        pages.push(lastLoginsPage);
                        lastLoginsPage = '```diff\n' + player.toString();
                        counter = 1;
                    } else {
                        lastLoginsPage += player.toString();
                        counter++;
                    }
                });

                if (counter <= 30) {
                    lastLoginsPage += '```';
                    pages.push(lastLoginsPage);
                }

                return new ButtonedMessage('', [], '', pages);
            } else {
                const rows = await allAsync('SELECT username, guildRank, lastJoin, isOnline FROM players WHERE guildName = ?', [guildName]);
                
                const playerLastLogins = rows.map(row => {
                    const {
                        username,
                        guildRank,
                        lastJoin,
                        isOnline,
                    } = row;

                    const currentDate = new Date();
                    const lastJoinDate = new Date(lastJoin);
                    const timeDiff = currentDate.getTime() - lastJoinDate.getTime();
                    const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                    return new PlayerLastLogin(username, guildRank, 0, daysSinceLastLogin, isOnline, false, 0);
                });

                playerLastLogins.sort((a, b) => a.compareTo(b));

                const pages = [];
                let lastLoginsPage = '```\n';
                let counter = 0;

                playerLastLogins.forEach((player) => {
                    if (counter === 30) {
                        lastLoginsPage += '```';
                        pages.push(lastLoginsPage);
                        lastLoginsPage = '```\n' + player.toString();
                        counter = 1;
                    } else {
                        lastLoginsPage += player.toString();
                        counter++;
                    }
                });

                if (counter <= 30) {
                    lastLoginsPage += '```';
                    pages.push(lastLoginsPage);
                }

                return new ButtonedMessage('', [], '', pages);
            }
        } catch (error) {
            return new ButtonedMessage('', [], '', [`Error checking last login stats for ${guildName}.`]);
        }
    } else {
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

function calculateMemberSlots(level) {
    let closestLevel = null;
    let closestDifference = Infinity;

    for (const key in GuildMemberSlots) {
        if (Object.hasOwnProperty.call(GuildMemberSlots, key)) {
            const difference = level - key;

            if (difference >= 0 && difference < closestDifference) {
                closestDifference = difference;
                closestLevel = key;
            }
        }
    }

    return closestLevel ? GuildMemberSlots[closestLevel] : null;
}

module.exports = lastLogins;
