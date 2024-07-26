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
const messages = require('../../functions/messages');
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inactivityexceptions')
        .setDescription(
            'Check who in your guild has custom inactivity thresholds.',
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading inactivity exceptions.')
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
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
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

            if (
                !config['inactivityExceptions'] ||
                Object.keys(config['inactivityExceptions']).length === 0
            ) {
                responseEmbed
                    .setDescription(
                        'No players currently have custom inactivity thresholds.',
                    )
                    .setColor(0x999999);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // Paginate if more than 25 players have inactivity exceptions
            if (Object.keys(config['inactivityExceptions']).length > 25) {
                const embeds = [];
                const row = new ActionRowBuilder();

                const pages = [];
                for (
                    let i = 0;
                    i < Object.keys(config['inactivityExceptions']).length;
                    i += 25
                ) {
                    pages.push(
                        Object.keys(config['inactivityExceptions']).slice(
                            i,
                            i + 25,
                        ),
                    );
                }

                for (const page of pages) {
                    const pageEmbed = new EmbedBuilder();

                    pageEmbed
                        .setTitle(`${guildName} Inactivity Exceptions`)
                        .setDescription(
                            'These players have custom inactivity thresholds.',
                        )
                        .setColor(0x00ffff);

                    for (const player in page) {
                        let duration;

                        if (
                            config['inactivityExceptions'][page[player]] === -1
                        ) {
                            duration = 'Exempt from inactivity forever';
                        } else {
                            duration = `Allowed to be inactive for ${config['inactivityExceptions'][page[player]]} day${config['inactivityExceptions'][page[player]] !== 1 ? 's' : ''}`;
                        }

                        const username = (
                            await database.findPlayer(page[player], true)
                        ).username;
                        pageEmbed.addFields({
                            name: username.replaceAll('_', '\\_'),
                            value: duration,
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
                    .setTitle(`${guildName} Inactivity Exceptions`)
                    .setDescription(
                        'These players have custom inactivity thresholds.',
                    )
                    .setColor(0x00ffff);

                for (const player in config['inactivityExceptions']) {
                    let duration;

                    if (config['inactivityExceptions'][player] === -1) {
                        duration = 'Exempt from inactivity forever';
                    } else {
                        duration = `Allowed to be inactive for ${config['inactivityExceptions'][player]} day${config['inactivityExceptions'][player] !== 1 ? 's' : ''}`;
                    }

                    const username = (await database.findPlayer(player, true))
                        .username;
                    responseEmbed.addFields({
                        name: username.replaceAll('_', '\\_'),
                        value: duration,
                    });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Unable to view inactivity exceptions.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }
    },
};
