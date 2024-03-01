const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const MessageManager = require('../../message_type/MessageManager');
const online = require('../../functions/online');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('online')
        .setDescription('View who is currently online in a guild.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to see who\'s online for.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        // Call online
        const response = await online(interaction);

        if (response.componentIds.length > 0) {
            // Handle input matching multiple guilds
            const row = new ActionRowBuilder();

            for (let i = 0; i < response.componentIds.length; i++) {
                const button = new ButtonBuilder()
                    .setCustomId(response.componentIds[i])
                    .setStyle(ButtonStyle.Primary)
                    .setLabel((i + 1).toString());
                row.addComponents(button);
            }

            const editedReply = await interaction.editReply({
                content: response.text,
                components: [row],
            });

            response.setMessage(editedReply);

            MessageManager.addMessage(response);
        } else if (response.pages.length > 1) {
            // Response gave multiple pages, add navigation buttons
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
                content: response.pages[0],
                components: [row],
            });

            response.setMessage(editedReply);

            MessageManager.addMessage(response);
        } else if (response.pages[0] === '```\n```') {
            // No players in the guild
            interaction.editReply({
                content: `No players online in the guild ${interaction.options.getString('guild_name')}`,
                components: [],
            });
        } else {
            // 1 page of results
            await interaction.editReply(response.pages[0]);
        }
    },
};
