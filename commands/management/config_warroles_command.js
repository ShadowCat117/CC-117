const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configUtils = require('../../functions/config_utils');

const warRoles = [
    'warRole',
    'tankRole',
    'healerRole',
    'damageRole',
    'soloRole',
    'ecoRole',
    'warPingRole',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_warroles')
        .setDescription('Update war role configurations')
        .addStringOption((option) =>
            option
                .setName('option')
                .setDescription('The role option to update')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'War Role',
                        value: 'warRole',
                    },
                    {
                        name: 'Tank Role',
                        value: 'tankRole',
                    },
                    {
                        name: 'Healer Role',
                        value: 'healerRole',
                    },
                    {
                        name: 'Damage Role',
                        value: 'damageRole',
                    },
                    {
                        name: 'Solo Role',
                        value: 'soloRole',
                    },
                    {
                        name: 'Eco Role',
                        value: 'ecoRole',
                    },
                    {
                        name: 'War Ping Role',
                        value: 'warPingRole',
                    },
                ),
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription(
                    'The role to set for the configuration option. Do not select anything to remove that role',
                ),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting ${option} to ${role}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );
        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                responseEmbed
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                responseEmbed
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to change config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        try {
            for (const roleName of warRoles) {
                const roleToCheck = interaction.guild.roles.cache.get(
                    config[`${roleName}`],
                );

                if (roleToCheck === role && roleName !== option) {
                    responseEmbed
                        .setTitle(`Invalid role for ${option}`)
                        .setDescription(
                            `${roleName} has already been set to ${role}.`,
                        )
                        .setColor(0xff0000);
                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                }
            }

            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(
                (roleSearch) =>
                    roleSearch.managed &&
                    roleSearch.members.has(interaction.client.user.id),
            );

            let message;

            // If the bot does not have permission to give the role, let the user know
            if (botRole) {
                if (role && role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option ${option} updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to or remove that role from members, please change this so I can manage the role correctly!`;
                } else if (!role) {
                    message = `Removed ${option}.`;
                } else {
                    message = `Configuration option ${option} updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option ${option} updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

            const value = !role ? null : role.id;

            switch (option) {
                case 'warRole':
                case 'tankRole':
                case 'healerRole':
                case 'damageRole':
                case 'soloRole':
                case 'ecoRole':
                case 'warPingRole':
                    config[option] = value;
                    break;
            }

            fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8',
            );

            responseEmbed.setDescription(`${message}`).setColor(0x00ffff);
        } catch (error) {
            console.error(`Error updating configuration option: ${error}`);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to update config file.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
