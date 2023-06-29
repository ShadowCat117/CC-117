const fs = require('fs');
const path = require('path');
const findGuild = require('./find_guild');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');

async function untrackGuild(interaction, force = false) {
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

            const filteredGuildNames = guildName.guildNames.filter(name => config.trackedGuilds.includes(name));

            guildName.guildNames = filteredGuildNames;

            if (filteredGuildNames.length === 0) {
                return new ButtonedMessage('', [], '', [`Not tracking any guilds matching ${nameToSearch}.`]);
            } else if (filteredGuildNames.length === 1) {
                guildName = filteredGuildNames[0];
            } else {
                let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

                for (let i = 0; i < guildName.guildNames.length; i++) {
                    const name = guildName.guildNames[i];

                    textMessage += `\n${i + 1}. ${name}`;
                }

                textMessage += '\nClick button to choose guild.';

                return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.UNTRACK_GUILD, []);
            }
        } catch (error) {
            return new ButtonedMessage('', [], '', ['Unable to untrack guild.']);
        }
    }

    if (guildName) {
        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (!config.trackedGuilds.includes(guildName)) {
                return new ButtonedMessage('', [], '', [`${guildName} is not being tracked.`]);
            }

            config.trackedGuilds = config.trackedGuilds.filter(item => item !== guildName);

            if (config.trackedGuilds.length === 0) {
                config.trackedGuilds.push(null);
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            return new ButtonedMessage('', [], '', [`${guildName} is no longer being tracked.`]);
        } catch (error) {
            return new ButtonedMessage('', [], '', ['Unable to untrack guild.']);
        }
    } else {
        return new ButtonedMessage('', [], '', [`${interaction.options.getString('guild_name')} not found, try using the full exact guild name.`]);
    }
}

module.exports = untrackGuild;
