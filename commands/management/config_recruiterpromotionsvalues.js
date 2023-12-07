const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_recruitervalues')
        .setDescription('Update promotion values for recruiters')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The recruiter promotion value to update')
                .setRequired(true)
                .addChoices({
                    name: 'Recruiter XP Requirement',
                    value: 'recruiterXPRequirement',
                }, {
                    name: 'Recruiter Level Requirement',
                    value: 'recruiterLevelRequirement',
                }, {
                    name: 'Recruiter Contributor Requirement',
                    value: 'recruiterContributorRequirement',
                }, {
                    name: 'Recruiter Optional Time Requirement',
                    value: 'recruiterOptionalTimeRequirement',
                }, {
                    name: 'Recruiter Wars Requirement',
                    value: 'recruiterWarsRequirement',
                }, {
                    name: 'Recruiter War Build Requirement',
                    value: 'recruiterWarBuildRequirement',
                }, {
                    name: 'Recruiter Weekly Playtime Requirement',
                    value: 'recruiterWeeklyPlaytimeRequirement',
                }, {
                    name: 'Recruiter Eco Requirement',
                    value: 'recruiterEcoRequirement',
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
            case 'recruiterXPRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter XP Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter XP Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterLevelRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter Level Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter Level Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterContributorRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter Contributor Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter Contributor Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterOptionalTimeRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter Optional Time Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter Optional Time Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterWarsRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter Wars Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter Wars Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterWarBuildRequirement':
                if (!requirementNeeded) {
                    await interaction.reply({
                        content: 'Recruiter War Build Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'recruiterWeeklyPlaytimeRequirement':
                if (!requirementNum) {
                    await interaction.reply({
                        content: 'Recruiter Weekly Playtime Requirement requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.reply({
                        content: 'Recruiter Weekly Playtime Requirement requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterEcoRequirement':
                if (!requirementNeeded) {
                    await interaction.reply({
                        content: 'Recruiter Eco Requirement requires a <value> input.',
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
                case 'recruiterXPRequirement':
                case 'recruiterLevelRequirement':
                case 'recruiterContributorRequirement':
                case 'recruiterOptionalTimeRequirement':
                case 'recruiterWarsRequirement':
                case 'recruiterWeeklyPlaytimeRequirement':
                    config[option] = number;
                    break;
                case 'recruiterWarBuildRequirement':
                case 'recruiterEcoRequirement':
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