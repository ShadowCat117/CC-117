const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const MessageManager = require('../../message_type/MessageManager');
const checkForPromotions = require('../../functions/check_for_promotions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkforpromotions')
        .setDescription('Check your guild members to see who should be a higher rank.'),

    async execute(interaction) {
        await interaction.deferReply();

        const response = await checkForPromotions(interaction);

        if (response.pages.length > 1) {
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
            interaction.editReply({
                content: 'No players found in your guild that need promoting.',
                components: [],
            });
        } else {
            await interaction.editReply(response.pages[0]);
        }
    },
};
