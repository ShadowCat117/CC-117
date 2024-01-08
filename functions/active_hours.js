const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const GuildActiveHours = require('../message_objects/GuildActiveHours');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const TimezoneValue = require('../values/TimezoneValue');
const db = new sqlite3.Database('database/database.db');

function getAsync(query, params) {
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

async function activeHours(interaction, force = false, timezoneOffset = 0) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else if (interaction.customId && interaction.customId !== 'timezone') {
        nameToSearch = interaction.customId;
    } else {
        const content = interaction.message.content;
        const regex = /```Active hours for (.*?) \(/;
        const match = content.match(regex);
        nameToSearch = match ? match[1] : null;
    }

    const guildName = await findGuild(nameToSearch, force);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

        for (let i = 0; i < guildName.guildNames.length; i++) {
            const name = guildName.guildNames[i];

            textMessage += `\n${i + 1}. ${name}`;
        }

        textMessage += '\nClick button to choose guild.';

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.ACTIVE_HOURS, []);
    }

    if (guildName) {
        return new Promise((resolve, reject) => {
            const fetchData = async () => {
                try {
                    const guildActiveHours = [];

                    for (let i = 0; i < 24; i++) {
                        const currentHour = i.toString().padStart(2, '0');
                        let hourTotalOnline = 0;
                        let hourTotalCaptains = 0;
                        let availableAverages = 0;

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
                            const captainsKey = 'captains' + currentTime;

                            const query = 'SELECT ' + averageKey + ', ' + captainsKey + ' FROM guilds WHERE name = ?';
                            const params = [guildName];

                            const result = await getAsync(query, params);

                            if (result[averageKey] !== null && result[averageKey] !== -1) {
                                hourTotalOnline += result[averageKey];
                                hourTotalCaptains += result[captainsKey];
                                availableAverages++;
                            }
                        }

                        if (availableAverages > 0) {
                            guildActiveHours.push(new GuildActiveHours(currentHour, hourTotalOnline / availableAverages, hourTotalCaptains / availableAverages, timezoneOffset));
                        }
                    }

                    if (guildActiveHours.length === 0) {
                        resolve(new ButtonedMessage('', [], '', ['No data']));
                    }

                    let timezone;

                    for (const [key, val] of Object.entries(TimezoneValue)) {
                        if (val === parseInt(timezoneOffset)) {
                            timezone = key.replace('_', '/');
                        } else if (val === parseFloat(timezoneOffset)) {
                            timezone = key;
                        }
                    }

                    if (!timezone) {
                        timezone = '???';
                    }

                    let message = `\`\`\`Active hours for ${guildName} (${timezone}):\n\nTime    Avg. Online    Avg. Captain+`;

                    guildActiveHours.sort((a, b) => a.compareTo(b));

                    for (const hourActivity of guildActiveHours) {
                        message += `\n${hourActivity.toString()}`;
                    }

                    message += '```';

                    const response = new ButtonedMessage('', [], '', [message]);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };

            fetchData();
        });
    } else {
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

module.exports = activeHours;
