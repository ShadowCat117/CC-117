const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const sus = require('../../functions/sus');
const fs = require('fs');
const path = require('path');
const configUtils = require('../../functions/config_utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sus')
        .setDescription('Determine the sus level of a player.')
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription(
                    'The name of who you want to check the sus level of.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const username = interaction.options
            .getString('username')
            .replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Calculating sus level for ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await sus(interaction);

        const responseEmbed = new EmbedBuilder();

        if (response.playerUuids !== undefined) {
            // Multiselector
            responseEmbed
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
                    .setCustomId(`sus:${uuid}`)
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
                responseEmbed
                    .setTitle('Invalid username')
                    .setDescription(
                        `Unable to find a player using the name '${username}', try again using the exact player name.`,
                    )
                    .setColor(0xff0000);
            } else {
                // Valid player
                const publicProfileValue = `${response.username} has a ${response.publicProfile ? 'public' : 'private'} profile`;
                let banReason;

                try {
                    const guildId = interaction.guild.id;
                    const filePath = path.join(
                        __dirname,
                        '..',
                        '..',
                        'configs',
                        `${guildId}.json`,
                    );
                    let config = {};

                    if (fs.existsSync(filePath)) {
                        const fileData = fs.readFileSync(filePath, 'utf-8');
                        config = JSON.parse(fileData);

                        banReason = config.bannedPlayers[response.username];
                    } else {
                        await configUtils.createConfig(
                            interaction.client,
                            guildId,
                        );
                    }
                } catch (err) {
                    console.error('Error reading config file', err);
                }

                responseEmbed
                    .setTitle(
                        `Suspiciousness of ${response.username}: ${response.overallSusValue}%`,
                    )
                    .setDescription(
                        'This is calculated from the following stats.',
                    )
                    .setThumbnail(
                        `https://vzge.me/bust/512/${response.uuid}.png`,
                    )
                    .setColor(0x00ffff)
                    .addFields(
                        {
                            name: 'Join Date',
                            value: response.joinSusData,
                            inline: true,
                        },
                        {
                            name: 'Playtime',
                            value: response.playtimeSusData,
                            inline: true,
                        },
                        {
                            name: 'Time Spent Playing',
                            value: response.timeSpentSusData,
                            inline: true,
                        },
                        {
                            name: 'Total Level',
                            value: response.totalLevelSusData,
                            inline: true,
                        },
                        {
                            name: 'Quests Completed',
                            value: response.questsSusData,
                            inline: true,
                        },
                        {
                            name: 'Rank',
                            value: response.rankSusData,
                            inline: true,
                        },
                        {
                            name: 'Public Profile',
                            value: publicProfileValue,
                            inline: false,
                        },
                    );

                if (banReason !== undefined) {
                    responseEmbed.addFields({
                        name: 'Banned from guild',
                        value: banReason,
                    });
                }
            }
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
