const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const configUtils = require('../../functions/config_utils');
const banPlayer = require('../../functions/ban_player');
const database = require('../../database/database');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banplayer')
        .setDescription(
            "Adds a player to the banned list so they shouldn't be invited to the guild.",
        )
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription(
                    'The name of the player you want to add to the banned list.',
                )
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('Why is this player banned from joining?')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const username = interaction.options
            .getString('username')
            .replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Adding ${username} to the banned list.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

        const errorEmbed = new EmbedBuilder();

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

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const guildUuid = config.guild;

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                errorEmbed
                    .setTitle('Error')
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            if (!guildUuid) {
                errorEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const response = await banPlayer(interaction);

            const responseEmbed = new EmbedBuilder();

            if (response.playerUuids !== undefined) {
                // Multiselector
                responseEmbed
                    .setTitle('Multiple players found')
                    .setDescription(
                        `More than 1 player has the identifier ${username}. Pick the intended player from the following.`,
                    )
                    .setFooter({ text: response.reason })
                    .setColor(0x999999);

                const row = new ActionRowBuilder();

                for (let i = 0; i < response.playerUuids.length; i++) {
                    let responseValue = '';

                    const uuid = response.playerUuids[i];
                    const playerUsername = response.playerUsernames[
                        i
                    ].replaceAll('_', '\\_');
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
                        .setCustomId(`ban_player:${uuid}`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel((i + 1).toString());

                    row.addComponents(button);
                }

                await interaction.editReply({
                    components: [row],
                    embeds: [responseEmbed],
                });

                return;
            } else if (response.error) {
                // Error whilst banning player
                errorEmbed
                    .setTitle('Error')
                    .setDescription(`Unable to ban player: ${response.error}.`)
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
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
                    const guildName = (
                        await database.findGuild(guildUuid, true)
                    ).name;
                    responseEmbed
                        .setTitle(
                            `${response.username} has been banned from ${guildName}`,
                        )
                        .addFields({
                            name: 'Reason',
                            value: `${response.reason}`,
                        })
                        .setColor(0x00ffff);
                }
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error(error);
            errorEmbed
                .setTitle('Error')
                .setDescription('Failed to ban player.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }
    },
};
