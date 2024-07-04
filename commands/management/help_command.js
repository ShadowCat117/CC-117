const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sends a link to the temporary manual.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading help response')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const responseEmbed = new EmbedBuilder();

        responseEmbed
            .setTitle('CC-117 Help')
            .setDescription('Click [here](https://docs.google.com/document/d/1anSFPfBuMPzKJ7JwejBnpB7KMsiw-Lrk50LMfNRJt6Q/edit?usp=sharing) to access the temporary manual.')
            .setColor(0x00ffff);

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
