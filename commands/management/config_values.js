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
                    name: 'Chief Inactive Upper Threshold',
                    value: 'chiefUpperThreshold',
                }, {
                    name: 'Chief Inactive Lower Threshold',
                    value: 'chiefLowerThreshold',
                }, {
                    name: 'Strategist Inactive Upper Threshold',
                    value: 'strategistUpperThreshold',
                }, {
                    name: 'Strategist Inactive Lower Threshold',
                    value: 'strategistLowerThreshold',
                }, {
                    name: 'Captain Inactive Upper Threshold',
                    value: 'captainUpperThreshold',
                }, {
                    name: 'Captain Inactive Lower Threshold',
                    value: 'captainLowerThreshold',
                }, {
                    name: 'Recruiter Inactive Upper Threshold',
                    value: 'recruiterUpperThreshold',
                }, {
                    name: 'Recruiter Inactive Lower Threshold',
                    value: 'recruiterLowerThreshold',
                }, {
                    name: 'Recruit Inactive Upper Threshold',
                    value: 'recruitUpperThreshold',
                }, {
                    name: 'Recruit Inactive Lower Threshold',
                    value: 'recruitLowerThreshold',
                }, {
                    name: 'Inactivity Full Level Requirement',
                    value: 'levelRequirement',
                }, {
                    name: 'Extra Time Multiplier',
                    value: 'extraTimeMultiplier',
                }, {
                    name: 'Average Online Requirement',
                    value: 'averageRequirement',
                }, {
                    name: 'New Player Minimum Time',
                    value: 'newPlayerMinimumTime',
                }, {
                    name: 'New Player Threshold',
                    value: 'newPlayerThreshold',
                }, {
                    name: 'War Message',
                    value: 'warMessage',
                }, {
                    name: 'War Class Message',
                    value: 'warClassMessage',
                }, {
                    name: 'Class Message',
                    value: 'classMessage',
                }, {
                    name: 'Class Archetype Message',
                    value: 'classArchetypeMessage',
                }, {
                    name: 'Total Member Threshold',
                    value: 'memberThreshold',
                }, {
                    name: 'War Level Requirement',
                    value: 'warLevelRequirement',
                }, {
                    name: 'Giveaway Message',
                    value: 'giveawayMessage',
                }))
        .addStringOption((option) =>
            option.setName('value')
                .setDescription('The value to set for the configuration option'),
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
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.editReply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const valueStr = interaction.options.getString('value');
        let number;

        switch (option) {
            case 'joinMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'Join Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'Join Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'leaveMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'Leave Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'Leave Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'chiefUpperThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Chief Inactive Upper Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Chief Inactive Upper Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'chiefLowerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Chief Inactive Lower Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Chief Inactive Lower Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistUpperThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Strategist Inactive Upper Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Strategist Inactive Upper Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistLowerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Strategist Inactive Lower Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Strategist Inactive Lower Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainUpperThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Captain Inactive Upper Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Captain Inactive Upper Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainLowerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Captain Inactive Lower Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Captain Inactive Lower Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterUpperThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Recruiter Inactive Upper Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Recruiter Inactive Upper Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterLowerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Recruiter Inactive Lower Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Recruiter Inactive Lower Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruitUpperThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Recruit Inactive Upper Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Recruit Inactive Upper Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'recruitLowerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Recruit Inactive Lower Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Recruit Inactive Lower Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'levelRequirement':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Inactivity Full Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Inactivity Full Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'extraTimeMultiplier':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Extra Time Multiplier requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Extra Time Multiplier requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'averageRequirement':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Average Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Average Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'newPlayerMinimumTime':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'New Player Minimum Time requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'New Player Minimum Time requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'newPlayerThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'New Player Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'New Player Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'memberThreshold':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'Total Members Threshold requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'Total Members Threshold requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'warMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'War Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'War Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'warClassMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'War Class Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'War Class Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'classMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'Class Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'Class Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'classArchetypeMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'Class Archetype Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'Class Archetype Message must be less than 750 characters.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'warLevelRequirement':
                if (!valueStr) {
                    await interaction.editReply({
                        content: 'War Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.editReply({
                        content: 'War Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'giveawayMessage':
                if (valueStr == null) {
                    await interaction.editReply({
                        content: 'Giveaway Message requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (valueStr.length > 750) {
                    await interaction.editReply({
                        content: 'Giveaway Message must be less than 750 characters.',
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

            switch (option) {
                case 'joinMessage':
                case 'leaveMessage':
                case 'warMessage':
                case 'warClassMessage':
                case 'classMessage':
                case 'classArchetypeMessage':
                case 'giveawayMessage':
                    config[option] = valueStr;
                    break;
                case 'chiefUpperThreshold':
                case 'chiefLowerThreshold':
                case 'strategistUpperThreshold':
                case 'strategistLowerThreshold':
                case 'captainUpperThreshold':
                case 'captainLowerThreshold':
                case 'recruiterUpperThreshold':
                case 'recruiterLowerThreshold':
                case 'recruitUpperThreshold':
                case 'recruitLowerThreshold':
                case 'levelRequirement':
                case 'extraTimeMultiplier':
                case 'averageRequirement':
                case 'newPlayerMinimumTime':
                case 'newPlayerThreshold':
                case 'memberThreshold':
                case 'warLevelRequirement':
                    config[option] = number;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (valueStr) {
                await interaction.editReply({
                    content: `Configuration option \`${option}\` updated successfully to ${valueStr}.`,
                    ephemeral: true,
                });
            } else {
                await interaction.editReply({
                    content: `Configuration option \`${option}\` updated successfully to ${number}.`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
