const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const online = require('../../functions/online');
const messages = require('../../functions/messages');
const utilities = require('../../functions/utilities');
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('online')
        .setDescription('View who is currently online in a guild.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    "The name of the guild you want to see who's online for.",
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Checking online players for ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await online(interaction);

        const responseEmbed = new EmbedBuilder();

        const embeds = [];
        const row = new ActionRowBuilder();

        if (response.guildUuids !== undefined) {
            // Multiselector
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
                    .setCustomId(`online:${response.guildUuids[i]}`)
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
                responseEmbed
                    .setTitle('Invalid guild')
                    .setDescription(
                        `Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`,
                    )
                    .setColor(0xff0000);
            } else {
                // Valid guild
                // Paginate if more than 20 players
                if (response.onlinePlayers.length > 20) {
                    const pages = [];
                    for (
                        let i = 0;
                        i < response.onlinePlayers.length;
                        i += 20
                    ) {
                        pages.push(response.onlinePlayers.slice(i, i + 20));
                    }

                    for (const page of pages) {
                        const pageEmbed = new EmbedBuilder()
                            .setTitle(
                                `[${response.guildPrefix}] ${response.guildName} Online Members`,
                            )
                            .setURL(
                                `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                            )
                            .setDescription(
                                `There are currently ${response.onlineCount}/${response.memberCount} players online.`,
                            )
                            .setColor(0x00ffff);

                        // Count the number of players on each server
                        const serverCounts = response.onlinePlayers.reduce(
                            (counts, player) => {
                                counts[player.server] =
                                    (counts[player.server] || 0) + 1;
                                return counts;
                            },
                            {},
                        );

                        // Find the amount on most active servers
                        const maxCount = Math.max(
                            ...Object.values(serverCounts),
                        );

                        // If the most active server has more than 1 member
                        if (maxCount > 1) {
                            // Filter the most active servers
                            const activeServers = Object.keys(
                                serverCounts,
                            ).filter(
                                (server) => serverCounts[server] === maxCount,
                            );

                            // Sort activeServers by their WC
                            activeServers.sort((a, b) => {
                                const numA = parseInt(a.replace(/^\D+/g, ''));
                                const numB = parseInt(b.replace(/^\D+/g, ''));

                                return numA - numB;
                            });

                            // If only one server display that, otherwise join them together with /
                            const activeServerValue =
                                activeServers.length === 1
                                    ? `${maxCount} players on ${activeServers[0]}.`
                                    : `${maxCount} players on ${activeServers.join('/')}.`;

                            pageEmbed.addFields({
                                name: 'Active Server',
                                value: activeServerValue,
                                inline: false,
                            });
                        }

                        // Display a message about players in /stream if the guild online count does not match
                        // the number of online players found
                        const playersInStream =
                            response.onlineCount -
                            response.onlinePlayers.length;

                        if (playersInStream > 0) {
                            const likelyStreamers =
                                await database.getRecentPlayers(
                                    response.guildUuid,
                                    playersInStream,
                                );
                            let streamers = '';

                            for (const streamer of likelyStreamers) {
                                streamers += `\n${streamer.username} last seen ${utilities.getTimeSince(streamer.lastLogin)}`;
                            }

                            pageEmbed.addFields({
                                name: 'Streamers',
                                value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream !== 1 ? 's' : ''} in /stream.${streamers}`,
                                inline: false,
                            });
                        }

                        let onlinePlayers =
                            '```     Username    ┃    Rank    ┃ Server\n━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━\n';

                        for (const player of page) {
                            onlinePlayers += `${player.username.padEnd(16)} ┃ ${player.guildRank.padEnd(10)} ┃ ${player.server}\n`;
                        }

                        onlinePlayers += '```';

                        pageEmbed.addFields({
                            name: 'Online Players',
                            value: `${onlinePlayers}`,
                        });

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
                } else if (response.onlinePlayers.length > 0) {
                    responseEmbed
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Online Members`,
                        )
                        .setURL(
                            `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                        )
                        .setDescription(
                            `There are currently ${response.onlineCount}/${response.memberCount} players online.`,
                        )
                        .setColor(0x00ffff);

                    // Display a message about players in /stream if the guild online count does not match
                    // the number of online players found
                    const playersInStream =
                        response.onlineCount - response.onlinePlayers.length;

                    if (playersInStream > 0) {
                        const likelyStreamers = await database.getRecentPlayers(
                            response.guildUuid,
                            playersInStream,
                        );
                        let streamers = '';

                        for (const streamer of likelyStreamers) {
                            streamers += `\n${streamer.username} last seen ${utilities.getTimeSince(streamer.lastLogin)}`;
                        }

                        responseEmbed.addFields({
                            name: 'Streamers',
                            value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream !== 1 ? 's' : ''} in /stream.${streamers}`,
                            inline: false,
                        });
                    }

                    // Count the number of players on each server
                    const serverCounts = response.onlinePlayers.reduce(
                        (counts, player) => {
                            counts[player.server] =
                                (counts[player.server] || 0) + 1;
                            return counts;
                        },
                        {},
                    );

                    // Find the amount on most active servers
                    const maxCount = Math.max(...Object.values(serverCounts));

                    // If the most active server has more than 1 member
                    if (maxCount > 1) {
                        // Filter the most active servers
                        const activeServers = Object.keys(serverCounts).filter(
                            (server) => serverCounts[server] === maxCount,
                        );

                        // Sort activeServers by their WC
                        activeServers.sort((a, b) => {
                            const numA = parseInt(a.replace(/^\D+/g, ''));
                            const numB = parseInt(b.replace(/^\D+/g, ''));

                            return numA - numB;
                        });

                        // If only one server display that, otherwise join them together with /
                        const activeServerValue =
                            activeServers.length === 1
                                ? `${maxCount} players on ${activeServers[0]}.`
                                : `${maxCount} players on ${activeServers.join('/')}.`;

                        responseEmbed.addFields({
                            name: 'Active Server',
                            value: activeServerValue,
                            inline: false,
                        });
                    }

                    let onlinePlayers =
                        '```     Username    ┃    Rank    ┃ Server\n━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━╋━━━━━━━━\n';

                    for (const player of response.onlinePlayers) {
                        onlinePlayers += `${player.username.padEnd(16)} ┃ ${player.guildRank.padEnd(10)} ┃  ${player.server}\n`;
                    }

                    onlinePlayers += '```';

                    responseEmbed.addFields({
                        name: 'Online Players',
                        value: `${onlinePlayers}`,
                    });

                    embeds.push(responseEmbed);
                } else {
                    responseEmbed
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Online Members`,
                        )
                        .setURL(
                            `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                        )
                        .setDescription(
                            `There are currently ${response.onlineCount}/${response.memberCount} players online.`,
                        )
                        .setColor(0x00ffff);

                    // Display a message about players in /stream if the guild online count does not match
                    // the number of online players found
                    const playersInStream =
                        response.onlineCount - response.onlinePlayers.length;

                    if (playersInStream > 0) {
                        const likelyStreamers = await database.getRecentPlayers(
                            response.guildUuid,
                            playersInStream,
                        );
                        let streamers = '';

                        for (const streamer of likelyStreamers) {
                            streamers += `\n${streamer.username} last seen ${utilities.getTimeSince(streamer.lastLogin)}`;
                        }

                        responseEmbed.addFields({
                            name: 'Streamers',
                            value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream !== 1 ? 's' : ''} in /stream.${streamers}`,
                            inline: false,
                        });
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
        }
    },
};
