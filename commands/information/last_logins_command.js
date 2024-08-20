const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const lastLogins = require('../../functions/last_logins');
const utilities = require('../../functions/utilities');
const messages = require('../../functions/messages');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lastlogins')
        .setDescription('View the last time each member of a guild logged in.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild you want to see last logins for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Loading last logins for ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await lastLogins(interaction);

        const embeds = [];
        const row = new ActionRowBuilder();

        if (response.guildUuids !== undefined) {
            // Multiselector
            const responseEmbed = new EmbedBuilder();

            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(
                    `More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following.`,
                )
                .setColor(0x999999);

            for (let i = 0; i < response.guildUuids.length; i++) {
                const guildPrefix = response.guildPrefixes[i];
                const guildName = response.guildNames[i];

                responseEmbed.addFields({
                    name: `Option ${i + 1}`,
                    value: `[[${guildPrefix}] ${guildName}](https://wynncraft.com/stats/guild/${guildName.replaceAll(' ', '%20')})`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(`last_logins:${response.guildUuids[i]}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel((i + 1).toString());

                row.addComponents(button);
            }

            await interaction.editReply({
                components: [row],
                embeds: [responseEmbed],
            });

            return;
        } else {
            if (response.guildName === '') {
                // Unknown guild
                const responseEmbed = new EmbedBuilder()
                    .setTitle('Invalid guild')
                    .setDescription(
                        `Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`,
                    )
                    .setColor(0xff0000);

                embeds.push(responseEmbed);
            } else {
                // Valid guild
                // paginate if more than 16 members
                if (response.playerLastLogins.length > 16) {
                    const pages = [];
                    for (
                        let i = 0;
                        i < response.playerLastLogins.length;
                        i += 16
                    ) {
                        pages.push(response.playerLastLogins.slice(i, i + 16));
                    }

                    for (const page of pages) {
                        const responseEmbed = new EmbedBuilder()
                            .setTitle(
                                `[${response.guildPrefix}] ${response.guildName} Last Logins`,
                            )
                            .setDescription(
                                'Players marked with a * have a custom inactivity threshold',
                            )
                            .setColor(0x00ffff);

                        let logins =
                            '```     Username    ┃    Rank    ┃ Level ┃ Last Login\n━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━╋━━━━━━━━━━━━━━\n';

                        for (const player of page) {
                            let lastLoginValue;

                            if (player.online) {
                                lastLoginValue = 'Online now';
                            } else {
                                lastLoginValue =
                                    utilities.getTimeSince(player.lastLogin) +
                                    ' ago';
                            }

                            logins += `${player.username.padEnd(16)} ┃ ${player.guildRank.padEnd(10)} ┃  ${player.highestCharacterLevel.toString().padEnd(3)}  ┃ ${lastLoginValue}\n`;
                        }

                        logins += '```';

                        responseEmbed.addFields({
                            name: 'Last Logins',
                            value: `${logins}`,
                        });

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
                    const responseEmbed = new EmbedBuilder()
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Last Logins`,
                        )
                        .setDescription(
                            'Players marPlayers marked with a * have a custom inactivity thresholdrom inactivity',
                        )
                        .setColor(0x00ffff);

                    if (response.playerLastLogins.length > 0) {
                        let logins =
                            '```     Username    ┃    Rank    ┃ Level ┃ Last Login\n━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━╋━━━━━━━━━━━━━━\n';

                        for (const player of response.playerLastLogins) {
                            let lastLoginValue;

                            if (player.online) {
                                lastLoginValue = 'Online now';
                            } else {
                                lastLoginValue =
                                    utilities.getTimeSince(player.lastLogin) +
                                    ' ago';
                            }

                            logins += `${player.username.padEnd(16)} ┃ ${player.guildRank.padEnd(10)} ┃  ${player.highestCharacterLevel.toString().padEnd(3)}  ┃ ${lastLoginValue}\n`;
                        }

                        logins += '```';

                        responseEmbed.addFields({
                            name: 'Last Logins',
                            value: `${logins}`,
                        });
                    }

                    embeds.push(responseEmbed);
                }
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
    },
};
