const sqlite3 = require('sqlite3').verbose();
const findGuild = require('../database/database');
const GuildActiveHours = require('../message_objects/GuildActiveHours');
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

async function activeHours(interaction, force = false, timezoneOffset = 0, sortByActivity = true) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else if (interaction.customId && interaction.customId !== 'timezone' && interaction.customId !== 'activityOrder' && interaction.customId !== 'timeOrder') {
        nameToSearch = interaction.customId;
    } else {
        const content = interaction.message.content;
        const regex = /```Active hours for (.*?) \(/;
        const match = content.match(regex);
        nameToSearch = match ? match[1] : null;
    }

    if (interaction.customId && interaction.customId === 'activityOrder') {
        sortByActivity = true;
    } else if (interaction.customId && interaction.customId === 'timeOrder') {
        sortByActivity = false;
    }

    const guildName = await findGuild(nameToSearch, force);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

        for (let i = 0; i < guildName.guildNames.length; i++) {
            const name = guildName.guildNames[i];

            textMessage += `\n${i + 1}. ${name}`;
        }

        textMessage += '\nClick button to choose guild.';
    }

    if (guildName) {
        return new Promise((resolve, reject) => {
            const fetchData = async () => {
                try {
                    const guildActiveHours = [];

                    for (let i = 0; i < 24; i++) {
                        const currentHour = i.toString().padStart(2, '0');
                        const averageKey = 'average' + currentHour;
                        const captainsKey = 'captains' + currentHour;

                        const query = 'SELECT ' + averageKey + ', ' + captainsKey + ' FROM guilds WHERE name = ?';
                        const params = [guildName];

                        const result = await getAsync(query, params);

                        if (result[averageKey] !== null && result[averageKey] !== -1) {
                            guildActiveHours.push(new GuildActiveHours(currentHour, result[averageKey], result[captainsKey], timezoneOffset));
                        }
                    }

                    if (guildActiveHours.length === 0) {
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

                    if (sortByActivity) {
                        guildActiveHours.sort((a, b) => a.compareToActivity(b));
                    } else {
                        guildActiveHours.sort((a, b) => a.compareToTime(b));
                    }

                    for (const hourActivity of guildActiveHours) {
                        message += `\n${hourActivity.toString()}`;
                    }

                    message += '```';

                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };

            fetchData();
        });
    } else {
    }
}

module.exports = activeHours;
