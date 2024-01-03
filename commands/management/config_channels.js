const {
    SlashCommandBuilder,
    PermissionsBitField,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_channels')
        .setDescription('Update configuration options')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Log Channel',
                    value: 'logChannel',
                }, {
                    name: 'Join/Leave Channel',
                    value: 'joinLeaveChannel',
                }, {
                    name: 'High Rank Channel',
                    value: 'highRankChannel',
                }))
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The channel value to set for the configuration option'),
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
        const channel = interaction.options.getChannel('channel');

        switch (option) {
            case 'logChannel':
                if (channel == null) {
                    await interaction.editReply('Log Channel requires a <channel> input.');
                    return;
                }

                break;
            case 'joinLeaveChannel':
                if (channel == null) {
                    await interaction.editReply('Join/Leave Channel requires a <channel> input.');
                    return;
                }

                break;
            case 'highRankChannel':
                if (channel == null) {
                    await interaction.editReply('High Rank Channel requires a <channel> input.');
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

            switch (option) {
                case 'logChannel':
                case 'joinLeaveChannel':
                case 'highRankChannel':
                    config[option] = channel.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            const botPermissions = channel.permissionsFor(interaction.client.user);

            if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
                await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${channel}.\n\nI currently do not have permission to send messages to that channel so please allow me to. I need View Channel & Send Messages.`);
            } else {
                await interaction.editReply(`Configuration option \`${option}\` updated successfully to ${channel}.`);
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply('An error occurred while updating the configuration option.');
        }
    },
};
