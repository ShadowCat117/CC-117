const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const PromotionValue = require('../../values/PromotionValue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_promotions')
        .setDescription('Update promotion options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The promotion option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Add Chief Promotion Requirement',
                    value: 'chiefPromotionRequirement',
                }, {
                    name: 'Chief XP Requirement',
                    value: 'chiefXPRequirement',
                }, {
                    name: 'Chief Level Requirement',
                    value: 'chiefLevelRequirement',
                }, {
                    name: 'Chief Contributor Requirement',
                    value: 'chiefContributorRequirement',
                }, {
                    name: 'Add Strategist Promotion Requirement',
                    value: 'strategistPromotionRequirement',
                }, {
                    name: 'Strategist XP Requirement',
                    value: 'strategistXPRequirement',
                }, {
                    name: 'Strategist Level Requirement',
                    value: 'strategistLevelRequirement',
                }, {
                    name: 'Strategist Contributor Requirement',
                    value: 'strategistContributorRequirement',
                }, {
                    name: 'Add Captain Promotion Requirement',
                    value: 'captainPromotionRequirement',
                }, {
                    name: 'Captain XP Requirement',
                    value: 'captainXPRequirement',
                }, {
                    name: 'Captain Level Requirement',
                    value: 'captainLevelRequirement',
                }, {
                    name: 'Captain Contributor Requirement',
                    value: 'captainContributorRequirement',
                }, {
                    name: 'Add Recruiter Promotion Requirement',
                    value: 'recruiterPromotionRequirement',
                }, {
                    name: 'Recruiter XP Requirement',
                    value: 'recruiterXPRequirement',
                }, {
                    name: 'Recruiter Level Requirement',
                    value: 'recruiterLevelRequirement',
                }, {
                    name: 'Recruiter Contributor Requirement',
                    value: 'recruiterContributorRequirement',
                }))
        .addStringOption((option) =>
            option.setName('value')
                .setDescription('The value to set for the promotion option. Promotion requirements require a specific input.')
                .setRequired(true)
                .addChoices({
                    name: 'None',
                    value: 'NONE',
                }, {
                    name: 'Contribution XP Requirement',
                    value: 'XP',
                }, {
                    name: 'Level Requirement',
                    value: 'LEVEL',
                }, {
                    name: 'Top Contributor Requirement',
                    value: 'TOP',
                }),
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
            case 'chiefPromotionRequirement':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Chief Promotion Requirement requires a <value> input.',
                        ephemeral: true,
                    });

                    return;
                } else if (!containsPromotionValue(valueStr)) {
                    await interaction.reply({
                        content: 'Chief Promotion Requirement requires the <value> input to be one of the presented options.',
                        ephemeral: true,
                    });

                    return;
                }

                break;
            case 'strategistPromotionRequirement':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Strategist Promotion Requirement requires a <value> input.',
                        ephemeral: true,
                    });

                    return;
                } else if (!containsPromotionValue(valueStr)) {
                    await interaction.reply({
                        content: 'Strategist Promotion Requirement requires the <value> input to be one of the presented options.',
                        ephemeral: true,
                    });

                    return;
                }

                break;
            case 'captainPromotionRequirement':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Captain Promotion Requirement requires a <value> input.',
                        ephemeral: true,
                    });

                    return;
                } else if (!containsPromotionValue(valueStr)) {
                    await interaction.reply({
                        content: 'Captain Promotion Requirement requires the <value> input to be one of the presented options.',
                        ephemeral: true,
                    });

                    return;
                }

                break;
            case 'recruiterPromotionRequirement':
                if (valueStr == null) {
                    await interaction.reply({
                        content: 'Recruiter Promotion Requirement requires a <value> input.',
                        ephemeral: true,
                    });

                    return;
                } else if (!containsPromotionValue(valueStr)) {
                    await interaction.reply({
                        content: 'Recruiter Promotion Requirement requires the <value> input to be one of the presented options.',
                        ephemeral: true,
                    });

                    return;
                }

                break;
            case 'chiefXPRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Chief XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Chief XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'chiefLevelRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Chief Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Chief Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'chiefContributorRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Chief Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Chief Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistXPRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Strategist XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Strategist XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistLevelRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Strategist Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Strategist Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'strategistContributorRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Strategist Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Strategist Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainXPRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Captain XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Captain XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainLevelRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Captain Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Captain Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'captainContributorRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Captain Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Captain Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterXPRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Recruiter XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Recruiter XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterLevelRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Recruiter Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Recruiter Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'recruiterContributorRequirement':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Recruiter Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Recruiter Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
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
                case 'chiefXPRequirement':
                case 'chiefLevelRequirement':
                case 'chiefContributorRequirement':
                case 'strategistXPRequirement':
                case 'strategistLevelRequirement':
                case 'strategistContributorRequirement':
                case 'captainXPRequirement':
                case 'captainLevelRequirement':
                case 'captainContributorRequirement':
                case 'recruiterXPRequirement':
                case 'recruiterLevelRequirement':
                case 'recruiterContributorRequirement':
                    config[option] = number;
                    break;
                case 'chiefPromotionRequirement':
                case 'strategistPromotionRequirement':
                case 'captainPromotionRequirement':
                case 'recruiterPromotionRequirement':
                    if (valueStr === 'NONE') {
                        if (config[option].includes('NONE')) {
                            await interaction.reply({
                                content: `Configuration option \`${option}\` is already NONE.`,
                                ephemeral: true,
                            });

                            return;
                        } else {
                            config[option] = [valueStr];
                        }
                    } else {
                        if (config[option].includes(valueStr)) {
                            await interaction.reply({
                                content: `Configuration option \`${option}\` already includes ${valueStr}.`,
                                ephemeral: true,
                            });

                            return;
                        } else {
                            config[option] = config[option].filter(item => item !== 'NONE');
                            config[option].push(valueStr);
                        }
                    }

                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (valueStr) {
                if (valueStr === 'NONE') {
                    await interaction.reply({
                        content: `Configuration option \`${option}\` updated successfully to NONE.`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: `Configuration option \`${option}\` updated successfully to include ${valueStr}.`,
                        ephemeral: true,
                    });
                }
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

function containsPromotionValue(input) {
    for (const promotionValue of Object.values(PromotionValue)) {
        if (input === promotionValue) {
            return true;
        }
    }

    return false;
}