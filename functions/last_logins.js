const database = require('../database/database');

async function lastLogins(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
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

    // If a guild found, use that uuid to call the database for the info. We can't use the API for this as the guild route
    // does not contain last login info so we'd have to call the player route for all guild members which will take too long.
    if (guild) {
        const playerLastLogins = await database.getLastLogins(guild.uuid);

        return ({ guildName: guild.name, guildPrefix: guild.prefix, playerLastLogins: playerLastLogins });
    } else {
        return ({ guildName: '', guildPrefix: '', playerLastLogins: [] });
    }
}

module.exports = lastLogins;
