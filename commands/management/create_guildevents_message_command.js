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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createguildeventsmessage')
        .setDescription(
            'Sends a message with buttons to get the giveaways and events roles.',
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Creating guild events message.')
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
                await createConfig(interaction.client, guildId);

                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        'Failed to read config or you have not setup the guild events message configs. Do so with /config_messages and /config_roles.',
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

        const message = config['guildEventsMessage'];

        if (!message) {
            responseEmbed
                .setTitle('Error')
                .setDescription(
                    'You have not set a guild events message with /config_messages guildEventsMessage.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        if (!config['giveawayRole']) {
            responseEmbed
                .setTitle('Error')
                .setDescription('You have not set a giveaway role.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        if (!config['eventsRole']) {
            responseEmbed
                .setTitle('Error')
                .setDescription('You have not set an events role.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const giveawayButton = new ButtonBuilder()
            .setCustomId('giveaway')
            .setStyle(ButtonStyle.Success)
            .setLabel('GIVEAWAY');

        const eventsButton = new ButtonBuilder()
            .setCustomId('events')
            .setStyle(ButtonStyle.Success)
            .setLabel('EVENTS');

        const row = new ActionRowBuilder().addComponents(
            giveawayButton,
            eventsButton,
        );
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
                    .setDescription(
                        'Guild events message created successfully.',
                    )
                    .setColor(0x00ffff);
            } catch (error) {
                console.error(
                    `Failed to send guild events message to channel ${interaction.channelId} in guild ${interaction.guild.id}`,
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
