const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const activeHours = require('../../functions/active_hours');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activehours')
        .setDescription('View the activity of a guild per hour.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild you want to see the hourly activity for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Loading active hours for ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        let timezoneOffset = 0;
        let sortByActivity = true;
        const preferencesFile = 'preferences.json';

        // Attempt to get the preferred timezone and sort from the user that ran the command
        try {
            let preferences = {};

            if (fs.existsSync(preferencesFile)) {
                const fileData = fs.readFileSync(preferencesFile, 'utf-8');
                preferences = JSON.parse(fileData);

                if (preferences[interaction.member.id]) {
                    timezoneOffset =
                        preferences[interaction.member.id].timezoneOffset;
                    sortByActivity =
                        preferences[interaction.member.id].sortByActivity;
                }
            }
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Failed to get active hours.')
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const response = await activeHours(
            interaction,
            false,
            timezoneOffset,
            sortByActivity,
        );

        if (response.guildUuids !== undefined) {
            // Multiselector
            const responseEmbed = new EmbedBuilder();

            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(
                    `More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following.`,
                )
                .setColor(0x999999);

            const row = new ActionRowBuilder();

            for (let i = 0; i < response.guildUuids.length; i++) {
                const guildPrefix = response.guildPrefixes[i];
                const guildName = response.guildNames[i];

                responseEmbed.addFields({
                    name: `Option ${i + 1}`,
                    value: `[[${guildPrefix}] ${guildName}](https://wynncraft.com/stats/guild/${guildName.replaceAll(' ', '%20')})`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(
                        `active_hours:${response.guildUuids[i]}:${timezoneOffset}:${sortByActivity}`,
                    )
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
                const responseEmbed = new EmbedBuilder();

                responseEmbed
                    .setTitle('Invalid guild')
                    .setDescription(
                        `Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`,
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });

                return;
            } else {
                // Valid guild
                if (response.activity.length === 0) {
                    // No activity
                    const responseEmbed = new EmbedBuilder();

                    responseEmbed
                        .setTitle('No Data')
                        .setDescription(
                            `There is no activity data for ${response.guildName}, try again later.`,
                        )
                        .setColor(0x999999);

                    await interaction.editReply({ embeds: [responseEmbed] });

                    return;
                } else {
                    // Available activity
                    const responseEmbed = new EmbedBuilder();
                    const timezoneRow = new ActionRowBuilder();
                    const sortRow = new ActionRowBuilder();

                    const timezoneSelection = new StringSelectMenuBuilder()
                        .setCustomId('timezone')
                        .setPlaceholder('Select timezone!')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('PST')
                                .setDescription('UTC-8')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-8:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('PDT')
                                .setDescription('UTC-7')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-7:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('MDT')
                                .setDescription('UTC-6')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-6:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('CDT')
                                .setDescription('UTC-5')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-5:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('EDT')
                                .setDescription('UTC-4')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-4:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('BRT')
                                .setDescription('UTC-3')
                                .setValue(
                                    `active_hours:${response.guildUuid}:-3:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('UTC')
                                .setDescription('UTC+0')
                                .setValue(
                                    `active_hours:${response.guildUuid}:0:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('BST')
                                .setDescription('UTC+1')
                                .setValue(
                                    `active_hours:${response.guildUuid}:1:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('CEST')
                                .setDescription('UTC+2')
                                .setValue(
                                    `active_hours:${response.guildUuid}:2:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('MSK')
                                .setDescription('UTC+3')
                                .setValue(
                                    `active_hours:${response.guildUuid}:3:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('GST')
                                .setDescription('UTC+4')
                                .setValue(
                                    `active_hours:${response.guildUuid}:4:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('IST')
                                .setDescription('UTC+5:30')
                                .setValue(
                                    `active_hours:${response.guildUuid}:5.5:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('CST/SNST')
                                .setDescription('UTC+8')
                                .setValue(
                                    `active_hours:${response.guildUuid}:8:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('JST')
                                .setDescription('UTC+9')
                                .setValue(
                                    `active_hours:${response.guildUuid}:9:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('AEST')
                                .setDescription('UTC+10')
                                .setValue(
                                    `active_hours:${response.guildUuid}:10:${sortByActivity}`,
                                ),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('NZST')
                                .setDescription('UTC+12')
                                .setValue(
                                    `active_hours:${response.guildUuid}:12:${sortByActivity}`,
                                ),
                        );

                    timezoneRow.addComponents(timezoneSelection);

                    const activityOrderButton = new ButtonBuilder()
                        .setCustomId(
                            `active_hours:${response.guildUuid}:activity:${timezoneOffset}`,
                        )
                        .setLabel('Sort by activity');

                    const hourOrderButton = new ButtonBuilder()
                        .setCustomId(
                            `active_hours:${response.guildUuid}:time:${timezoneOffset}`,
                        )
                        .setLabel('Sort by time');

                    if (sortByActivity) {
                        activityOrderButton
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);

                        hourOrderButton.setStyle(ButtonStyle.Primary);
                    } else {
                        activityOrderButton.setStyle(ButtonStyle.Primary);

                        hourOrderButton
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);
                    }

                    sortRow.addComponents(activityOrderButton);
                    sortRow.addComponents(hourOrderButton);

                    responseEmbed
                        .setTitle(
                            `[${response.guildPrefix}] ${response.guildName} Active Hours (${response.timezone})`,
                        )
                        .setURL(
                            `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                        )
                        .setColor(0x00ffff);

                    let activity =
                        '``` Hour ┃ Players ┃ Captains\n━━━━━━╋━━━━━━━━━╋━━━━━━━━━\n';

                    for (const hour of response.activity) {
                        activity += `${hour.hour} ┃ ${hour.averageOnline >= 10.0 ? ' ' : '  '}${hour.averageOnline}  ┃ ${hour.averageCaptains >= 10.0 ? ' ' : '  '}${hour.averageCaptains}\n`;
                    }

                    activity += '```';

                    responseEmbed.addFields({
                        name: 'Activity',
                        value: `${activity}`,
                    });

                    await interaction.editReply({
                        components: [timezoneRow, sortRow],
                        embeds: [responseEmbed],
                    });
                }
            }
        }
    },
};
