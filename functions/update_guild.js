const fs = require('fs');
const path = require('path');
const findGuild = require('../database/database');

async function updateGuild(interaction, force = false) {
    let nameToSearch;

    // Get the guild name from command or button
    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId;
    }

    // Search for the guild
    let guildName = await findGuild(nameToSearch, force);

    const filePath = path.join(__dirname, '..', 'updateGuilds.json');

    // If multiple guilds found, handle it
    if (guildName && guildName.message === 'Multiple possibilities found') {
        try {
            let updateGuildFile = {};

            // Get the priority guilds file
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                updateGuildFile = JSON.parse(fileData);
            }

            // Filter the found guilds to only include those not in the priority file
            const filteredGuildNames = guildName.guildNames.filter(name => !updateGuildFile.guilds.includes(name));

            guildName.guildNames = filteredGuildNames;

            if (guildName.guildNames.length === 0) {
                // No guilds after filtering, it is already in the priority file
            } else if (guildName.guildNames.length === 1) {
                // Only 1 guild remaining, set it as the guild
                guildName = filteredGuildNames[0];
            } else {
                // Still multiple options, create a choice message
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

    // Found one valid guild
    if (guildName) {
        try {
            let updateGuildFile = {};

            // Get priority guilds file
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                updateGuildFile = JSON.parse(fileData);
            }

            // Filter out null guilds
            updateGuildFile.guilds = updateGuildFile.guilds.filter(item => item !== null);

            // If guild is already present, don't add it
            if (updateGuildFile.guilds.includes(guildName)) {
            }

            // Add new priority guild to file
            updateGuildFile.guilds.push(guildName);

            fs.writeFileSync(filePath, JSON.stringify(updateGuildFile, null, 2), 'utf-8');
        } catch (error) {
        }
    } else {
    }
}

module.exports = updateGuild;
