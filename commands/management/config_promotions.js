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
                    name: 'Chief Time Requirement',
                    value: 'chiefTimeRequirement',
                }, {
                    name: 'Chief Requirements Count',
                    value: 'chiefRequirementsCount',
                }, {
                    name: 'Add Strategist Promotion Requirement',
                    value: 'strategistPromotionRequirement',
                }, {
                    name: 'Strategist Time Requirement',
                    value: 'strategistTimeRequirement',
                }, {
                    name: 'Strategist Requirements Count',
                    value: 'strategistRequirementsCount',
                }, {
                    name: 'Add Captain Promotion Requirement',
                    value: 'captainPromotionRequirement',
                }, {
                    name: 'Captain Time Requirement',
                    value: 'captainTimeRequirement',
                }, {
                    name: 'Captain Requirements Count',
                    value: 'captainRequirementsCount',
                }, {
                    name: 'Add Recruiter Promotion Requirement',
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
                .setDescription('The value to set for the promotion option.')
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
                .setDescription('How much of the promotion requirement you need to achieve this promotion.'),
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
        const requirementStr = interaction.options.getString('requirement');
        const requirementNum = interaction.options.getInteger('requirement_number');
        let number;

        switch (option) {
            case 'chiefPromotionRequirement':
                if (requirementStr == null) {
                    await interaction.editReply('Chief Promotion Requirement requires a <value> input.');

                    return;
                } else if (!containsPromotionValue(requirementStr)) {
                    await interaction.editReply('Chief Promotion Requirement requires the <value> input to be one of the presented options.');

                    return;
                }

                break;
            case 'chiefTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Chief Time Requirement requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'chiefRequirementsCount':
                if (!requirementNum) {
                    await interaction.editReply('Chief Requirements Count requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistPromotionRequirement':
                if (requirementStr == null) {
                    await interaction.editReply('Strategist Promotion Requirement requires a <value> input.');

                    return;
                } else if (!containsPromotionValue(requirementStr)) {
                    await interaction.editReply('Strategist Promotion Requirement requires the <value> input to be one of the presented options.');

                    return;
                }

                break;
            case 'strategistTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Time Requirement requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'strategistRequirementsCount':
                if (!requirementNum) {
                    await interaction.editReply('Strategist Requirements Count requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainPromotionRequirement':
                if (requirementStr == null) {
                    await interaction.editReply('Captain Promotion Requirement requires a <value> input.');

                    return;
                } else if (!containsPromotionValue(requirementStr)) {
                    await interaction.editReply('Captain Promotion Requirement requires the <value> input to be one of the presented options.');

                    return;
                }

                break;
            case 'captainTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Captain Time Requirement requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'captainRequirementsCount':
                if (!requirementNum) {
                    await interaction.editReply('Captain Requirements Count requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterPromotionRequirement':
                if (requirementStr == null) {
                    await interaction.editReply('Recruiter Promotion Requirement requires a <value> input.');

                    return;
                } else if (!containsPromotionValue(requirementStr)) {
                    await interaction.editReply('Recruiter Promotion Requirement requires the <value> input to be one of the presented options.');

                    return;
                }

                break;
            case 'recruiterTimeRequirement':
                if (!requirementNum) {
                    await interaction.editReply('Recruiter Time Requirement requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
                }

                break;
            case 'recruiterRequirementsCount':
                if (!requirementNum) {
                    await interaction.editReply('Recruiter Requirements Count requires a <value> input.');
                    return;
                } else {
                    number = parseInt(requirementNum);
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

            switch (option) {
                case 'chiefTimeRequirement':
                case 'chiefRequirementsCount':
                case 'strategistTimeRequirement':
                case 'strategistRequirementsCount':
                case 'captainTimeRequirement':
                case 'captainRequirementsCount':
                case 'recruiterTimeRequirement':
                case 'recruiterRequirementsCount':
                    config[option] = number;
                    break;
                case 'chiefPromotionRequirement':
                case 'strategistPromotionRequirement':
                case 'captainPromotionRequirement':
                case 'recruiterPromotionRequirement':
                    if (requirementStr === 'NONE') {
                        if (config[option].includes('NONE')) {
                            await interaction.editReply(`Configuration option \`${option}\` is already NONE.`);

                            return;
                        } else {
                            config[option] = [requirementStr];
                        }
                    } else {
                        if (config[option].includes(requirementStr)) {
                            await interaction.editReply(`Configuration option \`${option}\` already includes ${requirementStr}.`);

                            return;
                        } else {
                            config[option] = config[option].filter(item => item !== 'NONE');
                            config[option].push(requirementStr);
                        }
                    }

                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (requirementStr) {
                if (requirementStr === 'NONE') {
                    await interaction.editReply(`Configuration option \`${option}\` updated successfully to NONE.`);
                } else {
                    await interaction.editReply(`Configuration option \`${option}\` updated successfully to include ${requirementStr}.`);
                }
            } else {
                await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${number}.`);
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply('An error occurred while updating the configuration option.');
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