const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_warroles')
        .setDescription('Update war role configurations')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The role option to update')
                .setRequired(true)
                .addChoices({
                    name: 'War Role',
                    value: 'warRole',
                }, {
                    name: 'Tank Role',
                    value: 'tankRole',
                }, {
                    name: 'Healer Role',
                    value: 'healerRole',
                }, {
                    name: 'Damage Role',
                    value: 'damageRole',
                }, {
                    name: 'Solo Role',
                    value: 'soloRole',
                }, {
                    name: 'Eco Role',
                    value: 'ecoRole',
                }, {
                    name: 'War Ping Role',
                    value: 'warPingRole',
                }))
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('The role to set for the configuration option')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting ${option} to ${role}`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);
        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
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
            const memberOfRole = config.memberOfRole;

            // If the member of role is used, it is required
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // Can only be ran by the owner or an admin
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setDescription('Error changing config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        try {
            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(roleSearch => roleSearch.managed && roleSearch.members.has(interaction.client.user.id));

            let message;

            // If the bot does not have permission to give the role, let the user know
            if (botRole) {
                if (role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option ${option} updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to or remove that role from members, please change this so I can manage the role correctly!`;
                } else {
                    message = `Configuration option ${option} updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option ${option} updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

            // Save the option to the config
            switch (option) {
                case 'warRole':
                case 'tankRole':
                case 'healerRole':
                case 'damageRole':
                case 'soloRole':
                case 'ecoRole':
                case 'warPingRole':
                    config[option] = role.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            responseEmbed
                .setDescription(`${message}`)
                .setColor(0x00ffff);
        } catch (error) {
            console.error(`Error updating configuration option: ${error}`);
            responseEmbed
                .setDescription('An error occured whilst updating config file.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
