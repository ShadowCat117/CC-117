const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_promotions')
        .setDescription('Update promotion options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The promotion option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Set Chief Promotion Requirement',
                    value: 'chiefPromotionRequirement',
                }, {
                    name: 'Chief Time Requirement',
                    value: 'chiefTimeRequirement',
                }, {
                    name: 'Chief Requirements Count',
                    value: 'chiefRequirementsCount',
                }, {
                    name: 'Set Strategist Promotion Requirement',
                    value: 'strategistPromotionRequirement',
                }, {
                    name: 'Strategist Time Requirement',
                    value: 'strategistTimeRequirement',
                }, {
                    name: 'Strategist Requirements Count',
                    value: 'strategistRequirementsCount',
                }, {
                    name: 'Set Captain Promotion Requirement',
                    value: 'captainPromotionRequirement',
                }, {
                    name: 'Captain Time Requirement',
                    value: 'captainTimeRequirement',
                }, {
                    name: 'Captain Requirements Count',
                    value: 'captainRequirementsCount',
                }, {
                    name: 'Set Recruiter Promotion Requirement',
                    value: 'recruiterPromotionRequirement',
                }, {
                    name: 'Recruiter Time Requirement',
                    value: 'recruiterTimeRequirement',
                }, {
                    name: 'Recruiter Requirements Count',
                    value: 'recruiterRequirementsCount',
                }))
        .addStringOption((option) =>
            option.setName('requirement')
                .setDescription('Requirement type to edit for the rank promotion.')
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
                }, {
                    name: 'Days in Guild Requirement',
                    value: 'TIME',
                }, {
                    name: 'Guild Wars Requirement',
                    value: 'WARS',
                }, {
                    name: 'War Build Requirement',
                    value: 'BUILD',
                }, {
                    name: 'Weekly Playtime Requirement',
                    value: 'PLAYTIME',
                }, {
                    name: 'Eco Requirement',
                    value: 'ECO',
                }),
        )
        .addIntegerOption((option) =>
            option.setName('requirement_number')
                .setDescription('Value to set for this option.'),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Updating ${option}.`)
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
                .setTitle('Error')
                .setDescription('Failed to change config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const requirementStr = interaction.options.getString('requirement');
        const requirementNum = interaction.options.getInteger('requirement_number');

        if (option.endsWith('TimeRequirement') || (option.endsWith('RequirementsCount'))) {
            if (!requirementNum) {
                responseEmbed
                    .setTitle('Invalid option')
                    .setDescription(`${option} requires a number input, set one using the 'requirement_number' option.`)
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } else {
            if (!requirementStr) {
                responseEmbed
                    .setTitle('Invalid option')
                    .setDescription(`${option} requires a string input, set one using the 'requirement' option.`)
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        }

        try {
            let message;

            // Save the option to the config
            switch (option) {
                case 'chiefTimeRequirement':
                case 'chiefRequirementsCount':
                case 'strategistTimeRequirement':
                case 'strategistRequirementsCount':
                case 'captainTimeRequirement':
                case 'captainRequirementsCount':
                case 'recruiterTimeRequirement':
                case 'recruiterRequirementsCount':
                    message = `Configuration option ${option} successfully updated to ${requirementNum}.`;
                    config[option] = requirementNum;
                    break;
                case 'chiefPromotionRequirement':
                case 'strategistPromotionRequirement':
                case 'captainPromotionRequirement':
                case 'recruiterPromotionRequirement':
                    if (requirementStr === 'BUILD' || requirementStr === 'ECO') {
                        // As these are technically boolean requirements, just add a 1 and if the key doesn't exist, and if it does then remove it.
                        if (config[option][requirementStr]) {
                            message = `Successfully removed ${requirementStr} requirement for ${option}`;
                            delete config[option][requirementStr];
                        } else {
                            message = `Successfully added ${requirementStr} requirement for ${option}`;
                            config[option][requirementStr] = 1;
                        }
                    } else if (requirementStr === 'NONE') {
                        message = `Successfully removed all requirements for ${option}`;
                        config[option] = {};
                    } else if (!requirementNum) {
                        message = `Successfully removed ${requirementStr} for ${option}`;
                        delete config[option][requirementStr];
                    } else {
                        message = `Successfully added ${requirementStr} value of ${requirementNum} to ${option}.`;
                        config[option][requirementStr] = requirementNum;
                    }

                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            responseEmbed
                    .setDescription(`${message}`)
                    .setColor(0x00ffff);
        } catch (error) {
            console.error(`Error updating configuration option: ${error}`);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to update config file.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
