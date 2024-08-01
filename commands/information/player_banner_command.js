const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const playerBanner = require('../../functions/player_banner');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerbanner')
        .setDescription('Generate an image with some of your Wynncraft stats.')
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription(
                    'The name of who you want to generate a banner for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const username = interaction.options
            .getString('username')
            .replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Generating banner for ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await playerBanner(interaction);

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
                    .setCustomId(`player_banner:${uuid}`)
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
            } else if (response.banner) {
                if (response.hasAvatar) {
                    await interaction.editReply({
                        embeds: [],
                        files: [response.banner],
                    });
                } else {
                    await interaction.editReply({
                        content: 'Failed to get avatar',
                        embeds: [],
                        files: [response.banner],
                    });
                }
            } else {
                const responseEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        'Failed to generate a banner. Try again later',
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        }
    },
};
