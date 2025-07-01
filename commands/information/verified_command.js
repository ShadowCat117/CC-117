const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const verified = require('../../functions/verified');
const messages = require('../../functions/messages');
const database = require('../../database/database');
const configUtils = require('../../functions/config_utils');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verified')
        .setDescription('Check who in your server is verified.'),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Finding verified members.')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

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

            const guildUuid = config.guild;

            if (!guildUuid) {
                const responseEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        'You do not have a guild set. Use /setguild to set one.',
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            const guildName = (await database.findGuild(guildUuid, true)).name;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        `You must be a member of ${guildName} to run this command.`,
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const response = await verified(guildUuid, interaction);

            const embeds = [];
            const row = new ActionRowBuilder();

            if (response.guildName === '') {
                // Failed to get guild info from API
                const responseEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        'Failed to fetch guild information from the API, it may be down.',
                    )
                    .setColor(0xff0000);

                embeds.push(responseEmbed);
            } else {
                // Found guild
                // Paginate if more than 25 members
                if (response.verifiedMembers.length > 25) {
                    const pages = [];
                    for (
                        let i = 0;
                        i < response.verifiedMembers.length;
                        i += 25
                    ) {
                        pages.push(response.verifiedMembers.slice(i, i + 25));
                    }

                    for (const page of pages) {
                        const responseEmbed = new EmbedBuilder();
                        responseEmbed
                            .setTitle(
                                `[${response.guildPrefix}] ${response.guildName} Verified Members`,
                            )
                            .setColor(0x00ffff);

                        for (const player of page) {
                            let verifiedValue;

                            if (player.verifiedMember) {
                                verifiedValue = `<@${player.verifiedMember}>`;
                            } else {
                                verifiedValue = 'Not verified';
                            }
                            responseEmbed.addFields({
                                name: `${player.username}`,
                                value: `${verifiedValue}`,
                            });
                        }

                        embeds.push(responseEmbed);
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
                } else {
                    const responseEmbed = new EmbedBuilder();

                    responseEmbed
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Verified Members`,
                        )
                        .setColor(0x00ffff);

                    if (response.verifiedMembers.length > 0) {
                        for (const player of response.verifiedMembers) {
                            let verifiedValue;

                            if (player.verifiedMember) {
                                verifiedValue = `<@${player.verifiedMember}>`;
                            } else {
                                verifiedValue = 'Not verified';
                            }
                            responseEmbed.addFields({
                                name: `${player.username}`,
                                value: `${verifiedValue}`,
                            });
                        }
                    }

                    embeds.push(responseEmbed);
                }
            }

            if (row.components.length > 0) {
                await interaction.editReply({
                    embeds: [embeds[0]],
                    components: [row],
                });
            } else {
                await interaction.editReply({ embeds: [embeds[0]] });
            }
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Unable to view verified members.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }
    },
};
