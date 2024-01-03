const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_levelroles')
        .setDescription('Update level role configurations')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Level Role One',
                    value: 'levelRoleOne',
                }, {
                    name: 'Level Role Two',
                    value: 'levelRoleTwo',
                }, {
                    name: 'Level Role Three',
                    value: 'levelRoleThree',
                }, {
                    name: 'Level Role Four',
                    value: 'levelRoleFour',
                }, {
                    name: 'Level Role Five',
                    value: 'levelRoleFive',
                }, {
                    name: 'Level Role Six',
                    value: 'levelRoleSix',
                }, {
                    name: 'Level Role Seven',
                    value: 'levelRoleSeven',
                }, {
                    name: 'Level Role Eight',
                    value: 'levelRoleEight',
                }, {
                    name: 'Level Role Nine',
                    value: 'levelRoleNine',
                }, {
                    name: 'Level Role Ten',
                    value: 'levelRoleTen',
                }))
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('The role value to set for the configuration option'),
        ),
    ephemeral: true,
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
            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;

            const guildName = config.guildName;

            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

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

        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        switch (option) {
            case 'levelRoleOne':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role One requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleTwo':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Two requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleThree':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Three requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleFour':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Four requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleFive':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Five requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleSix':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Six requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleSeven':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Seven requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleEight':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Eight requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleNine':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Nine requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoleTen':
                if (role == null) {
                    await interaction.editReply({
                        content: 'Level Role Ten requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            default:
                await interaction.editReply({
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
                case 'levelRoleOne':
                case 'levelRoleTwo':
                case 'levelRoleThree':
                case 'levelRoleFour':
                case 'levelRoleFive':
                case 'levelRoleSix':
                case 'levelRoleSeven':
                case 'levelRoleEight':
                case 'levelRoleNine':
                case 'levelRoleTen':
                    config[option] = role.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.editReply({
                content: message,
                ephemeral: true,
            });
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
