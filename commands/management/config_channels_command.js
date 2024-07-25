const {
    EmbedBuilder,
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
                }))
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The channel value to set for the configuration option')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const channel = interaction.options.getChannel('channel');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting ${option} to ${channel}}.`)
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

        try {
            // Save the option to the config
            switch (option) {
                case 'logChannel':
                case 'joinLeaveChannel':
                    config[option] = channel.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            const botPermissions = channel.permissionsFor(interaction.client.user);

            // If the bot does not have permission for the selected channel, tell the user
            if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
                responseEmbed
                    .setDescription(`Configuration option ${option} updated successfully to ${channel}.\n\nI currently do not have permission to send messages to that channel so please allow me to. I need View Channel & Send Messages.`)
                    .setColor(0x00ffff);
            } else {
                responseEmbed
                    .setDescription(`Configuration option ${option} updated successfully to ${channel}.`)
                    .setColor(0x00ffff);
            }
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
