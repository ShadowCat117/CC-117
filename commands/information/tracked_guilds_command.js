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
const messages = require('../../functions/messages');
const PagedMessage = require('../../message_objects/PagedMessage');
const database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trackedguilds')
        .setDescription(
            'View the average number of online players for each tracked guild.',
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading tracked guilds.')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        const responseEmbed = new EmbedBuilder();

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (
                !config['trackedGuilds'] ||
                Object.keys(config['trackedGuilds']).length === 0
            ) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('No guilds are currently being tracked')
                    .setColor(0x999999);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            const trackedGuilds = await database.getGuildActivities(
                config['trackedGuilds'],
            );

            // Paginate if more than 10 tracked guilds have data
            if (trackedGuilds.length > 10) {
                const embeds = [];
                const row = new ActionRowBuilder();

                const pages = [];
                for (let i = 0; i < trackedGuilds.length; i += 10) {
                    pages.push(trackedGuilds.slice(i, i + 10));
                }

                for (const page of pages) {
                    const pageEmbed = new EmbedBuilder();

                    pageEmbed
                        .setTitle(
                            'Average and current activity for tracked guilds',
                        )
                        .setDescription(
                            'Number in brackets represents the current online count.',
                        )
                        .setColor(0x00ffff);

                    for (const guild in page) {
                        const trackedGuild = page[guild];
                        pageEmbed.addFields({
                            name: `[${trackedGuild.prefix}] ${trackedGuild.name}`,
                            value: `Avg. Online: ${trackedGuild.averageOnline} (${trackedGuild.currentOnline})\nAvg. Captains+: ${trackedGuild.averageCaptains} (${trackedGuild.currentCaptains})`,
                        });
                    }

                    embeds.push(pageEmbed);
                }

                messages.addMessage(
                    message.id,
                    new PagedMessage(message, embeds),
                );

                const previousPage = new ButtonBuilder()
                    .setCustomId('previous')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⬅️');

                const nextPage = new ButtonBuilder()
                    .setCustomId('next')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️');

                row.addComponents(previousPage, nextPage);

                await interaction.editReply({
                    embeds: [embeds[0]],
                    components: [row],
                });
            } else {
                responseEmbed
                    .setTitle('Average and current activity for tracked guilds')
                    .setDescription(
                        'Number in brackets represents the current online count.',
                    )
                    .setColor(0x00ffff);

                for (const guild in trackedGuilds) {
                    const trackedGuild = trackedGuilds[guild];
                    responseEmbed.addFields({
                        name: `[${trackedGuild.prefix}] ${trackedGuild.name}`,
                        value: `Avg. Online: ${trackedGuild.averageOnline} (${trackedGuild.currentOnline})\nAvg. Captains+: ${trackedGuild.averageCaptains} (${trackedGuild.currentCaptains})`,
                    });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Unable to view tracked guilds.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }
    },
};
