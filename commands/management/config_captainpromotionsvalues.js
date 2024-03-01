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

            // A guild must be set to run this command
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, it is required
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Can only be ran by the owner or an admin
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
        const requirementNum = interaction.options.getInteger('requirement_number');
        let number;
        const requirementNeeded = interaction.options.getBoolean('needed');

        // Validate the options
        switch (option) {
            case 'captainXPRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain XP Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain XP Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainLevelRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Level Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain Level Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainContributorRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Contributor Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain Contributor Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainOptionalTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Optional Time Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain Optional Time Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainWarsRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Wars Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain Wars Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainWarBuildRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Captain War Build Requirement requires a <value> input.');
                    return;
                }

                break;
            case 'captainWeeklyPlaytimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Weekly Playtime Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Captain Weekly Playtime Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainEcoRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Captain Eco Requirement requires a <value> input.');
                    return;
                }

                break;
            default:
                await interaction.editReply('Invalid configuration option.');
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

            // Save the option to the config
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
                await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${number}.`);
            } else {
                await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${requirementNeeded}.`);
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply('An error occurred while updating the configuration option.');
        }
    },
};