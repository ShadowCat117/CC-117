const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_roles')
        .setDescription('Update role configurations')
        .addStringOption((option) =>
            option
                .setName('option')
                .setDescription('The role option to update')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Admin Role',
                        value: 'adminRole',
                    },
                    {
                        name: 'Owner Role',
                        value: 'ownerRole',
                    },
                    {
                        name: 'Chief Role',
                        value: 'chiefRole',
                    },
                    {
                        name: 'Strategist Role',
                        value: 'strategistRole',
                    },
                    {
                        name: 'Captain Role',
                        value: 'captainRole',
                    },
                    {
                        name: 'Recruiter Role',
                        value: 'recruiterRole',
                    },
                    {
                        name: 'Recruit Role',
                        value: 'recruitRole',
                    },
                    {
                        name: 'Ally Owner Role',
                        value: 'allyOwnerRole',
                    },
                    {
                        name: 'Ally Role',
                        value: 'allyRole',
                    },
                    {
                        name: 'Champion Role',
                        value: 'championRole',
                    },
                    {
                        name: 'Hero Role',
                        value: 'heroRole',
                    },
                    {
                        name: 'VIP+ Role',
                        value: 'vipPlusRole',
                    },
                    {
                        name: 'VIP Role',
                        value: 'vipRole',
                    },
                    {
                        name: 'Veteran Role',
                        value: 'veteranRole',
                    },
                    {
                        name: 'Verified Role',
                        value: 'verifiedRole',
                    },
                    {
                        name: 'Unverified Role',
                        value: 'unverifiedRole',
                    },
                    {
                        name: 'Member of Guild Role',
                        value: 'memberOfRole',
                    },
                    {
                        name: 'Administrator Role',
                        value: 'administratorRole',
                    },
                    {
                        name: 'Moderator Role',
                        value: 'moderatorRole',
                    },
                    {
                        name: 'Content Team Role',
                        value: 'contentTeamRole',
                    },
                    {
                        name: 'Giveaway Role',
                        value: 'giveawayRole',
                    },
                    {
                        name: 'Events Role',
                        value: 'eventsRole',
                    },
                ),
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to set for the configuration option')
                .setRequired(true),
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
                await createConfig(interaction.client, guildId);

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
            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(
                (roleSearch) =>
                    roleSearch.managed &&
                    roleSearch.members.has(interaction.client.user.id),
            );

            let message;

            // If the bot does not have permission to give the role, let the user know
            if (botRole) {
                if (
                    role.comparePositionTo(botRole) > 0 &&
                    option !== 'adminRole'
                ) {
                    // Admin role is not applied to anyone so it doesn't need permission to handle it
                    message = `Configuration option ${option} updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to or remove that role from members, please change this so I can manage the role correctly!`;
                } else {
                    message = `Configuration option ${option} updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option ${option} updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

            switch (option) {
                case 'adminRole':
                case 'ownerRole':
                case 'chiefRole':
                case 'strategistRole':
                case 'captainRole':
                case 'recruiterRole':
                case 'recruitRole':
                case 'allyOwnerRole':
                case 'allyRole':
                case 'championRole':
                case 'heroRole':
                case 'vipPlusRole':
                case 'vipRole':
                case 'veteranRole':
                case 'verifiedRole':
                case 'unverifiedRole':
                case 'memberOfRole':
                case 'administratorRole':
                case 'moderatorRole':
                case 'contentTeamRole':
                case 'giveawayRole':
                case 'eventsRole':
                    config[option] = role.id;
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
