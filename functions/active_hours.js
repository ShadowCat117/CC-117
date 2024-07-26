const database = require('../database/database');
const TimezoneValue = require('../values/TimezoneValue');

async function activeHours(
    interaction,
    force = false,
    timezoneOffset = 0,
    sortByActivity = true,
) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else if (interaction.values) {
        nameToSearch = interaction.values[0].split(':')[1];
    } else {
        nameToSearch = interaction.customId.split(':')[1];
    }

    const guild = await database.findGuild(nameToSearch, force);

    if (guild && guild.message === 'Multiple possibilities found') {
        return {
            guildUuids: guild.guildUuids,
            guildNames: guild.guildNames,
            guildPrefixes: guild.guildPrefixes,
        };
    }

    let timezone;

    for (const [key, val] of Object.entries(TimezoneValue)) {
        if (val === parseInt(timezoneOffset)) {
            timezone = key.replace('_', '/');
        } else if (val === parseFloat(timezoneOffset)) {
            timezone = key;
        }
    }

    if (guild) {
        const guildActivity = await database.getActiveHours(
            guild.uuid,
            timezoneOffset,
            sortByActivity,
        );

        return {
            guildUuid: guild.uuid,
            guildName: guild.name,
            guildPrefix: guild.prefix,
            activity: guildActivity,
            timezone: timezone,
        };
    } else {
        return {
            guildUuid: guild.uuid,
            guildName: guild.name,
            guildPrefix: guild.prefix,
            activity: [],
            timezone: timezone,
        };
    }
}

module.exports = activeHours;
