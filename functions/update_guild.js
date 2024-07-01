const fs = require('fs');
const path = require('path');
const findGuild = require('../database/database');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');

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
                return new ButtonedMessage('', [], '', [`${guildName} is already queued to be updated.`]);
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

                return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.UPDATE_GUILD, []);
            }
        } catch (error) {
            return new ButtonedMessage('', [], '', ['Unable to update guild.']);
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
                return new ButtonedMessage('', [], '', [`${guildName} is already queued to be updated.`]);
            }

            // Add new priority guild to file
            updateGuildFile.guilds.push(guildName);

            fs.writeFileSync(filePath, JSON.stringify(updateGuildFile, null, 2), 'utf-8');

            return new ButtonedMessage('', [], '', [`${guildName} will be updated soon.`]);
        } catch (error) {
            return new ButtonedMessage('', [], '', ['Unable to update guild.']);
        }
    } else {
        return new ButtonedMessage('', [], '', [`${interaction.options.getString('guild_name')} not found, try using the full exact guild name.`]);
    }
}

module.exports = updateGuild;
