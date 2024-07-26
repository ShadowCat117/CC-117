const fs = require('fs');
const path = require('path');
const database = require('../database/database');

async function addAlly(interaction, force = false) {
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
        try {
            let config = {};

            // If allies contains one of the choices it can be removed from choices
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);

                const filteredGuilds = guild.guildUuids
                    .map((uuid, index) => ({
                        guildUuid: uuid,
                        guildName: guild.guildNames[index],
                        guildPrefix: guild.guildPrefixes[index],
                    }))
                    .filter(
                        ({ guildUuid }) => !config.allies.includes(guildUuid),
                    );

                if (filteredGuilds.length === 1) {
                    guild.uuid = filteredGuilds[0].guildUuid;
                    guild.name = filteredGuilds[0].guildName;
                    guild.prefix = filteredGuilds[0].guildPrefix;
                }
            }
        } catch (error) {
            console.error(error);
        }

        if (!guild.uuid) {
            return {
                guildUuids: guild.guildUuids,
                guildNames: guild.guildNames,
                guildPrefixes: guild.guildPrefixes,
            };
        }
    }

    if (guild) {
        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (config.allies.includes(guild.uuid)) {
                return { error: `${guild.name} is already an ally.` };
            }

            if (config.guild === guild.uuid) {
                return { error: `You are representing ${guild.name}.` };
            }

            config.allies.push(guild.uuid);

            fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8',
            );

            return { guildName: guild.name };
        } catch (error) {
            console.error(error);
            return { error: 'An error occured whilst adding ally.' };
        }
    } else {
        return { guildName: '' };
    }
}

module.exports = addAlly;
