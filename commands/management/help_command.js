const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sends a link to the bot manual.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading help response.')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const responseEmbed = new EmbedBuilder()
            .setTitle('CC-117 Help')
            .setURL('https://github.com/ShadowCat117/CC-117/wiki')
            .setDescription(
                "Visit the CC-117 wiki page via the above link for any assistance with the bot.",
            )
            .setColor(0x00ffff);

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
