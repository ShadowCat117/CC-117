const {
    SlashCommandBuilder,
} = require('discord.js');
const applyRoles = require('../../functions/apply_roles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Removes all roles associated with your verified username.'),
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        const response = await applyRoles(interaction.guild, null, interaction.member);

        if (response >= 0) {
            await interaction.editReply('You have been unverified. Please run /verify when you want to be verified again.');
        } else {
            await interaction.editReply('An error occured whilst trying to unverify you.');
        }
    },
};

