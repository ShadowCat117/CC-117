const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_strategistvalues')
        .setDescription('Update promotion values for strategists')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The strategist promotion value to update')
                .setRequired(true)
                .addChoices({
                    name: 'Strategist XP Requirement',
                    value: 'strategistXPRequirement',
                }, {
                    name: 'Strategist Level Requirement',
                    value: 'strategistLevelRequirement',
                }, {
                    name: 'Strategist Contributor Requirement',
                    value: 'strategistContributorRequirement',
                }, {
                    name: 'Strategist Optional Time Requirement',
                    value: 'strategistOptionalTimeRequirement',
                }, {
                    name: 'Strategist Wars Requirement',
                    value: 'strategistWarsRequirement',
                }, {
                    name: 'Strategist War Build Requirement',
                    value: 'strategistWarBuildRequirement',
                }, {
                    name: 'Strategist Weekly Playtime Requirement',
                    value: 'strategistWeeklyPlaytimeRequirement',
                }, {
                    name: 'Strategist Eco Requirement',
                    value: 'strategistEcoRequirement',
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
            const memberOfRole = config.memberOfRole;

            const guildUuid = config.guild;

            // A guild must be set to run this command
            if (!guildUuid) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, it is required
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                const guildName = await database.findGuild(guildUuid, true);
                await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                return;
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
            case 'strategistXPRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist XP Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist XP Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistLevelRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Level Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist Level Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistContributorRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Contributor Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist Contributor Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistOptionalTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Optional Time Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist Optional Time Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistWarsRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Wars Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist Wars Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistWarBuildRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Strategist War Build Requirement requires a <value> input.');
                    return;
                }

                break;
            case 'strategistWeeklyPlaytimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Weekly Playtime Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Strategist Weekly Playtime Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistEcoRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Strategist Eco Requirement requires a <value> input.');
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
                case 'strategistXPRequirement':
                case 'strategistLevelRequirement':
                case 'strategistContributorRequirement':
                case 'strategistOptionalTimeRequirement':
                case 'strategistWarsRequirement':
                case 'strategistWeeklyPlaytimeRequirement':
                    config[option] = number;
                    break;
                case 'strategistWarBuildRequirement':
                case 'strategistEcoRequirement':
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