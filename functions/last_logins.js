const database = require('../database/database');
const configUtils = require('./config_utils');
const fs = require('fs');
const path = require('path');

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
        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            'configs',
            `${guildId}.json`,
        );
        let exemptUuids = [];

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                const config = JSON.parse(fileData);

                const inactivityExceptions = config['inactivityExceptions'];
                exemptUuids = Object.keys(inactivityExceptions);
            } else {
                await configUtils.createConfig(interaction.client, guildId);
            }
        } catch (error) {
            console.error(error);
        }

        const playerLastLogins = await database.getLastLogins(
            guild.uuid,
            exemptUuids,
        );

        return {
            guildName: guild.name,
            guildPrefix: guild.prefix,
            playerLastLogins: playerLastLogins,
        };
    } else {
        return { guildName: '', guildPrefix: '', playerLastLogins: [] };
    }
}

module.exports = lastLogins;
