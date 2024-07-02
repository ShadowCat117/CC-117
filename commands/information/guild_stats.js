const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const guildStats = require('../../functions/guild_stats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guildstats')
        .setDescription('View the stats for a specific guild.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to see stats for.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        // Call guildStats
        const response = await guildStats(interaction);

        if (response.componentIds.length > 0) {
            // Given input matches multiple guilds, present options
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
        } else if (response.pages.length > 1) {
            // Handle multiple pages
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
        } else if (response.pages[0] === '```\n```') {
            // No players in the guild
            interaction.editReply({
                content: `No players found in the guild ${interaction.options.getString('guild_name')}`,
                components: [],
            });
        } else {
            // Only 1 page of stats
            await interaction.editReply(response.pages[0]);
        }
    },
};
