const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const ButtonedMessage = require('../../message_type/ButtonedMessage');
const MessageManager = require('../../message_type/MessageManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allies')
        .setDescription('View the guilds you have set as allies.'),
    ephemeral: true,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;
            const memberRoles = interaction.member.roles.cache;

            const guildName = config.guildName;

            // Need a set guild to run this command
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If enabled you need the member of role
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // If no allies
            if (config.allies.includes(null)) {
                await interaction.editReply('You have not set any allies.');
                return;
            }

            const header = `\`\`\`Allies of ${config.guildName}:\n`;

            const pages = [];
            let page = header;
            let counter = 0;

            // Loop through allies
            for (const ally of config.allies) {
                if (counter < 30) {
                    // Display 30 at a time
                    page += ally + '\n';

                    counter++;
                } else if (counter === 30) {
                    // Once 30 have been displayed, finish page
                    page += '```';

                    counter = 0;

                    pages.push(page);

                    // Start new page
                    page = header;

                    page += ally + '\n';
                }
            }

            // If previous page did not reach 30 guilds, finish it
            if (counter <= 30) {
                page += '```';

                pages.push(page);
            }

            // Create ButtonedMessage response
            const alliesMessage = new ButtonedMessage('', [], '', pages);

            if (pages.length > 1) {
                // Add next/previous buttons if more than 1 page used
                const previousPage = new ButtonBuilder()
                    .setCustomId('previousPage')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⬅️');

                const nextPage = new ButtonBuilder()
                    .setCustomId('nextPage')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️');

                const row = new ActionRowBuilder().addComponents(previousPage, nextPage);

                const editedReply = await interaction.editReply({
                    content: alliesMessage.pages[0],
                    components: [row],
                });

                alliesMessage.setMessage(editedReply);

                MessageManager.addMessage(alliesMessage);
            } else {
                // Show response with 1 page
                await interaction.editReply({
                    content: alliesMessage.pages[0],
                    components: [],
                });
            }
        } catch (error) {
            await interaction.editReply('Unable to show allies.');
        }
    },
};
