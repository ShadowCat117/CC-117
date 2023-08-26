const {
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const applyRoles = require('../../functions/apply_roles');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Unverifies the chosen user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to unverify.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        try {
            let config = {};

            const guildId = interaction.guild.id;
            const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply({
                    content: 'You do not have the required permissions to run this command.',
                    ephemeral: true,
                });
                return;
            }
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error changing config.');
            return;
        }

        const user = interaction.guild.members.cache.get(interaction.options.getUser('user').id);

        const response = await applyRoles(interaction.guild, null, user);

        if (response >= 0) {
            await interaction.editReply(`${user} was unverified.`);
        } else {
            await interaction.editReply(`Failed to unverify ${user}.`);
        }
    },
};

