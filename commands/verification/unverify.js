const {
    SlashCommandBuilder,
} = require('discord.js');
const applyRoles = require('../../functions/apply_roles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Removes all roles associated with your verified username.'),
    ephemeral: true,
    async execute(interaction) {
        // Call applyRoles with null to remove all roles and have nickname reset
        const response = await applyRoles(interaction.guild, null, interaction.member);

        if (response >= 0) {
            // Successfully unverified
            await interaction.editReply('You have been unverified. Please run /verify when you want to be verified again.');
        } else {
            // Something went wrong
            await interaction.editReply('An error occured whilst trying to unverify you.');
        }
    },
};

