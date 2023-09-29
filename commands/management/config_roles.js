const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_roles')
        .setDescription('Update configuration options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Admin Role',
                    value: 'adminRole',
                }, {
                    name: 'Owner Role',
                    value: 'ownerRole',
                }, {
                    name: 'Chief Role',
                    value: 'chiefRole',
                }, {
                    name: 'Strategist Role',
                    value: 'strategistRole',
                }, {
                    name: 'Captain Role',
                    value: 'captainRole',
                }, {
                    name: 'Recruiter Role',
                    value: 'recruiterRole',
                }, {
                    name: 'Recruit Role',
                    value: 'recruitRole',
                }, {
                    name: 'Ally Owner Role',
                    value: 'allyOwnerRole',
                }, {
                    name: 'Ally Role',
                    value: 'allyRole',
                }, {
                    name: 'Champion Role',
                    value: 'championRole',
                }, {
                    name: 'Hero Role',
                    value: 'heroRole',
                }, {
                    name: 'VIP+ Role',
                    value: 'vipPlusRole',
                }, {
                    name: 'VIP Role',
                    value: 'vipRole',
                }, {
                    name: 'Veteran Role',
                    value: 'vetRole',
                }, {
                    name: 'Verified Role',
                    value: 'verifiedRole',
                }, {
                    name: 'Unverified Role',
                    value: 'unverifiedRole',
                }, {
                    name: 'Member of Role',
                    value: 'memberOfRole',
                }, {
                    name: 'Administrator Role',
                    value: 'administratorRole',
                }, {
                    name: 'Moderator Role',
                    value: 'moderatorRole',
                }, {
                    name: 'Content Team Role',
                    value: 'contentTeamRole',
                }))
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('The role value to set for the configuration option'),
        ),
    async execute(interaction) {
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
                await interaction.reply({
                    content: 'You do not have the required permissions to run this command.',
                    ephemeral: true,
                });
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.reply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        switch (option) {
            case 'adminRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Admin Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (interaction.member.id !== interaction.member.guild.ownerId && interaction.member.roles.highest.comparePositionTo(role) < 0) {
                    await interaction.reply({
                        content: 'You don\'t have permission to change the Admin Role to that role.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'ownerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Owner Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'chiefRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Chief Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'strategistRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Strategist Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'captainRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Captain Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'recruiterRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Recruiter Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'recruitRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Recruit Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'allyOwnerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Ally Owner Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'allyRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Ally Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'championRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Champion Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'heroRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Hero Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'vipPlusRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'VIP+ Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'vipRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'VIP Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'vetRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Veteran Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'verifiedRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Verified Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'unverifiedRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Unverified Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'memberOfRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Member of Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'administratorRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Administrator Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'moderatorRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Moderator Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'contentTeamRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Content Team Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            default:
                await interaction.reply({
                    content: 'Invalid configuration option.',
                    ephemeral: true,
                });
                return;
        }

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(roleSearch => roleSearch.managed && roleSearch.members.has(interaction.client.user.id));

            let message;

            if (botRole) {
                if (role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to members, please change this so I can add the role correctly!`;
                } else {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option \`${option}\` updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
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
                case 'vetRole':
                case 'verifiedRole':
                case 'unverifiedRole':
                case 'memberOfRole':
                case 'administratorRole':
                case 'moderatorRole':
                case 'contentTeamRole':
                    config[option] = role.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.reply({
                content: message,
                ephemeral: true,
            });
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.reply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
