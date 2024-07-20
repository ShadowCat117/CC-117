const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_chiefvalues')
        .setDescription('Update promotion values for chiefs')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The chief promotion value to update')
                .setRequired(true)
                .addChoices({
                    name: 'Chief XP Requirement',
                    value: 'chiefXPRequirement',
                }, {
                    name: 'Chief Level Requirement',
                    value: 'chiefLevelRequirement',
                }, {
                    name: 'Chief Contributor Requirement',
                    value: 'chiefContributorRequirement',
                }, {
                    name: 'Chief Optional Time Requirement',
                    value: 'chiefOptionalTimeRequirement',
                }, {
                    name: 'Chief Wars Requirement',
                    value: 'chiefWarsRequirement',
                }, {
                    name: 'Chief War Build Requirement',
                    value: 'chiefWarBuildRequirement',
                }, {
                    name: 'Chief Weekly Playtime Requirement',
                    value: 'chiefWeeklyPlaytimeRequirement',
                }, {
                    name: 'Chief Eco Requirement',
                    value: 'chiefEcoRequirement',
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
            case 'chiefXPRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief XP Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief XP Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefLevelRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Level Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief Level Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefContributorRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Contributor Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief Contributor Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefOptionalTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Optional Time Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief Optional Time Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefWarsRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Wars Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief Wars Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefWarBuildRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Chief War Build Requirement requires a <value> input.');
                    return;
                }

                break;
            case 'chiefWeeklyPlaytimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Weekly Playtime Requirement requires a <value> input.');
                    return;
                } else if (isNaN(requirementNum)) {
                    await interaction.editReply('Chief Weekly Playtime Requirement requires <value> to be a number input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefEcoRequirement':
                if (!requirementNeeded) {
                    await interaction.editReply('Chief Eco Requirement requires a <value> input.');
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
                case 'chiefXPRequirement':
                case 'chiefLevelRequirement':
                case 'chiefContributorRequirement':
                case 'chiefOptionalTimeRequirement':
                case 'chiefWarsRequirement':
                case 'chiefWeeklyPlaytimeRequirement':
                    config[option] = number;
                    break;
                case 'chiefWarBuildRequirement':
                case 'chiefEcoRequirement':
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