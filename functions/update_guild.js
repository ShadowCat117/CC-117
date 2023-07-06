const fs = require('fs');
const path = require('path');
const findGuild = require('./find_guild');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');

async function updateGuild(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId;
    }

    let guildName = await findGuild(nameToSearch, force);

    const filePath = path.join(__dirname, '..', 'updateGuilds.json');

    if (guildName && guildName.message === 'Multiple possibilities found') {
        try {
            let updateGuildFile = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                updateGuildFile = JSON.parse(fileData);
            }

            const filteredGuildNames = guildName.guildNames.filter(name => !updateGuildFile.guilds.includes(name));

            guildName.guildNames = filteredGuildNames;

            if (guildName.guildNames.length === 0) {
                return new ButtonedMessage('', [], '', [`${guildName} is already queued to be updated.`]);
            } else if (guildName.guildNames.length === 1) {
                guildName = filteredGuildNames[0];
            } else {
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

    if (guildName) {
        try {
            let updateGuildFile = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                updateGuildFile = JSON.parse(fileData);
            }

            updateGuildFile.guilds = updateGuildFile.guilds.filter(item => item !== null);

            if (updateGuildFile.guilds.includes(guildName)) {
                return new ButtonedMessage('', [], '', [`${guildName} is already queued to be updated.`]);
            }

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
