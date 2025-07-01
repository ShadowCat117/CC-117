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
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bannedplayers')
        .setDescription('Check who is banned from joining your guild.'),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading banned players.')
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

            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            const guildUuid = config.guild;

            if (!guildUuid) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            const guildName = (await database.findGuild(guildUuid, true)).name;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        `You must be a member of ${guildName} to run this command.`,
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (
                !config['bannedPlayers'] ||
                Object.keys(config['bannedPlayers']).length === 0
            ) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        `No players are currently banned from ${guildName}.`,
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // Paginate the response if there are more than 25 banned players
            if (Object.keys(config['bannedPlayers']).length > 25) {
                const embeds = [];
                const row = new ActionRowBuilder();

                const pages = [];
                for (
                    let i = 0;
                    i < Object.keys(config['bannedPlayers']).length;
                    i += 25
                ) {
                    pages.push(
                        Object.keys(config['bannedPlayers']).slice(i, i + 25),
                    );
                }

                for (const page of pages) {
                    const pageEmbed = new EmbedBuilder();

                    pageEmbed
                        .setTitle(`Players banned from ${guildName}`)
                        .setDescription(
                            'These players should not be invited to join the guild.',
                        )
                        .setColor(0x00ffff);

                    for (const player in page) {
                        const username = (
                            await database.findPlayer(page[player], true)
                        ).username;
                        pageEmbed.addFields({
                            name: username.replaceAll('_', '\\_'),
                            value: config['bannedPlayers'][page[player]],
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
                    .setTitle(`Players banned from ${guildName}`)
                    .setDescription(
                        'These players should not be invited to join the guild.',
                    )
                    .setColor(0x00ffff);

                for (const player in config['bannedPlayers']) {
                    const username = (await database.findPlayer(player, true))
                        .username;
                    responseEmbed.addFields({
                        name: username.replaceAll('_', '\\_'),
                        value: config['bannedPlayers'][player],
                    });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Unable to view banned players.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }
    },
};
