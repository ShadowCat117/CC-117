const fs = require('fs');
const path = require('path');
const findGuild = require('../database/database');

async function removeAlly(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId;
    }

    let guildName = await findGuild(nameToSearch, force);

    const guildId = interaction.guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const filteredGuildNames = guildName.guildNames.filter(name => config.allies.includes(name));

            guildName.guildNames = filteredGuildNames;

            if (filteredGuildNames.length === 0) {
            } else if (filteredGuildNames.length === 1) {
                guildName = filteredGuildNames[0];
            } else {
                let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

                for (let i = 0; i < guildName.guildNames.length; i++) {
                    const name = guildName.guildNames[i];

                    textMessage += `\n${i + 1}. ${name}`;
                }

                textMessage += '\nClick button to choose guild.';
            }
        } catch (error) {
        }
    }

    if (guildName) {
        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (!config.allies.includes(guildName)) {
            }

            config.allies = config.allies.filter(item => item !== guildName);

            if (config.allies.length === 0) {
                config.allies.push(null);
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

        } catch (error) {
        }
    } else {
    }
}

module.exports = removeAlly;
