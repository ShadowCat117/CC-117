const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const playerStats = require('../../functions/player_stats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerstats')
        .setDescription('Display stats about a Wynncraft player.')
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription(
                    'The name of who you want to see stats for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const username = interaction.options
            .getString('username')
            .replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Getting stats for ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await playerStats(interaction);

        if (response.playerUuids !== undefined) {
            // Multiselector
            const responseEmbed = new EmbedBuilder()
                .setTitle('Multiple players found')
                .setDescription(
                    `More than 1 player has the identifier ${username}. Pick the intended player from the following.`,
                )
                .setColor(0x999999);

            const row = new ActionRowBuilder();

            for (let i = 0; i < response.playerUuids.length; i++) {
                let responseValue = '';

                const uuid = response.playerUuids[i];
                const playerUsername = response.playerUsernames[i].replaceAll(
                    '_',
                    '\\_',
                );
                const rank = response.playerRanks[i];
                const guildRank = response.playerGuildRanks[i];
                const playerGuildName = response.playerGuildNames[i];

                if (!rank && !playerGuildName) {
                    responseValue += `${i + 1}. ${playerUsername}.`;
                } else if (!rank) {
                    responseValue += `${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}.`;
                } else if (!playerGuildName) {
                    responseValue += `${i + 1}. ${playerUsername}, ${rank}.`;
                } else {
                    responseValue += `${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}.`;
                }

                responseEmbed.addFields({
                    name: `Option ${i + 1}`,
                    value: `${responseValue} [View Profile](https://wynncraft.com/stats/player/${uuid})`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(`player_stats:${uuid}`)
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
            if (response.username === '') {
                // Unknown player
                const responseEmbed = new EmbedBuilder()
                    .setTitle('Invalid username')
                    .setDescription(
                        `Unable to find a player using the name '${username}', try again using the exact player name.`,
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
            } else {
                const responseEmbed = new EmbedBuilder()
                    .setTitle(`${response.username}'${response.username.endsWith('s') ? '' : 's'} Stats`)
                    .setColor(0x00ffff)
                    .setThumbnail(
                        `https://vzge.me/bust/512/${response.uuid}.png`,
                    )

                let description = `Rank: ${response.supportRank}\n`;
                description += `Last Seen: ${response.lastSeen}\n`;
                description += `Wars: ${response.wars}\n`;
                description += `Total Level: ${response.totalLevel}\n`;
                description += `Total Playtime: ${response.totalPlaytime}\n`;
                description += `Average Weekly Playtime: ${response.weeklyPlaytime}\n`;
                description += `Current Week Playtime: ${response.currentWeekPlaytime}\n\n`;

                if (response.guild) {
                    description += `${response.guild}\n`
                    description += `Rank: ${response.guildRank}\n`;
                    description += `Contribution Rank: ${response.contributionPosition}\n`;
                    description += `Contributed: ${response.contributedXp} XP\n`;
                    description += `Member for: ${response.timeInGuild}`;
                } else {
                    description += 'No guild';
                }

                responseEmbed.setDescription(description);

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        }
    },
};
