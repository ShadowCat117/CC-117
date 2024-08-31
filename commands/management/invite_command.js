const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Sends the CC-117 invite link.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading invite response.')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const responseEmbed = new EmbedBuilder()
            .setTitle('CC-117 Invite')
            .setURL(
                'https://discord.com/oauth2/authorize?client_id=1061055822425247854',
            )
            .setDescription(
                'Click the title above to invite CC-117 to your Discord server.',
            )
            .setColor(0x00ffff);

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
