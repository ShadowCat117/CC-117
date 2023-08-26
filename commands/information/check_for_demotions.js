const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const MessageManager = require('../../message_type/MessageManager');
const checkForDemotions = require('../../functions/check_for_demotions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkfordemotions')
        .setDescription('Check your guild members to see who should be a lower rank.'),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;

        const response = await checkForDemotions(guildId);

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
                content: 'No players found in your guild that need demoting.',
                components: [],
            });
        } else {
            await interaction.editReply(response.pages[0]);
        }
    },
};
