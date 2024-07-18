const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const warRoles = ['war', 'tank', 'healer', 'damage', 'solo', 'eco'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createwarmessage')
        .setDescription('Sends a war message with buttons to get war-related roles.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Creating war message')
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

                responseEmbed
                    .setDescription('Failed to read config or you have not setup the war message configs. Do so with /config_values and /config_warroles')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setDescription('Failed to read config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const adminRoleId = config.adminRole;
        const memberRoles = interaction.member.roles.cache;

        // Only owners and admins can run command
        if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
            responseEmbed
                .setDescription('You do not have the required permissions to run this command.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const warMessage = config['warMessage'];

        if (!warMessage) {
            // If no war message, tell the user to set one
            responseEmbed
                .setDescription('You have not set a war message with /config_values warMessage.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        } else if (!config['warClassMessage']) {
            // If no war class message, tell the user to set one
            responseEmbed
                .setDescription('You have not set a war class message with /config_values warClassMessage.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        } else if (!config['warLevelRequirement']) {
            // If no war level requirement, tell the user to set one
            responseEmbed
                .setDescription('You have not set a war level requirement with /config_values warLevelRequirement.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Loop through war roles and if one is not present, tell the user they need to set it
        for (const warRole of warRoles) {
            if (!config[`${warRole}Role`]) {
                responseEmbed
                    .setDescription(`You have not set a role for ${warRole} using /config_warroles.`)
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        }

        // Add the war button
        const warButton = new ButtonBuilder()
            .setCustomId('war')
            .setStyle(ButtonStyle.Danger)
            .setLabel('WAR');

        const row = new ActionRowBuilder().addComponents(warButton);
        const channel = interaction.guild.channels.cache.get(interaction.channelId);
        const formattedMessage = warMessage.replace(/\\n/g, '\n');

        if (channel) {
            try {
                await channel.send({
                    content: formattedMessage,
                    components: [row],
                });

                responseEmbed
                    .setDescription('War message created successfully.')
                    .setColor(0x00ffff);
            } catch (error) {
                console.log(`Failed to send war message to channel ${interaction.channelId} in guild ${interaction.guild.id}`);
                responseEmbed
                    .setDescription('Failed to send message in current channel.')
                    .setColor(0xff0000);
            }
        } else {
            responseEmbed
                .setDescription('Unable to find current channel.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
