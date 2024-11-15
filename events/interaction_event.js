const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Events,
    EmbedBuilder,
} = require('discord.js');
const PagedMessage = require('../message_objects/PagedMessage');
const PromotionValue = require('../values/PromotionValue');
const utilities = require('../functions/utilities');
const lastLogins = require('../functions/last_logins');
const online = require('../functions/online');
const guildStats = require('../functions/guild_stats');
const addAlly = require('../functions/add_ally');
const removeAlly = require('../functions/remove_ally');
const trackGuild = require('../functions/track_guild');
const untrackGuild = require('../functions/untrack_guild');
const setGuild = require('../functions/set_guild');
const sus = require('../functions/sus');
const activeHours = require('../functions/active_hours');
const updateGuildMembers = require('../functions/update_guild_members');
const fs = require('fs');
const path = require('path');
const createConfig = require('../functions/create_config');
const promotionProgress = require('../functions/promotion_progress');
const verify = require('../functions/verify');
const addDemotionException = require('../functions/add_demotion_exception');
const addInactivityException = require('../functions/add_inactivity_exception');
const addPromotionException = require('../functions/add_promotion_exception');
const removeDemotionException = require('../functions/remove_demotion_exception');
const removeInactivityException = require('../functions/remove_inactivity_exception');
const removePromotionException = require('../functions/remove_promotion_exception');
const updatePlayer = require('../functions/update_player');
const banPlayer = require('../functions/ban_player');
const unbanPlayer = require('../functions/unban_player');
const messages = require('../functions/messages');
const database = require('../database/database');
const playerBanner = require('../functions/player_banner');
const playerStats = require('../functions/player_stats');

const warriorArchetypes = ['fallen', 'battleMonk', 'paladin'];
const mageArchetypes = ['riftwalker', 'lightBender', 'arcanist'];
const archerArchetypes = ['sharpshooter', 'trapper', 'boltslinger'];
const shamanArchetypes = ['ritualist', 'summoner', 'acolyte'];
const assassinArchetypes = ['acrobat', 'shadestepper', 'trickster'];
const archetypes = warriorArchetypes.concat(
    mageArchetypes,
    archerArchetypes,
    shamanArchetypes,
    assassinArchetypes,
);

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        try {
            // If the interaction was not a button or string select menu
            // we don't need to do anything
            if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
                return;
            }

            await interaction.deferUpdate();

            const guildId = interaction.guild.id;
            const directoryPath = path.join(__dirname, '..', 'configs');
            const filePath = path.join(directoryPath, `${guildId}.json`);

            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            try {
                // Button interactions
                if (interaction.isButton()) {
                    const parts = interaction.customId.split(':');
                    const functionToRun = parts[0];

                    switch (functionToRun) {
                        case 'previous': {
                            const message = messages.getMessage(
                                interaction.message.id,
                            );

                            if (message) {
                                await interaction.editReply({
                                    embeds: [
                                        messages
                                            .getMessage(interaction.message.id)
                                            .getPreviousPage(),
                                    ],
                                });
                            } else {
                                const expiredEmbed = new EmbedBuilder()
                                    .setTitle('Data expired')
                                    .setDescription(
                                        'Please run this command again.',
                                    );

                                await interaction.editReply({
                                    embeds: [expiredEmbed],
                                });
                            }

                            break;
                        }
                        case 'next': {
                            const message = messages.getMessage(
                                interaction.message.id,
                            );

                            if (message) {
                                await interaction.editReply({
                                    embeds: [
                                        messages
                                            .getMessage(interaction.message.id)
                                            .getNextPage(),
                                    ],
                                });
                            } else {
                                const expiredEmbed = new EmbedBuilder()
                                    .setTitle('Data expired')
                                    .setDescription(
                                        'Please run this command again.',
                                    );

                                await interaction.editReply({
                                    embeds: [expiredEmbed],
                                });
                            }

                            break;
                        }
                        case 'active_hours': {
                            const activeHoursFunction = parts[2];

                            let timezoneOffset;
                            let sortByActivity;

                            switch (activeHoursFunction) {
                                case 'activity': {
                                    const loadingEmbed = new EmbedBuilder()
                                        .setDescription('Sorting by activity.')
                                        .setColor(0x00ff00);

                                    await interaction.editReply({
                                        components: [],
                                        embeds: [loadingEmbed],
                                    });

                                    timezoneOffset = parts[3];
                                    sortByActivity = true;

                                    break;
                                }
                                case 'time': {
                                    const loadingEmbed = new EmbedBuilder()
                                        .setDescription('Sorting by time.')
                                        .setColor(0x00ff00);

                                    await interaction.editReply({
                                        components: [],
                                        embeds: [loadingEmbed],
                                    });

                                    timezoneOffset = parts[3];
                                    sortByActivity = false;

                                    break;
                                }
                                default: {
                                    const loadingEmbed = new EmbedBuilder()
                                        .setDescription(
                                            'Looking up active hours for selected guild.',
                                        )
                                        .setColor(0x00ff00);

                                    await interaction.editReply({
                                        components: [],
                                        embeds: [loadingEmbed],
                                    });

                                    timezoneOffset = parts[2];
                                    sortByActivity = parts[3];

                                    break;
                                }
                            }

                            try {
                                const preferencesFile = 'preferences.json';

                                let preferences = {};

                                if (fs.existsSync(preferencesFile)) {
                                    const fileData = fs.readFileSync(
                                        preferencesFile,
                                        'utf-8',
                                    );
                                    preferences = JSON.parse(fileData);
                                } else {
                                    await fs.writeFileSync(
                                        preferencesFile,
                                        JSON.stringify(preferences, null, 2),
                                        'utf-8',
                                    );
                                }

                                preferences[interaction.user.id] = {
                                    timezoneOffset: timezoneOffset,
                                    sortByActivity: sortByActivity,
                                };

                                await fs.writeFileSync(
                                    preferencesFile,
                                    JSON.stringify(preferences, null, 2),
                                    'utf-8',
                                );
                            } catch (error) {
                                console.error(
                                    'Failed to save timezone and activity preferences: ',
                                    error,
                                );
                            }

                            const response = await activeHours(
                                interaction,
                                true,
                                timezoneOffset,
                                sortByActivity,
                            );

                            if (response.activity.length === 0) {
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle('No Data')
                                    .setDescription(
                                        `There is no activity data for ${response.guildName}, try again later.`,
                                    )
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });

                                return;
                            } else {
                                const responseEmbed = new EmbedBuilder();
                                const timezoneRow = new ActionRowBuilder();
                                const sortRow = new ActionRowBuilder();

                                const timezoneSelection =
                                    new StringSelectMenuBuilder()
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

                                    hourOrderButton.setStyle(
                                        ButtonStyle.Primary,
                                    );
                                } else {
                                    activityOrderButton.setStyle(
                                        ButtonStyle.Primary,
                                    );

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

                            break;
                        }
                        case 'add_ally': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Adding selected guild as ally.',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addAlly(interaction, true);

                            if (response.error) {
                                // Failed to add ally
                                const responseEmbed = new EmbedBuilder()
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            } else {
                                const responseEmbed = new EmbedBuilder()
                                    .setTitle('Successfully added ally')
                                    .setDescription(
                                        `${response.guildName} is now an allied guild.`,
                                    )
                                    .setColor(0x00ffff);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });

                                if (config.logMessages && config.logChannel) {
                                    const logEmbed = new EmbedBuilder()
                                        .setColor(0x00ffff)
                                        .setTitle(
                                            `${response.guildName} has been added as an ally`,
                                        )
                                        .addFields({
                                            name: 'Added by',
                                            value: `${interaction.member}`,
                                        });

                                    const channel =
                                        interaction.guild.channels.cache.get(
                                            config.logChannel,
                                        );

                                    if (channel) {
                                        try {
                                            await channel.send({
                                                embeds: [logEmbed],
                                            });
                                        } catch (error) {
                                            console.error(
                                                `Failed to send added ally message to channel ${config.logChannel} in guild ${interaction.guild.id}`,
                                            );
                                        }
                                    } else {
                                        console.log(
                                            `${config.logChannel} not found for guild ${interaction.guild.id}`,
                                        );
                                    }
                                }
                            }

                            break;
                        }
                        case 'add_demotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Adding demotion exception for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addDemotionException(
                                interaction,
                                true,
                                interaction.message.embeds[0].footer.text,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Failed to add demotion exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to add demotion exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                let duration;

                                if (response.duration === -1) {
                                    duration = 'Exempt from demotions forever';
                                } else {
                                    duration = `Exempt from demotions for ${response.duration} day${response.duration !== 1 ? 's' : ''}`;
                                }

                                responseEmbed
                                    .setTitle(
                                        `${response.username} is now exempt from demotions`,
                                    )
                                    .addFields({
                                        name: 'Duration',
                                        value: `${duration}`,
                                    })
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'add_inactivity_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Adding inactivity exception for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addInactivityException(
                                interaction,
                                true,
                                interaction.message.embeds[0].footer.text,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Failed to add inactivity exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to add inactivity exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                let duration;

                                if (response.duration === -1) {
                                    duration = 'Exempt from inactivity forever';
                                } else {
                                    duration = `Allowed to be inactive for ${response.duration} day${response.duration !== 1 ? 's' : ''}`;
                                }

                                responseEmbed
                                    .setTitle(
                                        `${response.username} now has a custom inactivity threshold`,
                                    )
                                    .addFields({
                                        name: 'Duration',
                                        value: `${duration}`,
                                    })
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'add_promotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Adding promotion exception for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addPromotionException(
                                interaction,
                                true,
                                interaction.message.embeds[0].footer.text,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Failed to add promotion exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to add promotion exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                let duration;

                                if (response.duration === -1) {
                                    duration = 'Exempt from promotions forever';
                                } else {
                                    duration = `Exempt from promotions for ${response.duration} day${response.duration !== 1 ? 's' : ''}`;
                                }

                                responseEmbed
                                    .setTitle(
                                        `${response.username} is now exempt from promotions`,
                                    )
                                    .addFields({
                                        name: 'Duration',
                                        value: `${duration}`,
                                    })
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'ban_player': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Banning selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await banPlayer(
                                interaction,
                                true,
                                interaction.message.embeds[0].footer.text,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Failed to ban player
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to ban player: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.username} has been banned from your guild`,
                                    )
                                    .addFields({
                                        name: 'Reason',
                                        value: `${response.reason}`,
                                    })
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'guild_stats': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Loading stats for selected guild',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await guildStats(
                                interaction,
                                true,
                            );

                            const embeds = [];
                            const row = new ActionRowBuilder();

                            // Paginate if more than 5 members
                            if (response.members.length > 5) {
                                const pages = [];
                                for (
                                    let i = 0;
                                    i < response.members.length;
                                    i += 5
                                ) {
                                    pages.push(
                                        response.members.slice(i, i + 5),
                                    );
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
                                        memberDetails += `${member.averagePlaytime} hours per week (${member.weeklyPlaytime})`;

                                        responseEmbed.addFields({
                                            name: `${member.contributionRank}. ${member.username} (${member.guildRank})`,
                                            value: `${memberDetails}`,
                                        });
                                    }

                                    embeds.push(responseEmbed);
                                }

                                messages.addMessage(
                                    interaction.message.id,
                                    new PagedMessage(
                                        interaction.message,
                                        embeds,
                                    ),
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
                                    memberDetails += `${member.averagePlaytime} hours per week (${member.weeklyPlaytime})`;

                                    responseEmbed.addFields({
                                        name: `${member.username} (${member.guildRank})`,
                                        value: `${memberDetails}`,
                                    });
                                }

                                embeds.push(responseEmbed);
                            }

                            if (row.components.length > 0) {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                    components: [row],
                                });
                            } else {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                });
                            }

                            break;
                        }
                        case 'last_logins': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Loading last logins for selected guild',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await lastLogins(
                                interaction,
                                true,
                            );

                            const embeds = [];
                            const row = new ActionRowBuilder();

                            // Paginate if more than 16 members
                            if (response.playerLastLogins.length > 16) {
                                const pages = [];
                                for (
                                    let i = 0;
                                    i < response.playerLastLogins.length;
                                    i += 16
                                ) {
                                    pages.push(
                                        response.playerLastLogins.slice(
                                            i,
                                            i + 16,
                                        ),
                                    );
                                }

                                for (const page of pages) {
                                    const responseEmbed = new EmbedBuilder()
                                        .setTitle(
                                            `[${response.guildPrefix}] ${response.guildName} Last Logins`,
                                        )
                                        .setDescription(
                                            'Players marPlayers marked with a * have a custom inactivity thresholdrom inactivity',
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
                                                utilities.getTimeSince(
                                                    player.lastLogin,
                                                ) + ' ago';
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
                                    interaction.message.id,
                                    new PagedMessage(
                                        interaction.message,
                                        embeds,
                                    ),
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
                                                utilities.getTimeSince(
                                                    player.lastLogin,
                                                ) + ' ago';
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

                            if (row.components.length > 0) {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                    components: [row],
                                });
                            } else {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                });
                            }

                            break;
                        }
                        case 'online': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Checking online players for selected guild',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await online(interaction, true);

                            const responseEmbed = new EmbedBuilder();

                            const embeds = [];
                            const row = new ActionRowBuilder();

                            // Paginate if more than 20 players online
                            if (response.onlinePlayers.length > 20) {
                                const pages = [];
                                for (
                                    let i = 0;
                                    i < response.onlinePlayers.length;
                                    i += 20
                                ) {
                                    pages.push(
                                        response.onlinePlayers.slice(i, i + 20),
                                    );
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
                                    const serverCounts =
                                        response.onlinePlayers.reduce(
                                            (counts, player) => {
                                                counts[player.server] =
                                                    (counts[player.server] ||
                                                        0) + 1;
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
                                            (server) =>
                                                serverCounts[server] ===
                                                maxCount,
                                        );

                                        // Sort activeServers by their WC
                                        activeServers.sort((a, b) => {
                                            const numA = parseInt(
                                                a.replace(/^\D+/g, ''),
                                            );
                                            const numB = parseInt(
                                                b.replace(/^\D+/g, ''),
                                            );

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
                                            streamers += `\n${streamer.username.replaceAll('_', '\\_')} last seen ${utilities.getTimeSince(streamer.lastLogin)} ago`;
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
                                    interaction.message.id,
                                    new PagedMessage(
                                        interaction.message,
                                        embeds,
                                    ),
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
                                        streamers += `\n${streamer.username.replaceAll('_', '\\_')} last seen ${utilities.getTimeSince(streamer.lastLogin)} ago`;
                                    }

                                    responseEmbed.addFields({
                                        name: 'Streamers',
                                        value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream !== 1 ? 's' : ''} in /stream.${streamers}`,
                                        inline: false,
                                    });
                                }

                                // Count the number of players on each server
                                const serverCounts =
                                    response.onlinePlayers.reduce(
                                        (counts, player) => {
                                            counts[player.server] =
                                                (counts[player.server] || 0) +
                                                1;
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
                                        (server) =>
                                            serverCounts[server] === maxCount,
                                    );

                                    // Sort activeServers by their WC
                                    activeServers.sort((a, b) => {
                                        const numA = parseInt(
                                            a.replace(/^\D+/g, ''),
                                        );
                                        const numB = parseInt(
                                            b.replace(/^\D+/g, ''),
                                        );

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
                                        streamers += `\n${streamer.username.replaceAll('_', '\\_')} last seen ${utilities.getTimeSince(streamer.lastLogin)} ago`;
                                    }

                                    responseEmbed.addFields({
                                        name: 'Streamers',
                                        value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream !== 1 ? 's' : ''} in /stream.${streamers}`,
                                        inline: false,
                                    });
                                }

                                embeds.push(responseEmbed);
                            }

                            if (row.components.length > 0) {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                    components: [row],
                                });
                            } else {
                                await interaction.editReply({
                                    embeds: [embeds[0]],
                                });
                            }

                            break;
                        }
                        case 'player_banner': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Generating banner for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await playerBanner(
                                interaction,
                                true,
                            );

                            if (response.banner) {
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

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            }

                            break;
                        }
                        case 'player_stats': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Fetching stats for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await playerStats(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder()
                                .setTitle(
                                    `${response.username}'${response.username.endsWith('s') ? '' : 's'} Stats`,
                                )
                                .setColor(0x00ffff)
                                .setThumbnail(
                                    `https://vzge.me/bust/512/${response.uuid}.png`,
                                );

                            let description = `Rank: ${response.supportRank}\n`;
                            description += `Last Seen: ${response.lastSeen}\n`;
                            description += `Wars: ${response.wars}\n`;
                            description += `Total Level: ${response.totalLevel}\n`;
                            description += `Total Playtime: ${response.totalPlaytime}\n`;
                            description += `Average Weekly Playtime: ${response.weeklyPlaytime}\n`;
                            description += `Current Week Playtime: ${response.currentWeekPlaytime}\n\n`;

                            if (response.guild) {
                                description += `${response.guild}\n`;
                                description += `Rank: ${response.guildRank}\n`;
                                description += `Contribution Rank: ${response.contributionPosition}\n`;
                                description += `Contributed: ${response.contributedXp} XP\n`;
                                description += `Member for: ${response.timeInGuild}`;
                            } else {
                                description += 'No guild';
                            }

                            responseEmbed.setDescription(description);

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'promotion_progress': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Finding promotion progress for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await promotionProgress(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.uuid) {
                                responseEmbed.setThumbnail(
                                    `https://vzge.me/bust/512/${response.uuid}.png`,
                                );
                            }

                            if (response.unableToPromote) {
                                const reason = response.unableToPromote;
                                const guildName = await database.findGuild(
                                    config.guild,
                                    true,
                                );

                                switch (reason) {
                                    case 'error': // Some kind of error
                                        responseEmbed.setDescription(
                                            'An error occured whilst checking for promotion progress.',
                                        );
                                        break;
                                    case 'missing': // Not enough requirements given for the required count
                                        responseEmbed.setDescription(
                                            'Missing values for promotions. Configuration has not been set up fully.',
                                        );
                                        break;
                                    case 'guild': // Not in the set guild
                                        responseEmbed.setDescription(
                                            `${response.username} is not a member of ${guildName}.`,
                                        );
                                        break;
                                    case 'owner': // Owner can't be promoted
                                        responseEmbed.setDescription(
                                            `${response.username} is the Owner of ${guildName}. They are unable to be promoted.`,
                                        );
                                        break;
                                    case 'chief': // Chief can't be promoted by anyone other than owner
                                        responseEmbed.setDescription(
                                            `${response.username} is a Chief of ${guildName}. Only the Owner can decide if they should be promoted.`,
                                        );
                                        break;
                                    default: // Exempt from promotion
                                        if (response.unableToPromote === -1) {
                                            responseEmbed.setDescription(
                                                `${response.username} is exempt from promotions forever.`,
                                            );
                                        } else if (
                                            response.unableToPromote >= 0
                                        ) {
                                            responseEmbed.setDescription(
                                                `${response.username} is exempt from promotion for ${response.unableToPromote} day${response.unableToPromote !== 1 ? 's' : ''}.`,
                                            );
                                        } else {
                                            responseEmbed.setDescription(
                                                "Secret response that totally isn't an unexpected issue haha...",
                                            );
                                        }
                                        break;
                                }

                                responseEmbed
                                    .setTitle(response.username)
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.guildRank} ${response.username.replaceAll('_', '\\_')} has ${response.metForcedRequirements}/${response.forcedRequirementsCount} mandatory requirements and ${response.metRequirements}/${response.requirementsCount} optional requirements for ${response.nextGuildRank}`,
                                    )
                                    .setColor(0x00ffff);

                                responseEmbed.addFields({
                                    name: 'Mandatory Requirements',
                                    value: 'You must meet these to be eligible for this promotion.',
                                });

                                const daysInGuildColour =
                                    response.daysInGuild >=
                                    response.timeRequirement
                                        ? '🟢'
                                        : '🔴';

                                responseEmbed.addFields({
                                    name: `${daysInGuildColour} Days in Guild`,
                                    value: `${response.daysInGuild}/${response.timeRequirement}`,
                                });

                                if (response.verifiedRequirement) {
                                    const verifiedColour =
                                        response.hasVerifiedRole ? '🟢' : '🔴';

                                    responseEmbed.addFields({
                                        name: `${verifiedColour} Verified`,
                                        value: `${response.hasVerifiedRole ? 'Is verified' : 'Is not verified'}`,
                                    });
                                }

                                responseEmbed.addFields({
                                    name: 'Optional Requirements',
                                    value: `You must meet ${response.requirementsCount} of these to be eligible for this promotion.`,
                                });

                                for (const requirement of response.requirements) {
                                    let requirementColour =
                                        requirement.current >=
                                        requirement.required
                                            ? '🟢'
                                            : '🔴';

                                    switch (requirement.promotionType) {
                                        case PromotionValue.XP:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} XP Contributed`,
                                                value: `${requirement.current.toLocaleString()}/${requirement.required.toLocaleString()}`,
                                            });
                                            break;
                                        case PromotionValue.LEVEL:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Highest Character Level`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                        case PromotionValue.TOP:
                                            requirementColour =
                                                requirement.current <=
                                                requirement.required
                                                    ? '🟢'
                                                    : '🔴';
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Contribution Position`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                        case PromotionValue.TIME:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Days in Guild`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                        case PromotionValue.WARS:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Wars Completed (Total)`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                        case PromotionValue.BUILD:
                                            requirementColour =
                                                requirement.current === 1
                                                    ? '🟢'
                                                    : '🔴';
                                            responseEmbed.addFields({
                                                name: `${requirementColour} War Build`,
                                                value: `${requirement.current === 1 ? 'Has a war build' : 'Does not have a war build'}`,
                                            });
                                            break;
                                        case PromotionValue.PLAYTIME:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Average Playtime per Week (hours)`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                        case PromotionValue.ECO:
                                            requirementColour =
                                                requirement.current === 1
                                                    ? '🟢'
                                                    : '🔴';
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Eco`,
                                                value: `${requirement.current === 1 ? 'Knows/is learning eco' : 'Does not know/is not learning eco'}`,
                                            });
                                            break;
                                        default:
                                            responseEmbed.addFields({
                                                name: `${requirementColour} Unexpected promotion type ${requirement.promotionType}`,
                                                value: `${requirement.current}/${requirement.required}`,
                                            });
                                            break;
                                    }
                                }
                            }

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'remove_ally': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Removing selected guild from allies.',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await removeAlly(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error whilst removing ally
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            } else {
                                responseEmbed
                                    .setTitle('Successfully removed ally')
                                    .setDescription(
                                        `${response.guildName} is no longer an allied guild.`,
                                    )
                                    .setColor(0x00ffff);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });

                                if (config.logMessages && config.logChannel) {
                                    const logEmbed = new EmbedBuilder()
                                        .setColor(0x00ffff)
                                        .setTitle(
                                            `${response.guildName} has been removed from allies`,
                                        )
                                        .addFields({
                                            name: 'Removed by',
                                            value: `${interaction.member}`,
                                        });

                                    const channel =
                                        interaction.guild.channels.cache.get(
                                            config.logChannel,
                                        );

                                    if (channel) {
                                        try {
                                            await channel.send({
                                                embeds: [logEmbed],
                                            });
                                        } catch (error) {
                                            console.error(
                                                `Failed to send removed ally message to channel ${config.logChannel} in guild ${interaction.guild.id}`,
                                            );
                                        }
                                    } else {
                                        console.log(
                                            `${config.logChannel} not found for guild ${interaction.guild.id}`,
                                        );
                                    }
                                }
                            }

                            break;
                        }
                        case 'remove_demotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Removing demotion exception from selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await removeDemotionException(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error whilst removing demotion exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to remove demotion exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.username} is no longer exempt from demotion.`,
                                    )
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'remove_inactivity_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Removing inactivity exception from selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await removeInactivityException(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error removing inactivity exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to remove inactivity exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.username} is no longer exempt from inactivity.`,
                                    )
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'remove_promotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Removing promotion exception from selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await removePromotionException(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error removing promotion exception
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to remove promotion exception: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.username} is no longer exempt from promotion.`,
                                    )
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'set_guild': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Setting guild to selected guild.',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await setGuild(interaction, true);
                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error setting guild
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            } else {
                                responseEmbed
                                    .setTitle('Successfully set guild')
                                    .setDescription(
                                        `You are now representing ${response.guildName}`,
                                    )
                                    .setColor(0x00ffff);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            }

                            break;
                        }
                        case 'sus': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Calculating sus level for selected player',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await sus(interaction, true);

                            const publicProfileValue = `${response.username} has a ${response.publicProfile ? 'public' : 'private'} profile`;

                            const responseEmbed = new EmbedBuilder()
                                .setTitle(
                                    `Suspiciousness of ${response.username}: ${response.overallSusValue}%`,
                                )
                                .setDescription(
                                    'This is calculated from the following stats',
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

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'track_guild': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Tracking selected guild.')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await trackGuild(
                                interaction,
                                true,
                            );
                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error tracking guild
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            } else {
                                responseEmbed
                                    .setTitle('Successfully tracked guild')
                                    .setDescription(
                                        `${response.guildName} is now being tracked.`,
                                    )
                                    .setColor(0x00ffff);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            }

                            break;
                        }
                        case 'unban_player': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Unbanning selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await unbanPlayer(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error unbanning player
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(
                                        `Unable to unban player: ${response.error}`,
                                    )
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(
                                        `${response.username} has been unbanned from your guild`,
                                    )
                                    .setColor(0x00ffff);
                            }

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'untrack_guild': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Untracking selected guild.')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await untrackGuild(
                                interaction,
                                true,
                            );
                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                // Error untracking guild
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            } else {
                                responseEmbed
                                    .setTitle('Successfully untracked guild')
                                    .setDescription(
                                        `${response.guildName} is no longer being tracked.`,
                                    )
                                    .setColor(0x00ffff);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });
                            }

                            break;
                        }
                        case 'update_guild_members': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription(
                                    'Updating guild members for selected guild',
                                )
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await updateGuildMembers(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder()
                                .setTitle(
                                    `[${response.guildPrefix}] ${response.guildName} Members Updated`,
                                )
                                .setURL(
                                    `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                                )
                                .setDescription(
                                    'Stored stats for guild members (used in updating roles and checking for guild wide promotions/demotions) will be updated soon!',
                                )
                                .setColor(0x00ffff);

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'update_player': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Updating selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await updatePlayer(
                                interaction,
                                true,
                            );

                            const responseEmbed = new EmbedBuilder()
                                .setTitle(`Updated ${response.username}`)
                                .setDescription(
                                    'Updated all known information about player, guild wide promotion/demotion check and role applying should now be accurate for this player.',
                                )
                                .setColor(0x00ffff);

                            await interaction.editReply({
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'verify': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Verifying as selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await verify(interaction, true);

                            const responseEmbed = new EmbedBuilder();

                            if (
                                response.updates.length > 0 ||
                                response.errors.length > 0
                            ) {
                                // Changes made
                                responseEmbed
                                    .setTitle(
                                        `Verified as ${response.username}`,
                                    )
                                    .setColor(0x00ffff);

                                let appliedChanges = 'Applied changes: \n';

                                for (const update of response.updates) {
                                    appliedChanges += `${update}\n`;
                                }

                                for (const error of response.errors) {
                                    appliedChanges += `${error}\n`;
                                }

                                responseEmbed.setDescription(appliedChanges);
                            } else {
                                // No changes
                                responseEmbed
                                    .setTitle(
                                        `Verified as ${response.username}`,
                                    )
                                    .setDescription('No changes')
                                    .setColor(0x999999);
                            }

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });

                            // If changes made and log channel feature enabled then send message there
                            if (
                                response.updates.length > 0 ||
                                (response.errors.length > 0 &&
                                    config.logMessages &&
                                    config.logChannel)
                            ) {
                                responseEmbed
                                    .setTitle(
                                        `${interaction.member.user.username} has verified as ${response.username}`,
                                    )
                                    .addFields({
                                        name: 'User',
                                        value: `${interaction.member}`,
                                    });

                                const channel =
                                    interaction.guild.channels.cache.get(
                                        config.logChannel,
                                    );

                                if (channel) {
                                    try {
                                        await channel.send({
                                            embeds: [responseEmbed],
                                        });
                                    } catch (error) {
                                        console.error(
                                            `Failed to send verification message to channel ${config.logChannel} in guild ${interaction.guild.id}`,
                                        );
                                    }
                                } else {
                                    console.log(
                                        `${config.logChannel} not found for guild ${interaction.guild.id}`,
                                    );
                                }
                            }

                            break;
                        }
                        default: {
                            // Here we expect functionToRun to be one of the interactions with the war, class, giveaway or events buttons
                            if (interaction.customId === 'war') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add war role if they don't already have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    const tankButton = new ButtonBuilder()
                                        .setCustomId('tank')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setLabel('Tank');

                                    const healerButton = new ButtonBuilder()
                                        .setCustomId('healer')
                                        .setStyle(ButtonStyle.Success)
                                        .setLabel('Healer');

                                    const damageButton = new ButtonBuilder()
                                        .setCustomId('damage')
                                        .setStyle(ButtonStyle.Danger)
                                        .setLabel('Damage');

                                    const soloButton = new ButtonBuilder()
                                        .setCustomId('solo')
                                        .setStyle(ButtonStyle.Primary)
                                        .setLabel('Solo');

                                    const ecoButton = new ButtonBuilder()
                                        .setCustomId('eco')
                                        .setStyle(ButtonStyle.Success)
                                        .setLabel('Eco');

                                    const warPingButton = new ButtonBuilder()
                                        .setCustomId('warping')
                                        .setStyle(ButtonStyle.Danger)
                                        .setLabel('War Ping');

                                    const removeButton = new ButtonBuilder()
                                        .setCustomId('removewar')
                                        .setStyle(ButtonStyle.Danger)
                                        .setLabel('Remove');

                                    const rolesRow =
                                        new ActionRowBuilder().addComponents(
                                            tankButton,
                                            healerButton,
                                            damageButton,
                                            soloButton,
                                            ecoButton,
                                        );
                                    const removeRow =
                                        new ActionRowBuilder().addComponents(
                                            warPingButton,
                                            removeButton,
                                        );

                                    const warMessage = config[
                                        'warClassMessage'
                                    ].replace(/\\n/g, '\n');

                                    await interaction.followUp({
                                        content: warMessage,
                                        ephemeral: true,
                                        components: [rolesRow, removeRow],
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'tank') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const tankRole =
                                        interaction.guild.roles.cache.get(
                                            config['tankRole'],
                                        );

                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add warRole role if they don't already have
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    let replyMessage;

                                    // If they have the tank role, remove it, otherwise add it
                                    if (memberRoles.has(tankRole.id)) {
                                        await interaction.member.roles
                                            .remove(tankRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed tank role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove tank role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${tankRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(tankRole)
                                            .then(() => {
                                                console.log(
                                                    `Added tank role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add tank role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${tankRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'healer') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const healerRole =
                                        interaction.guild.roles.cache.get(
                                            config['healerRole'],
                                        );

                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add war role if they don't already have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    let replyMessage;

                                    // Add healer role or remove if they already have it
                                    if (memberRoles.has(healerRole.id)) {
                                        await interaction.member.roles
                                            .remove(healerRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed healer role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove healer role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${healerRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(healerRole)
                                            .then(() => {
                                                console.log(
                                                    `Added healer role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add healer role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${healerRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'damage') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const damageRole =
                                        interaction.guild.roles.cache.get(
                                            config['damageRole'],
                                        );

                                    // Get war role
                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add war role if they don't already have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    let replyMessage;

                                    // Remove damage role if they have it, otherwise add it
                                    if (memberRoles.has(damageRole.id)) {
                                        await interaction.member.roles
                                            .remove(damageRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed damage role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove damage role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${damageRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(damageRole)
                                            .then(() => {
                                                console.log(
                                                    `Added damage role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add damage role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${damageRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'solo') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const soloRole =
                                        interaction.guild.roles.cache.get(
                                            config['soloRole'],
                                        );

                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add war role if they don't already have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    let replyMessage;

                                    // Add solo role if they don't have it, otherwise remove it
                                    if (memberRoles.has(soloRole.id)) {
                                        await interaction.member.roles
                                            .remove(soloRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed solo role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove solo role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${soloRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(soloRole)
                                            .then(() => {
                                                console.log(
                                                    `Added solo role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add solo role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${soloRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'eco') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );

                                    // Add war role if they don't already have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    const ecoRole =
                                        interaction.guild.roles.cache.get(
                                            config['ecoRole'],
                                        );

                                    let replyMessage;

                                    // Remove eco role if they have it, otherwise add it
                                    if (memberRoles.has(ecoRole.id)) {
                                        await interaction.member.roles
                                            .remove(ecoRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed eco role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove eco role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${ecoRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(ecoRole)
                                            .then(() => {
                                                console.log(
                                                    `Added eco role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add eco role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${ecoRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'warping') {
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );
                                const levelRequirement =
                                    config['warLevelRequirement'];

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const validLevelRoles = [];

                                for (const level of Object.keys(
                                    config['levelRoles'],
                                )) {
                                    if (level >= levelRequirement) {
                                        validLevelRoles.push(
                                            interaction.guild.roles.cache.get(
                                                config['levelRoles'][level],
                                            ),
                                        );
                                    }
                                }

                                let validLevel = false;

                                // Check all roles above minimum requirement and if the member has them
                                // they are the valid level for getting war roles.
                                for (const levelRole of validLevelRoles) {
                                    if (memberRoles.has(levelRole.id)) {
                                        validLevel = true;
                                        break;
                                    }
                                }

                                if (
                                    memberOfRole &&
                                    memberRoles.has(memberOfRole.id) &&
                                    validLevel
                                ) {
                                    const warRole =
                                        interaction.guild.roles.cache.get(
                                            config['warRole'],
                                        );
                                    const warPingRole =
                                        interaction.guild.roles.cache.get(
                                            config['warPingRole'],
                                        );

                                    // Add warRole role if they didn't have it
                                    if (!memberRoles.has(warRole.id)) {
                                        await interaction.member.roles
                                            .add(warRole)
                                            .then(() => {
                                                console.log(
                                                    `Added war role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add war role to ${interaction.member.username}`,
                                                );
                                            });
                                    }

                                    // Add warPing role if they didn't have, otherwise remove the role
                                    if (!memberRoles.has(warPingRole.id)) {
                                        await interaction.member.roles
                                            .add(warPingRole)
                                            .then(() => {
                                                console.log(
                                                    `Added warPing role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add warPing role to ${interaction.member.username}`,
                                                );
                                            });

                                        await interaction.followUp({
                                            content: `You now have the ${warPingRole} role.`,
                                            ephemeral: true,
                                        });
                                    } else {
                                        await interaction.member.roles
                                            .remove(warPingRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed warPing role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove warPing role from ${interaction.member.username}`,
                                                );
                                            });

                                        await interaction.followUp({
                                            content: `You no longer have the ${warPingRole} role.`,
                                            ephemeral: true,
                                        });
                                    }
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this and be at least level ${levelRequirement}.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'removewar') {
                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const warRole =
                                    interaction.guild.roles.cache.get(
                                        config['warRole'],
                                    );

                                // If they have the war role then remove all war related roles
                                if (memberRoles.has(warRole.id)) {
                                    const tankRole =
                                        interaction.guild.roles.cache.get(
                                            config['tankRole'],
                                        );
                                    const healerRole =
                                        interaction.guild.roles.cache.get(
                                            config['healerRole'],
                                        );
                                    const damageRole =
                                        interaction.guild.roles.cache.get(
                                            config['damageRole'],
                                        );
                                    const soloRole =
                                        interaction.guild.roles.cache.get(
                                            config['soloRole'],
                                        );
                                    const ecoRole =
                                        interaction.guild.roles.cache.get(
                                            config['ecoRole'],
                                        );
                                    const warPingRole =
                                        interaction.guild.roles.cache.get(
                                            config['warPingRole'],
                                        );

                                    const warRoles = [
                                        warRole,
                                        tankRole,
                                        healerRole,
                                        damageRole,
                                        soloRole,
                                        ecoRole,
                                        warPingRole,
                                    ];

                                    // Remove each role
                                    for (const role of memberRoles.values()) {
                                        if (warRoles.includes(role)) {
                                            await interaction.member.roles
                                                .remove(role)
                                                .then(() => {
                                                    console.log(
                                                        `Removed war role ${role.name} from ${interaction.member.user.username}`,
                                                    );
                                                })
                                                .catch(() => {
                                                    console.log(
                                                        `Failed to remove war role ${role.name} from ${interaction.member.username}`,
                                                    );
                                                });
                                        }
                                    }

                                    await interaction.followUp({
                                        content: `You no longer have the ${warRole} role and any war class roles.`,
                                        ephemeral: true,
                                    });
                                } else {
                                    // They should have no war roles if they do not have the war role
                                    // unless it was manually added
                                    await interaction.followUp({
                                        content:
                                            'You do not have any war roles',
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'warrior') {
                                const fallenButton = new ButtonBuilder()
                                    .setCustomId('fallen')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('FALLEN');

                                const battleMonkButton = new ButtonBuilder()
                                    .setCustomId('battleMonk')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('BATTLE MONK');

                                const paladinButton = new ButtonBuilder()
                                    .setCustomId('paladin')
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('PALADIN');

                                const row =
                                    new ActionRowBuilder().addComponents(
                                        fallenButton,
                                        battleMonkButton,
                                        paladinButton,
                                    );

                                const archetypeMessage = config[
                                    'classArchetypeMessage'
                                ].replace(/\\n/g, '\n');

                                await interaction.followUp({
                                    content: archetypeMessage,
                                    ephemeral: true,
                                    components: [row],
                                });
                            } else if (interaction.customId === 'mage') {
                                const riftwalkerButton = new ButtonBuilder()
                                    .setCustomId('riftwalker')
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('RIFTWALKER');

                                const lightBenderButton = new ButtonBuilder()
                                    .setCustomId('lightBender')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('LIGHT BENDER');

                                const arcanistButton = new ButtonBuilder()
                                    .setCustomId('arcanist')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('ARCANIST');

                                const row =
                                    new ActionRowBuilder().addComponents(
                                        riftwalkerButton,
                                        lightBenderButton,
                                        arcanistButton,
                                    );

                                const archetypeMessage = config[
                                    'classArchetypeMessage'
                                ].replace(/\\n/g, '\n');

                                await interaction.followUp({
                                    content: archetypeMessage,
                                    ephemeral: true,
                                    components: [row],
                                });
                            } else if (interaction.customId === 'archer') {
                                const sharpshooterButton = new ButtonBuilder()
                                    .setCustomId('sharpshooter')
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('SHARPSHOOTER');

                                const trapperButton = new ButtonBuilder()
                                    .setCustomId('trapper')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('TRAPPER');

                                const boltslingerButton = new ButtonBuilder()
                                    .setCustomId('boltslinger')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('BOLTSLINGER');

                                const row =
                                    new ActionRowBuilder().addComponents(
                                        sharpshooterButton,
                                        trapperButton,
                                        boltslingerButton,
                                    );

                                const archetypeMessage = config[
                                    'classArchetypeMessage'
                                ].replace(/\\n/g, '\n');

                                await interaction.followUp({
                                    content: archetypeMessage,
                                    ephemeral: true,
                                    components: [row],
                                });
                            } else if (interaction.customId === 'shaman') {
                                const ritualistButton = new ButtonBuilder()
                                    .setCustomId('ritualist')
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('RITUALIST');

                                const summonerButton = new ButtonBuilder()
                                    .setCustomId('summoner')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('SUMMONER');

                                const acolyteButton = new ButtonBuilder()
                                    .setCustomId('acolyte')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('ACOLYTE');

                                const row =
                                    new ActionRowBuilder().addComponents(
                                        ritualistButton,
                                        summonerButton,
                                        acolyteButton,
                                    );

                                const archetypeMessage = config[
                                    'classArchetypeMessage'
                                ].replace(/\\n/g, '\n');

                                await interaction.followUp({
                                    content: archetypeMessage,
                                    ephemeral: true,
                                    components: [row],
                                });
                            } else if (interaction.customId === 'assassin') {
                                const acrobatButton = new ButtonBuilder()
                                    .setCustomId('acrobat')
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('ACROBAT');

                                const shadestepperButton = new ButtonBuilder()
                                    .setCustomId('shadestepper')
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('SHADERSTEPPER');

                                const tricksterButton = new ButtonBuilder()
                                    .setCustomId('trickster')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('TRICKSTER');

                                const row =
                                    new ActionRowBuilder().addComponents(
                                        acrobatButton,
                                        shadestepperButton,
                                        tricksterButton,
                                    );

                                const archetypeMessage = config[
                                    'classArchetypeMessage'
                                ].replace(/\\n/g, '\n');

                                await interaction.followUp({
                                    content: archetypeMessage,
                                    ephemeral: true,
                                    components: [row],
                                });
                            } else if (
                                archetypes.includes(interaction.customId)
                            ) {
                                const memberRoles =
                                    await interaction.member.roles.cache;

                                const warriorRole =
                                    interaction.guild.roles.cache.get(
                                        config['warriorRole'],
                                    );
                                const mageRole =
                                    interaction.guild.roles.cache.get(
                                        config['mageRole'],
                                    );
                                const archerRole =
                                    interaction.guild.roles.cache.get(
                                        config['archerRole'],
                                    );
                                const shamanRole =
                                    interaction.guild.roles.cache.get(
                                        config['shamanRole'],
                                    );
                                const assassinRole =
                                    interaction.guild.roles.cache.get(
                                        config['assassinRole'],
                                    );

                                const classRoles = [
                                    warriorRole,
                                    mageRole,
                                    archerRole,
                                    shamanRole,
                                    assassinRole,
                                ];

                                for (const archetype of archetypes) {
                                    classRoles.push(
                                        interaction.guild.roles.cache.get(
                                            config[`${archetype}Role`],
                                        ),
                                    );
                                }

                                let classRole;

                                // Determine which class was selected
                                if (
                                    warriorArchetypes.includes(
                                        interaction.customId,
                                    )
                                ) {
                                    classRole = warriorRole;
                                } else if (
                                    mageArchetypes.includes(
                                        interaction.customId,
                                    )
                                ) {
                                    classRole = mageRole;
                                } else if (
                                    archerArchetypes.includes(
                                        interaction.customId,
                                    )
                                ) {
                                    classRole = archerRole;
                                } else if (
                                    shamanArchetypes.includes(
                                        interaction.customId,
                                    )
                                ) {
                                    classRole = shamanRole;
                                } else if (
                                    assassinArchetypes.includes(
                                        interaction.customId,
                                    )
                                ) {
                                    classRole = assassinRole;
                                }

                                // Get the role for the archetype
                                const archetypeRole =
                                    interaction.guild.roles.cache.get(
                                        config[`${interaction.customId}Role`],
                                    );

                                // Remove any previous class roles that aren't the same as the new selected
                                for (const role of memberRoles.values()) {
                                    if (
                                        classRoles.includes(role) &&
                                        role !== classRole &&
                                        role !== archetypeRole
                                    ) {
                                        await interaction.member.roles
                                            .remove(role)
                                            .then(() => {
                                                console.log(
                                                    `Removed class role ${role.name} from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove class role from ${interaction.member.username}`,
                                                );
                                            });
                                    }
                                }

                                // Add class role
                                await interaction.member.roles
                                    .add(classRole)
                                    .then(() => {
                                        console.log(
                                            `Added class role to ${interaction.member.user.username}`,
                                        );
                                    })
                                    .catch(() => {
                                        console.log(
                                            `Failed to add class role to ${interaction.member.username}`,
                                        );
                                    });

                                // Add archetype role
                                await interaction.member.roles
                                    .add(archetypeRole)
                                    .then(() => {
                                        console.log(
                                            `Added archetype role to ${interaction.member.user.username}`,
                                        );
                                    })
                                    .catch(() => {
                                        console.log(
                                            `Failed to add archetype role to ${interaction.member.username}`,
                                        );
                                    });

                                const replyMessage = `You now have the ${classRole} class role with archetype ${archetypeRole}!`;

                                await interaction.followUp({
                                    content: replyMessage,
                                    ephemeral: true,
                                });
                            } else if (interaction.customId === 'giveaway') {
                                const giveawayRole =
                                    interaction.guild.roles.cache.get(
                                        config['giveawayRole'],
                                    );
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                let replyMessage;

                                // If they have the guild member role
                                if (memberRoles.has(memberOfRole.id)) {
                                    // Remove giveaway role if they have it already, otherwise add it
                                    if (memberRoles.has(giveawayRole.id)) {
                                        await interaction.member.roles
                                            .remove(giveawayRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed giveaway role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove giveaway role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${giveawayRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(giveawayRole)
                                            .then(() => {
                                                console.log(
                                                    `Added giveaway role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add giveaway role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${giveawayRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'events') {
                                const eventsRole =
                                    interaction.guild.roles.cache.get(
                                        config['eventsRole'],
                                    );
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                let replyMessage;

                                // If they have the guild member role
                                if (memberRoles.has(memberOfRole.id)) {
                                    // Remove events role if they have it already, otherwise add it
                                    if (memberRoles.has(eventsRole.id)) {
                                        await interaction.member.roles
                                            .remove(eventsRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed events role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove events role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${eventsRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(eventsRole)
                                            .then(() => {
                                                console.log(
                                                    `Added events role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add events role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${eventsRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (interaction.customId === 'bombbell') {
                                const bombBellRole =
                                    interaction.guild.roles.cache.get(
                                        config['bombBellRole'],
                                    );

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                let replyMessage;

                                // Remove bomb bell role if they have it already, otherwise add it
                                if (memberRoles.has(bombBellRole.id)) {
                                    await interaction.member.roles
                                        .remove(bombBellRole)
                                        .then(() => {
                                            console.log(
                                                `Removed bomb bell role from ${interaction.member.user.username}`,
                                            );
                                        })
                                        .catch(() => {
                                            console.log(
                                                `Failed to remove bomb bell role from ${interaction.member.username}`,
                                            );
                                        });

                                    replyMessage = `You no longer have the ${bombBellRole} role`;
                                } else {
                                    await interaction.member.roles
                                        .add(bombBellRole)
                                        .then(() => {
                                            console.log(
                                                `Added bomb bell role to ${interaction.member.user.username}`,
                                            );
                                        })
                                        .catch(() => {
                                            console.log(
                                                `Failed to add bomb bell role to ${interaction.member.username}`,
                                            );
                                        });

                                    replyMessage = `You now have the ${bombBellRole} role`;
                                }

                                await interaction.followUp({
                                    content: replyMessage,
                                    ephemeral: true,
                                });
                            } else if (interaction.customId === 'guildraid') {
                                const guildRaidRole =
                                    interaction.guild.roles.cache.get(
                                        config['guildRaidRole'],
                                    );
                                const memberOfRole =
                                    interaction.guild.roles.cache.get(
                                        config['memberOfRole'],
                                    );

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                let replyMessage;

                                // If they have the guild member role
                                if (memberRoles.has(memberOfRole.id)) {
                                    // Remove guild raid role if they have it already, otherwise add it
                                    if (memberRoles.has(guildRaidRole.id)) {
                                        await interaction.member.roles
                                            .remove(guildRaidRole)
                                            .then(() => {
                                                console.log(
                                                    `Removed guild raid role from ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to remove guild raid role from ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You no longer have the ${guildRaidRole} role`;
                                    } else {
                                        await interaction.member.roles
                                            .add(guildRaidRole)
                                            .then(() => {
                                                console.log(
                                                    `Added guild raid role to ${interaction.member.user.username}`,
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    `Failed to add guild raid role to ${interaction.member.username}`,
                                                );
                                            });

                                        replyMessage = `You now have the ${guildRaidRole} role`;
                                    }

                                    await interaction.followUp({
                                        content: replyMessage,
                                        ephemeral: true,
                                    });
                                } else {
                                    const guildName = (
                                        await database.findGuild(
                                            config['guild'],
                                            true,
                                        )
                                    ).name;
                                    await interaction.followUp({
                                        content: `Sorry, you need to be a member of ${guildName} to use this.`,
                                        ephemeral: true,
                                    });
                                }
                            } else if (
                                interaction.customId === 'annihilation'
                            ) {
                                const annihilationRole =
                                    interaction.guild.roles.cache.get(
                                        config['annihilationRole'],
                                    );

                                const memberRoles =
                                    await interaction.member.roles.cache;

                                let replyMessage;

                                // Remove annihilation role if they have it already, otherwise add it
                                if (memberRoles.has(annihilationRole.id)) {
                                    await interaction.member.roles
                                        .remove(annihilationRole)
                                        .then(() => {
                                            console.log(
                                                `Removed annihilation role from ${interaction.member.user.username}`,
                                            );
                                        })
                                        .catch(() => {
                                            console.log(
                                                `Failed to remove annihilation role from ${interaction.member.username}`,
                                            );
                                        });

                                    replyMessage = `You no longer have the ${annihilationRole} role`;
                                } else {
                                    await interaction.member.roles
                                        .add(annihilationRole)
                                        .then(() => {
                                            console.log(
                                                `Added annihilation role to ${interaction.member.user.username}`,
                                            );
                                        })
                                        .catch(() => {
                                            console.log(
                                                `Failed to add annihilation role to ${interaction.member.username}`,
                                            );
                                        });

                                    replyMessage = `You now have the ${annihilationRole} role`;
                                }

                                await interaction.followUp({
                                    content: replyMessage,
                                    ephemeral: true,
                                });
                            }
                        }
                    }
                } else if (interaction.isStringSelectMenu()) {
                    const parts = interaction.values[0].split(':');
                    const functionToRun = parts[0];

                    switch (functionToRun) {
                        case 'active_hours': {
                            const timezoneOffset = parts[2];
                            const sortByActivity = parts[3];

                            try {
                                const preferencesPath = path.join(
                                    __dirname,
                                    '..',
                                );
                                const preferencesFile = path.join(
                                    preferencesPath,
                                    'preferences.json',
                                );

                                let preferences = {};

                                if (fs.existsSync(preferencesFile)) {
                                    const fileData = fs.readFileSync(
                                        preferencesFile,
                                        'utf-8',
                                    );
                                    preferences = JSON.parse(fileData);
                                } else {
                                    await fs.writeFileSync(
                                        preferencesFile,
                                        JSON.stringify(preferences, null, 2),
                                        'utf-8',
                                    );
                                }

                                preferences[interaction.user.id] = {
                                    timezoneOffset: timezoneOffset,
                                    sortByActivity: sortByActivity,
                                };

                                await fs.writeFileSync(
                                    preferencesFile,
                                    JSON.stringify(preferences, null, 2),
                                    'utf-8',
                                );
                            } catch (error) {
                                console.error(error);
                                console.error(
                                    'Failed to save timezone and activity preferences',
                                );
                            }

                            const response = await activeHours(
                                interaction,
                                true,
                                timezoneOffset,
                                sortByActivity,
                            );

                            if (response.activity.length === 0) {
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle('No Data')
                                    .setDescription(
                                        `There is no activity data for ${response.guildName}, try again later.`,
                                    )
                                    .setColor(0xff0000);

                                await interaction.editReply({
                                    embeds: [responseEmbed],
                                });

                                return;
                            } else {
                                const responseEmbed = new EmbedBuilder();
                                const timezoneRow = new ActionRowBuilder();
                                const sortRow = new ActionRowBuilder();

                                const timezoneSelection =
                                    new StringSelectMenuBuilder()
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

                                    hourOrderButton.setStyle(
                                        ButtonStyle.Primary,
                                    );
                                } else {
                                    activityOrderButton.setStyle(
                                        ButtonStyle.Primary,
                                    );

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
                }
            } catch (err) {
                console.log(err);
            }
        } catch (err) {
            console.error('Failed to read config file', err);
        }
    },
};
