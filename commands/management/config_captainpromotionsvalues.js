const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_captainvalues')
        .setDescription('Update promotion values for captains')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The captain promotion value to update')
                .setRequired(true)
                .addChoices({
                    name: 'Captain XP Requirement',
                    value: 'captainXPRequirement',
                }, {
                    name: 'Captain Level Requirement',
                    value: 'captainLevelRequirement',
                }, {
                    name: 'Captain Contributor Requirement',
                    value: 'captainContributorRequirement',
                }, {
                    name: 'Captain Optional Time Requirement',
                    value: 'captainOptionalTimeRequirement',
                }, {
                    name: 'Captain Wars Requirement',
                    value: 'captainWarsRequirement',
                }, {
                    name: 'Captain War Build Requirement',
                    value: 'captainWarBuildRequirement',
                }, {
                    name: 'Captain Weekly Playtime Requirement',
                    value: 'captainWeeklyPlaytimeRequirement',
                }, {
                    name: 'Captain Eco Requirement',
                    value: 'captainEcoRequirement',
                }))
        .addIntegerOption((option) =>
            option.setName('requirement_number')
                .setDescription('How much of the promotion requirement you need to achieve this promotion.'),
        )
        .addBooleanOption((option) =>
            option.setName('needed')
                .setDescription('Is this requirement needed to achieve this promotion.'),
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
        const requirementNum = interaction.options.getInteger('requirement_number');
        let number;
        const requirementNeeded = interaction.options.getBoolean('needed');

        switch (option) {
            case 'captainXPRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainLevelRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainContributorRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainOptionalTimeRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain Optional Time Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain Optional Time Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainWarsRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain Wars Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain Wars Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainWarBuildRequirement':
                if (!requirementNeeded) {
                    await interaction.reply({
                        content: 'Captain War Build Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'captainWeeklyPlaytimeRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Captain Weekly Playtime Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Captain Weekly Playtime Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainEcoRequirement':
                if (!requirementNeeded) {
                    await interaction.reply({
                        content: 'Captain Eco Requirement requires a <value> input.',
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

            switch (option) {
                case 'captainXPRequirement':
                case 'captainLevelRequirement':
                case 'captainContributorRequirement':
                case 'captainOptionalTimeRequirement':
                case 'captainWarsRequirement':
                case 'captainWeeklyPlaytimeRequirement':
                    config[option] = number;
                    break;
                case 'captainWarBuildRequirement':
                case 'captainEcoRequirement':
                    config[option] = requirementNeeded;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (number) {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${number}.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${requirementNeeded}.`,
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