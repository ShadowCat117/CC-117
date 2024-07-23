const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_values')
        .setDescription('Update value configuration options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
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
                    name: 'Total Member Threshold',
                    value: 'memberThreshold',
                }, {
                    name: 'War Level Requirement',
                    value: 'warLevelRequirement',
                }))
        .addIntegerOption((option) =>
            option.setName('value')
                .setDescription('The value to set for the configuration option')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const value = interaction.options.getInteger('value');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting ${option} to ${value}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);
        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
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

            // If the member of role is used, it is required
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // Can only be ran by the owner or an admin
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setDescription('Error changing config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        try {
            // Save the option to the config
            switch (option) {
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
                    config[option] = value;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            responseEmbed
                .setDescription(`Option ${option} set to ${value}.`)
                .setColor(0x00ffff);
        } catch (error) {
            console.error(`Error updating configuration option: ${error}`);
            responseEmbed
                .setDescription('An error occured whilst updating config file.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
