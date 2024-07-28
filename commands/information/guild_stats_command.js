const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const guildStats = require('../../functions/guild_stats');
const messages = require('../../functions/messages');
const utilities = require('../../functions/utilities');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guildstats')
        .setDescription('View the stats for a specific guild.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild you want to see stats for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Fetching guild stats for ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const embeds = [];
        const row = new ActionRowBuilder();

        const response = await guildStats(interaction);

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
                    .setCustomId(`guild_stats:${response.guildUuids[i]}`)
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
                // If more than 5 members then paginate
                if (response.members.length > 5) {
                    const pages = [];
                    for (let i = 0; i < response.members.length; i += 5) {
                        pages.push(response.members.slice(i, i + 5));
                    }

                    for (const page of pages) {
                        const responseEmbed = new EmbedBuilder()
                            .setTitle(
                                `[${response.guildPrefix}] ${response.guildName} Stats`,
                            )
                            .setColor(0x00ffff);

                        let description = `Level: ${response.level} (${response.xpPercent}%)\n`;
                        description += `Held Territories: ${response.territories}\n`;

                        if (response.currentRating !== -1) {
                            description += `Season Rating: ${response.currentRating}\n`;
                        }

                        if (response.previousRating !== -1) {
                            description += `Previous Rating: ${response.previousRating}\n`;
                        }

                        description += `Wars: ${response.wars}\n`;
                        description += `XP/day: ${utilities.getFormattedXPPerDay(response.averageXpPerDay)}\n`;
                        description += `Total weekly playtime: ${response.totalPlaytime} hour${response.totalPlaytime !== 1 ? 's' : ''}`;

                        responseEmbed.setDescription(description);

                        for (const member of page) {
                            let memberDetails = `${member.getOnlineStatus()}\n`;
                            memberDetails += `Joined ${utilities.getTimeSince(member.joinDate)} ago\n`;
                            memberDetails += `${member.localeContributed} XP (${utilities.getFormattedXPPerDay(member.contributed, member.joinDate)})\n`;
                            memberDetails += `${member.wars} war${member.wars !== 1 ? 's' : ''}\n`;
                            memberDetails += `${member.averagePlaytime} hours per week`;

                            responseEmbed.addFields({
                                name: `${member.contributionRank}. ${member.username} (${member.guildRank})`,
                                value: `${memberDetails}`,
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
                    const responseEmbed = new EmbedBuilder()
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Stats`,
                        )
                        .setColor(0x00ffff);

                    let description = `Level: ${response.level} (${response.xpPercent}%)\n`;
                    description += `Held Territories: ${response.territories}\n`;

                    if (response.currentRating !== -1) {
                        description += `Season Rating: ${response.currentRating}\n`;
                    }

                    if (response.previousRating !== -1) {
                        description += `Previous Rating: ${response.previousRating}\n`;
                    }

                    description += `Wars: ${response.wars}\n`;
                    description += `XP/day: ${utilities.getFormattedXPPerDay(response.averageXpPerDay)}\n`;
                    description += `Total weekly playtime: ${response.totalPlaytime} hour${response.totalPlaytime !== 1 ? 's' : ''}`;

                    responseEmbed.setDescription(description);

                    for (const member of response.members) {
                        let memberDetails = `${member.getOnlineStatus()}\n`;
                        memberDetails += `Joined ${utilities.getTimeSince(member.joinDate)} ago\n`;
                        memberDetails += `${member.localeContributed} XP (${utilities.getFormattedXPPerDay(member.contributed, member.joinDate)})\n`;
                        memberDetails += `${member.wars} war${member.wars !== 1 ? 's' : ''}\n`;
                        memberDetails += `${member.averagePlaytime} hours per week`;

                        responseEmbed.addFields({
                            name: `${member.username} (${member.guildRank})`,
                            value: `${memberDetails}`,
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
