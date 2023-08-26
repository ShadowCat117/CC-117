const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_values')
        .setDescription('Update configuration options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Join Message',
                    value: 'joinMessage',
                }, {
                    name: 'Leave Message',
                    value: 'leaveMessage',
                }, {
                    name: 'Chief Inactive Threshold',
                    value: 'chiefThreshold',
                }, {
                    name: 'Strategist Inactive Threshold',
                    value: 'strategistThreshold',
                }, {
                    name: 'Captain Inactive Threshold',
                    value: 'captainThreshold',
                }, {
                    name: 'Recruiter Inactive Threshold',
                    value: 'recruiterThreshold',
                }, {
                    name: 'Recruit Inactive Threshold',
                    value: 'recruitThreshold',
                }, {
                    name: 'Inactivity Full Level Requirement',
                    value: 'levelRequirement',
                }, {
                    name: 'Inactivity Multiplier',
                    value: 'inactiveMultiplier',
                }))
        .addStringOption((option) =>
            option.setName('value')
                .setDescription('The value to set for the configuration option'),
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
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.reply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const valueStr = interaction.options.getString('value');
        let number;

        switch (option) {
            case 'joinMessage':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Join Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'leaveMessage':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Leave Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'chiefThreshold':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Chief Inactive Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Chief Inactive Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistThreshold':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Strategist Inactive Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Strategist Inactive Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainThreshold':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Captain Inactive Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Captain Inactive Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterThreshold':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Recruiter Inactive Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Recruiter Inactive Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruitThreshold':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Recruit Inactive Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Recruit Inactive Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'levelRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Inactivity Full Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Inactivity Full Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'inactiveMultiplier':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Inactivity Multiplier requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Inactivity Multiplier requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
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

            switch (option) {
                case 'joinMessage':
                case 'leaveMessage':
                    config[option] = valueStr;
                    break;
                case 'chiefThreshold':
                case 'strategistThreshold':
                case 'captainThreshold':
                case 'recruiterThreshold':
                case 'recruitThreshold':
                case 'levelRequirement':
                case 'inactiveMultiplier':
                    config[option] = number;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (valueStr) {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${valueStr}.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${number}.`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.reply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
