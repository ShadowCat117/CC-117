const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_features')
        .setDescription('Update configuration options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Update Ranks',
                    value: 'updateRanks',
                }, {
                    name: 'Change Nicknames',
                    value: 'changeNicknames',
                }, {
                    name: 'Check Duplicate Nicknames',
                    value: 'checkDuplicateNicknames',
                }, {
                    name: 'Send Log Messages',
                    value: 'logMessages',
                }, {
                    name: 'Send Join/Leave Messages',
                    value: 'sendJoinLeaveMessages',
                }, {
                    name: 'Add Unverified Role',
                    value: 'verifyMembers',
                }, {
                    name: 'Add Veteran Role',
                    value: 'veteranRole',
                }, {
                    name: 'Member of Role',
                    value: 'memberOf',
                }, {
                    name: 'Level Roles',
                    value: 'levelRoles',
                }, {
                    name: 'Add Server Rank Roles',
                    value: 'serverRankRoles',
                }))
        .addBooleanOption((option) =>
            option.setName('enabled')
                .setDescription('Enable or disable this feature.'),
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
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.reply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const enabled = interaction.options.getBoolean('enabled');

        switch (option) {
            case 'updateRanks':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Update Ranks requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'changeNicknames':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Change Nicknames requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'checkDuplicateNicknames':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Check Duplicate Nicknames requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'logMessages':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Send Log Messages requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'sendJoinLeaveMessages':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Send Join/Leave Messages requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'verifyMembers':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Verified Roles requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'veteranRole':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Veteran Role requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'memberOf':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Member of Role requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'levelRoles':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Level Roles requires an <enabled> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'serverRankRoles':
                if (enabled == null) {
                    await interaction.reply({
                        content: 'Add Server Rank Roles requires an <enabled> input.',
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
                case 'updateRanks':
                case 'changeNicknames':
                case 'checkDuplicateNicknames':
                case 'logMessages':
                case 'sendJoinLeaveMessages':
                case 'verifyMembers':
                case 'veteranRole':
                case 'memberOf':
                case 'levelRoles':
                case 'serverRankRoles':
                    config[option] = enabled;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.reply({
                content: `Configuration option \`${option}\` updated successfully to ${enabled}.`,
                ephemeral: true,
            });
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.reply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
