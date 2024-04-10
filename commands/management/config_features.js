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
                    name: 'Update Roles',
                    value: 'updateRoles',
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
                .setDescription('Enable or disable this feature.')
                .setRequired(true),
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
        const enabled = interaction.options.getBoolean('enabled');

        // Validate the options
        switch (option) {
            case 'updateRoles':
                if (enabled == null) {
                    await interaction.editReply('Update Roles requires an <enabled> input.');
                    return;
                }

                break;
            case 'checkDuplicateNicknames':
                if (enabled == null) {
                    await interaction.editReply('Check Duplicate Nicknames requires an <enabled> input.');
                    return;
                }

                break;
            case 'logMessages':
                if (enabled == null) {
                    await interaction.editReply('Send Log Messages requires an <enabled> input.');
                    return;
                }

                break;
            case 'sendJoinLeaveMessages':
                if (enabled == null) {
                    await interaction.editReply('Send Join/Leave Messages requires an <enabled> input.');
                    return;
                }

                break;
            case 'verifyMembers':
                if (enabled == null) {
                    await interaction.editReply('Verified Roles requires an <enabled> input.');
                    return;
                }

                break;
            case 'veteranRole':
                if (enabled == null) {
                    await interaction.editReply('Veteran Role requires an <enabled> input.');
                    return;
                }

                break;
            case 'memberOf':
                if (enabled == null) {
                    await interaction.editReply('Member of Role requires an <enabled> input.');
                    return;
                }

                break;
            case 'levelRoles':
                if (enabled == null) {
                    await interaction.editReply('Level Roles requires an <enabled> input.');
                    return;
                }

                break;
            case 'serverRankRoles':
                if (enabled == null) {
                    await interaction.editReply('Add Server Rank Roles requires an <enabled> input.');
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
                case 'updateRoles':
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

            await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${enabled}.`);
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply('An error occurred while updating the configuration option.');
        }
    },
};
