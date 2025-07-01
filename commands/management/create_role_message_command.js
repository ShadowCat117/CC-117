const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const configUtils = require('../../functions/config_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrolemessage')
        .setDescription('Sends a message with buttons to get certain roles.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Creating roles message.')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(interaction.client, guildId);

                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        'Failed to read config or you have not setup the roles message configs. Do so with /config_messages and /config_roles.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to read config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const adminRoleId = config.adminRole;
        const memberRoles = interaction.member.roles.cache;

        if (
            interaction.member.id !== interaction.member.guild.ownerId &&
            !memberRoles.has(adminRoleId) &&
            interaction.member.roles.highest.position <
                interaction.guild.roles.cache.get(adminRoleId).position
        ) {
            responseEmbed
                .setTitle('Error')
                .setDescription(
                    'You do not have the required permissions to run this command.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const message = config['roleMessage'];

        if (!message) {
            responseEmbed
                .setTitle('Error')
                .setDescription(
                    'You have not set a roles message with /config_messages roleMessage.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const row = new ActionRowBuilder();

        if (config['giveawayRole']) {
            const giveawayButton = new ButtonBuilder()
                .setCustomId('giveaway')
                .setStyle(ButtonStyle.Success)
                .setLabel('GIVEAWAY');

            row.addComponents(giveawayButton);
        }

        if (config['eventsRole']) {
            const eventsButton = new ButtonBuilder()
                .setCustomId('events')
                .setStyle(ButtonStyle.Success)
                .setLabel('EVENTS');

            row.addComponents(eventsButton);
        }

        if (config['bombBellRole']) {
            const bombBellButton = new ButtonBuilder()
                .setCustomId('bombbell')
                .setStyle(ButtonStyle.Success)
                .setLabel('BOMB BELL');

            row.addComponents(bombBellButton);
        }

        if (config['guildRaidRole']) {
            const guildRaidButton = new ButtonBuilder()
                .setCustomId('guildraid')
                .setStyle(ButtonStyle.Success)
                .setLabel('GUILD RAID');

            row.addComponents(guildRaidButton);
        }

        if (config['annihilationRole']) {
            const annihilationButton = new ButtonBuilder()
                .setCustomId('annihilation')
                .setStyle(ButtonStyle.Success)
                .setLabel('ANNIHILATION');

            row.addComponents(annihilationButton);
        }

        const channel = interaction.guild.channels.cache.get(
            interaction.channelId,
        );

        const formattedMessage = message.replace(/\\n/g, '\n');

        if (channel) {
            try {
                await channel.send({
                    content: formattedMessage,
                    components: [row],
                });

                responseEmbed
                    .setDescription('Roles message created successfully.')
                    .setColor(0x00ffff);
            } catch (error) {
                console.error(
                    `Failed to send roles message to channel ${interaction.channelId} in guild ${interaction.guild.id}`,
                );
                responseEmbed
                    .setDescription(
                        'Failed to send message in current channel.',
                    )
                    .setColor(0xff0000);
            }
        } else {
            responseEmbed
                .setTitle('Error')
                .setDescription('Unable to find current channel.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
