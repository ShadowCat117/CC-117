const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
const applyRoles = require('../../functions/apply_roles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Removes all roles associated with your verified username and resets your nickname.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Removing roles and resetting nickname.')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });
        // Call applyRoles with null to remove all roles and have nickname reset
        const response = await applyRoles(interaction.guild, interaction.member, null);

        const responseEmbed = new EmbedBuilder();

        responseEmbed
            .setTitle('You have been unverified')
            .setColor(0x00ffff);

        let appliedChanges = 'Applied changes: \n';

        for (const update of response.updates) {
            appliedChanges += `${update}\n`;
        }

        for (const error of response.errors) {
            appliedChanges += `${error}\n`;
        }

        appliedChanges += `\nIf your username (${interaction.member.user.username}) still matches a known Wynncraft username, your roles may be reapplied when a user runs /updateroles.`;

        responseEmbed.setDescription(appliedChanges);

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};

