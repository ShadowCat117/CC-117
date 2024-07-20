const fs = require('fs');
const path = require('path');
const database = require('../database/database');

async function untrackGuild(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId.split(':')[1];
    }

    const guild = await database.findGuild(nameToSearch, force);

    const guildId = interaction.guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    if (guild && guild.message === 'Multiple possibilities found') {
        return {
            guildUuids: guild.guildUuids,
            guildNames: guild.guildNames,
            guildPrefixes: guild.guildPrefixes,
        };
    }

    if (guild) {
        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (!config.trackedGuilds.includes(guild.uuid)) {
                return ({ error: `${guild.name} is not being tracked.` });
            }

            config.trackedGuilds = config.trackedGuilds.filter(item => item !== guild.uuid);

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            return ({ guildName: guild.name });
        } catch (error) {
            console.error(error);
            return ({ error: 'An error occured whilst untracking guild.' });
        }
    } else {
        return ({ guildName: '' });
    }
}

module.exports = untrackGuild;
