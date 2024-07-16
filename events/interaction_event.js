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
const updateGuild = require('../functions/update_guild');
const fs = require('fs');
const path = require('path');
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

const warriorArchetypes = ['fallen', 'battleMonk', 'paladin'];
const mageArchetypes = ['riftwalker', 'lightBender', 'arcanist'];
const archerArchetypes = ['sharpshooter', 'trapper', 'boltslinger'];
const shamanArchetypes = ['ritualist', 'summoner', 'acolyte'];
const assassinArchetypes = ['acrobat', 'shadestepper', 'trickster'];
const archetypes = warriorArchetypes.concat(mageArchetypes, archerArchetypes, shamanArchetypes, assassinArchetypes);

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

            // Get the config file for the server
            if (fs.existsSync(filePath)) {
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
                            await interaction.editReply({ embeds: [messages.getMessage(interaction.message.id).getPreviousPage()] });

                            break;
                        }
                        case 'next': {
                            await interaction.editReply({ embeds: [messages.getMessage(interaction.message.id).getNextPage()] });

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
                                        .setDescription('Looking up active hours for selected guild.')
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
                                    const fileData = fs.readFileSync(preferencesFile, 'utf-8');
                                    preferences = JSON.parse(fileData);
                                } else {
                                    await fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2), 'utf-8');
                                }

                                preferences[interaction.user.id] = { timezoneOffset: timezoneOffset, sortByActivity: sortByActivity };

                                await fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2), 'utf-8');
                            } catch (error) {
                                console.error('Failed to save timezone and activity preferences: ', error);
                            }

                            const response = await activeHours(interaction, true, timezoneOffset, sortByActivity);

                            if (response.activity.length === 0) {
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle('No Data')
                                    .setDescription(`There is no activity data for ${response.guildName}, try again later.`)
                                    .setColor(0xff0000);

                                await interaction.editReply({ embeds: [responseEmbed] });

                                return;
                            } else {
                                const responseEmbed = new EmbedBuilder();
                                const timezoneRow = new ActionRowBuilder();
                                const sortRow = new ActionRowBuilder();

                                // Create string select menu with all timezone options
                                const timezoneSelection = new StringSelectMenuBuilder()
                                    .setCustomId('timezone')
                                    .setPlaceholder('Select timezone!')
                                    .addOptions(
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PST')
                                            .setDescription('UTC-8')
                                            .setValue(`active_hours:${response.guildUuid}:-8:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PDT')
                                            .setDescription('UTC-7')
                                            .setValue(`active_hours:${response.guildUuid}:-7:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MDT')
                                            .setDescription('UTC-6')
                                            .setValue(`active_hours:${response.guildUuid}:-6:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CDT')
                                            .setDescription('UTC-5')
                                            .setValue(`active_hours:${response.guildUuid}:-5:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('EDT')
                                            .setDescription('UTC-4')
                                            .setValue(`active_hours:${response.guildUuid}:-4:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BRT')
                                            .setDescription('UTC-3')
                                            .setValue(`active_hours:${response.guildUuid}:-3:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('UTC')
                                            .setDescription('UTC+0')
                                            .setValue(`active_hours:${response.guildUuid}:0:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BST')
                                            .setDescription('UTC+1')
                                            .setValue(`active_hours:${response.guildUuid}:1:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CEST')
                                            .setDescription('UTC+2')
                                            .setValue(`active_hours:${response.guildUuid}:2:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MSK')
                                            .setDescription('UTC+3')
                                            .setValue(`active_hours:${response.guildUuid}:3:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('GST')
                                            .setDescription('UTC+4')
                                            .setValue(`active_hours:${response.guildUuid}:4:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('IST')
                                            .setDescription('UTC+5:30')
                                            .setValue(`active_hours:${response.guildUuid}:5.5:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CST/SNST')
                                            .setDescription('UTC+8')
                                            .setValue(`active_hours:${response.guildUuid}:8:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('JST')
                                            .setDescription('UTC+9')
                                            .setValue(`active_hours:${response.guildUuid}:9:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('AEST')
                                            .setDescription('UTC+10')
                                            .setValue(`active_hours:${response.guildUuid}:10:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('NZST')
                                            .setDescription('UTC+12')
                                            .setValue(`active_hours:${response.guildUuid}:12:${sortByActivity}`),
                                );

                                timezoneRow.addComponents(timezoneSelection);

                                const activityOrderButton = new ButtonBuilder()
                                    .setCustomId(`active_hours:${response.guildUuid}:activity:${timezoneOffset}`)
                                    .setLabel('Sort by activity');

                                const hourOrderButton = new ButtonBuilder()
                                    .setCustomId(`active_hours:${response.guildUuid}:time:${timezoneOffset}`)
                                    .setLabel('Sort by time');

                                if (sortByActivity) {
                                    activityOrderButton
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true);

                                    hourOrderButton
                                        .setStyle(ButtonStyle.Primary);
                                } else {
                                    activityOrderButton
                                        .setStyle(ButtonStyle.Primary);

                                    hourOrderButton
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true);
                                }

                                sortRow.addComponents(activityOrderButton);
                                sortRow.addComponents(hourOrderButton);

                                responseEmbed
                                    .setTitle(`[${response.guildPrefix}] ${response.guildName} Active Hours (${response.timezone})`)
                                    .setURL(`https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`)
                                    .setColor(0x00ffff);

                                let timeValue = '';
                                let averageValue = '';
                                let captainsValue = '';

                                for (const hour of response.activity) {
                                    timeValue += hour.hour + '\n';
                                    averageValue += hour.averageOnline + '\n';
                                    captainsValue += hour.averageCaptains + '\n';
                                }

                                responseEmbed
                                    .addFields(
                                        { name: 'Time', value: timeValue, inline: true },
                                        { name: 'Average Players', value: averageValue, inline: true },
                                        { name: 'Average Captain+\'s', value: captainsValue, inline: true },
                                    );

                                await interaction.editReply({ 
                                    components: [timezoneRow, sortRow],
                                    embeds: [responseEmbed],
                                });
                            }

                            break;
                        }
                        case 'add_ally': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Adding selected guild as ally.')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addAlly(interaction, true);

                            if (response.error) {
                                // Error
                                const responseEmbed = new EmbedBuilder();
                    
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            } else {
                                const responseEmbed = new EmbedBuilder();
                    
                                if (response.guildName === '') {
                                    // Unknown guild
                                    responseEmbed
                                        .setTitle('Invalid guild')
                                        .setDescription(`Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid guild
                                    responseEmbed
                                        .setTitle('Successfully added ally')
                                        .setDescription(`${response.guildName} is now an allied guild.`)
                                        .setColor(0x00ffff);
                                }
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            }

                            break;
                        }
                        case 'add_demotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Adding demotion exception for selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addDemotionException(interaction, true, interaction.message.embeds[0].footer.text);

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`Unable to add demotion exception: ${response.error}`)
                                    .setColor(0xff0000);
                            } else {
                                if (response.username === '') {
                                    // Unknown player
                                    responseEmbed
                                        .setTitle('Invalid username')
                                        .setDescription(`Unable to find a player using the name '${interaction.options.getString('username')}', try again using the exact player name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid player
                                    let duration;

                                    if (response.duration === -1) {
                                        duration = 'Exempt from demotions forever';
                                    } else {
                                        duration = `Exempt from demotions for ${response.duration} day${response.duration > 1 ? 's' : ''}`;
                                    }

                                    responseEmbed
                                        .setTitle(`${response.username} is now exempt from demotions`)
                                        .addFields({ name: 'Duration', value: `${duration}` })
                                        .setColor(0x00ffff);
                                }
                            }
                
                            await interaction.editReply({ embeds: [responseEmbed] });

                            break;
                        }
                        case 'add_inactivity_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Adding inactivity exception for selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addInactivityException(interaction, true, interaction.message.embeds[0].footer.text);

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`Unable to add inactivity exception: ${response.error}`)
                                    .setColor(0xff0000);
                            } else {
                                if (response.username === '') {
                                    // Unknown player
                                    responseEmbed
                                        .setTitle('Invalid username')
                                        .setDescription(`Unable to find a player using the name '${interaction.options.getString('username')}', try again using the exact player name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid player
                                    let duration;

                                    if (response.duration === -1) {
                                        duration = 'Exempt from inactivity forever';
                                    } else {
                                        duration = `Allowed to be inactive for ${response.duration} day${response.duration > 1 ? 's' : ''}`;
                                    }

                                    responseEmbed
                                        .setTitle(`${response.username} now has a custom inactivity threshold`)
                                        .addFields({ name: 'Duration', value: `${duration}` })
                                        .setColor(0x00ffff);
                                }
                            }
                
                            await interaction.editReply({ embeds: [responseEmbed] });

                            break;
                        }
                        case 'add_promotion_exception': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Adding promotion exception for selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await addPromotionException(interaction, true, interaction.message.embeds[0].footer.text);

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`Unable to add promotion exception: ${response.error}`)
                                    .setColor(0xff0000);
                            } else {
                                if (response.username === '') {
                                    // Unknown player
                                    responseEmbed
                                        .setTitle('Invalid username')
                                        .setDescription(`Unable to find a player using the name '${interaction.options.getString('username')}', try again using the exact player name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid player
                                    let duration;

                                    if (response.duration === -1) {
                                        duration = 'Exempt from promotions forever';
                                    } else {
                                        duration = `Exempt from promotions for ${response.duration} day${response.duration > 1 ? 's' : ''}`;
                                    }
                
                                    responseEmbed
                                        .setTitle(`${response.username} is now exempt from promotions`)
                                        .addFields({ name: 'Duration', value: `${duration}` })
                                        .setColor(0x00ffff);
                                }
                            }
                
                            await interaction.editReply({ embeds: [responseEmbed] });

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

                            const response = await banPlayer(interaction, true, interaction.message.embeds[0].footer.text);

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`Unable to ban player: ${response.error}`)
                                    .setColor(0xff0000);
                            } else {
                                if (response.username === '') {
                                    // Unknown player
                                    responseEmbed
                                        .setTitle('Invalid username')
                                        .setDescription(`Unable to find a player using the name '${interaction.options.getString('username')}', try again using the exact player name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid player
                                    responseEmbed
                                        .setTitle(`${response.username} has been banned from your guild`)
                                        .addFields({ name: 'Reason', value: `${response.reason}` })
                                        .setColor(0x00ffff);
                                }
                            }
                
                            await interaction.editReply({ embeds: [responseEmbed] });

                            break;
                        }
                        case 'last_logins': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Loading last logins for selected guild')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await lastLogins(interaction, true);

                            const embeds = [];
                            const row = new ActionRowBuilder();

                            if (response.playerLastLogins.length > 30) {
                                const pages = [];
                                for (let i = 0; i < response.playerLastLogins.length; i += 30) {
                                    pages.push(response.playerLastLogins.slice(i, i + 30));
                                }
            
                                for (const page of pages) {
                                    const responseEmbed = new EmbedBuilder();
                                    responseEmbed
                                        .setTitle(`[${response.guildPrefix}] ${response.guildName} Last Logins`)
                                        .setColor(0x00ffff);
                                
                                    let usernameValue = '';
                                    let rankValue = '';
                                    let lastLoginValue = '';
                                
                                    for (const player of page) {
                                        usernameValue += player.username + '\n';
                                        rankValue += player.guildRank + '\n';
                                
                                        if (player.online) {
                                            lastLoginValue += 'Online now!\n';
                                        } else {
                                            lastLoginValue += utilities.getTimeSince(player.lastLogin) + ' ago\n';
                                        }
                                    }
                                
                                    responseEmbed
                                        .addFields(
                                            { name: 'Username', value: usernameValue, inline: true },
                                            { name: 'Guild Rank', value: rankValue, inline: true },
                                            { name: 'Last Login', value: lastLoginValue, inline: true },
                                        );
                                
                                    embeds.push(responseEmbed);
                                }
            
                                messages.addMessage(interaction.message.id, new PagedMessage(interaction.message, embeds));
            
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
                                    .setTitle(`[${response.guildPrefix}] ${response.guildName} Last Logins`)
                                    .setColor(0x00ffff);
            
                                if (response.playerLastLogins.length > 0) {
                                    let usernameValue = '';
                                    let rankValue = '';
                                    let lastLoginValue = '';
            
                                    for (const player of response.playerLastLogins) {
                                        usernameValue += player.username + '\n';
                                        rankValue += player.guildRank + '\n';
            
                                        if (player.online) {
                                            lastLoginValue += 'Online now!\n';
                                        } else {
                                            lastLoginValue += utilities.getTimeSince(player.lastLogin) + ' ago\n';
                                        }
                                    }
            
                                    responseEmbed
                                        .addFields(
                                            { name: 'Username', value: usernameValue, inline: true },
                                            { name: 'Guild Rank', value: rankValue, inline: true },
                                            { name: 'Last Login', value: lastLoginValue, inline: true },
                                        );
                                }
            
                                embeds.push(responseEmbed);
                            }

                            if (row.components.length > 0) {
                                await interaction.editReply({ 
                                    embeds: [embeds[0]],
                                    components: [row],
                                });
                            } else {
                                await interaction.editReply({ embeds: [embeds[0]] });
                            }

                            break;
                        }
                        case 'online': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Checking online players for selected guild')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await online(interaction, true);

                            const responseEmbed = new EmbedBuilder()
                                .setTitle(`[${response.guildPrefix}] ${response.guildName} Online Members`)
                                .setURL(`https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`)
                                .setDescription(`There are currently ${response.onlineCount}/${response.memberCount} players online`)
                                .setColor(0x00ffff);

                            // Display a message about players in /stream if the guild online count does not match
                            // the number of online players found
                            const playersInStream = response.onlineCount - response.onlinePlayers.length;

                            if (playersInStream > 0) {
                                responseEmbed
                                    .addFields({ name: 'Streamers', value: `There ${playersInStream > 1 ? 'are' : 'is'} ${playersInStream} player${playersInStream > 1 ? 's' : ''} in /stream`, inline: false });
                            }

                            if (response.onlinePlayers.length > 0) {
                                let usernameValue = '';
                                let rankValue = '';
                                let serverValue = '';

                                for (const onlinePlayer of response.onlinePlayers) {
                                    usernameValue += onlinePlayer.username + '\n';
                                    rankValue += onlinePlayer.guildRank + '\n';
                                    serverValue += onlinePlayer.server + '\n';
                                }

                                responseEmbed
                                    .addFields(
                                        { name: 'Username', value: usernameValue, inline: true },
                                        { name: 'Guild Rank', value: rankValue, inline: true },
                                        { name: 'Server', value: serverValue, inline: true },
                                    );
                            }

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });

                            break;
                        }
                        case 'promotion_progress': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Finding promotion progress for selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await promotionProgress(interaction, true);

                            const responseEmbed = new EmbedBuilder();

                            if (response.uuid) {
                                responseEmbed
                                    .setThumbnail(`https://visage.surgeplay.com/bust/512/${response.uuid}.png`);
                            }

                            if (response.unableToPromote) {
                                const reason = response.unableToPromote;
        
                                switch (reason) {
                                    case 'error':
                                        // Something went wrong
                                        responseEmbed
                                            .setDescription('An error occured whilst checking for promotion progress.');
                                        break;
                                    case 'guild':
                                        // Not in guild
                                        responseEmbed
                                            .setDescription(`${response.username} is not a member of ${config.guildName}.`);
                                        break;
                                    case 'owner':
                                        // Is owner
                                        responseEmbed
                                            .setDescription(`${response.username} is the Owner of ${config.guildName}. They are unable to be promoted.`);
                                        break;
                                    case 'chief':
                                        // Is chief
                                        responseEmbed
                                            .setDescription(`${response.username} is a Chief of ${config.guildName}. Only the Owner can decide if they should be promoted.`);
                                        break;
                                    default:
                                        // Exempt
                                        if (response.unableToPromote === -1) {
                                            responseEmbed
                                                .setDescription(`${response.username} is exempt from promotions forever.`);
                                        } else if (response.unableToPromote >= 0) {
                                            responseEmbed
                                                .setDescription(`${response.username} is exempt from promotion for ${response.unableToPromote} day${response.unableToPromote > 1 ? 's' : ''}.`);
                                        } else {
                                            responseEmbed
                                                .setDescription('Secret response that totally isn\'t an unexpected issue haha...');
                                        }
                                        break;
                                }
        
                                responseEmbed
                                    .setTitle(response.username)
                                    .setColor(0xff0000);
                            } else {
                                responseEmbed
                                    .setTitle(`${response.guildRank} ${response.username} has ${response.metRequirements}/${response.requirementsCount} requirements for ${response.nextGuildRank}`)
                                    .setDescription('First Days in Guild is required, anything else is optional as long as you meet the requirement.')
                                    .setColor(0x00ffff);
        
                                const daysInGuildColour = response.daysInGuild >= response.timeRequirement ? '🟢' : '🔴';
        
                                responseEmbed
                                    .addFields({ name: `${daysInGuildColour} Days in Guild`, value: `${response.daysInGuild}/${response.timeRequirement}` });
        
                                for (const requirement of response.requirements) {
                                    let requirementColour = requirement.current >= requirement.required ? '🟢' : '🔴';
        
                                    switch (requirement.promotionType) {
                                        case PromotionValue.XP:
                                            responseEmbed.addFields({ name: `${requirementColour} XP Contributed`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.LEVEL:
                                            responseEmbed.addFields({ name: `${requirementColour} Highest Character Level`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.TOP:
                                            requirementColour = requirement.current <= requirement.required ? '🟢' : '🔴';
                                            responseEmbed.addFields({ name: `${requirementColour} Contribution Position`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.TIME:
                                            responseEmbed.addFields({ name: `${requirementColour} Days in Guild`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.WARS:
                                            responseEmbed.addFields({ name: `${requirementColour} Wars Completed (Total)`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.BUILD:
                                            requirementColour = requirement.current === 1 ? '🟢' : '🔴';
                                            responseEmbed.addFields({ name: `${requirementColour} War Build`, value: `${requirement.current === 1 ? 'Has a war build' : 'Does not have a war build'}` });
                                            break;
                                        case PromotionValue.PLAYTIME:
                                            responseEmbed.addFields({ name: `${requirementColour} Average Playtime per Week (hours)`, value: `${requirement.current}/${requirement.required}` });
                                            break;
                                        case PromotionValue.ECO:
                                            requirementColour = requirement.current === 1 ? '🟢' : '🔴';
                                            responseEmbed.addFields({ name: `${requirementColour} Eco`, value: `${requirement.current === 1 ? 'Knows/is learning eco' : 'Does not know/is not not learning eco'}` });
                                            break;
                                        default:
                                            responseEmbed.addFields({ name: `${requirementColour} Unexpected promotion type ${requirement.promotionType}`, value: `${requirement.current}/${requirement.required}` });
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
                                .setDescription('Removing selected guild from allies.')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await removeAlly(interaction, true);

                            if (response.error) {
                                // Error
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            } else {
                                const responseEmbed = new EmbedBuilder();
                    
                                if (response.guildName === '') {
                                    // Unknown guild
                                    responseEmbed
                                        .setTitle('Invalid guild')
                                        .setDescription(`Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid guild
                                    responseEmbed
                                    .setTitle('Successfully removed ally')
                                    .setDescription(`${response.guildName} is no longer an allied guild.`)
                                    .setColor(0x00ffff);
                                }
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            }

                            break;
                        }
                        case 'set_guild': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Setting guild to selected guild.')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await setGuild(interaction, true);

                            if (response.error) {
                                // Error
                                const responseEmbed = new EmbedBuilder();
                    
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`${response.error}`)
                                    .setColor(0xff0000);
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            } else {
                                const responseEmbed = new EmbedBuilder();
                    
                                if (response.guildName === '') {
                                    // Unknown guild
                                    responseEmbed
                                        .setTitle('Invalid guild')
                                        .setDescription(`Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid guild
                                    responseEmbed
                                        .setTitle('Successfully set guild')
                                        .setDescription(`You are now representing ${response.guildName}`)
                                        .setColor(0x00ffff);
                                }
                    
                                await interaction.editReply({ embeds: [responseEmbed] });
                            }

                            break;
                        }
                        case 'sus': {
                            const loadingEmbed = new EmbedBuilder()
                                .setDescription('Calculating sus level for selected player')
                                .setColor(0x00ff00);

                            await interaction.editReply({
                                components: [],
                                embeds: [loadingEmbed],
                            });

                            const response = await sus(interaction, true);

                            const publicProfileValue = `${response.username} has a ${response.publicProfile ? 'public' : 'private'} profile`;

                            // Valid player
                            const responseEmbed = new EmbedBuilder()
                                .setTitle(`Suspiciousness of ${response.username}: ${response.overallSusValue}%`)
                                .setDescription('This is calculated from the following stats')
                                .setThumbnail(`https://visage.surgeplay.com/bust/512/${response.uuid}.png`)
                                .setColor(0x00ffff)
                                .addFields(
                                    { name: 'Join Date', value: response.joinSusData, inline: true },
                                    { name: 'Playtime', value: response.playtimeSusData, inline: true },
                                    { name: 'Time Spent Playing', value: response.timeSpentSusData, inline: true },
                                    { name: 'Total Level', value: response.totalLevelSusData, inline: true },
                                    { name: 'Quests Completed', value: response.questsSusData, inline: true },
                                    { name: 'Rank', value: response.rankSusData, inline: true },
                                    { name: 'Public Profile', value: publicProfileValue, inline: false },
                                );

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });
                            
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

                            const response = await unbanPlayer(interaction, true);

                            const responseEmbed = new EmbedBuilder();

                            if (response.error) {
                                responseEmbed
                                    .setTitle('Error')
                                    .setDescription(`Unable to unban player: ${response.error}`)
                                    .setColor(0xff0000);
                            } else {
                                if (response.username === '') {
                                    // Unknown player
                                    responseEmbed
                                        .setTitle('Invalid username')
                                        .setDescription(`Unable to find a player using the name '${interaction.options.getString('username')}', try again using the exact player name.`)
                                        .setColor(0xff0000);
                                } else {
                                    // Valid player
                                    responseEmbed
                                        .setTitle(`${response.username} has been unbanned from your guild`)
                                        .setColor(0x00ffff);
                                }
                            }
                
                            await interaction.editReply({ embeds: [responseEmbed] });

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

                            if (response.updates.length > 0 || response.errors.length > 0) {
                                // Valid player, with changes
                                responseEmbed
                                    .setTitle(`Verified as ${response.username}`)
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
                                responseEmbed
                                    .setTitle(`Verified as ${response.username}`)
                                    .setDescription('No changes')
                                    .setColor(0x999999);
                            }

                            await interaction.editReply({
                                components: [],
                                embeds: [responseEmbed],
                            });

                            if (response.updates.length > 0 || response.errors.length > 0 && config.logMessages && config.logChannel) {
                                responseEmbed
                                    .setTitle(`${interaction.member.user.username} has verified as ${response.username}`)
                                    .addFields({ name: 'User', value: `${interaction.member}` });
                    
                                const channel = interaction.guild.channels.cache.get(config.logChannel);
                    
                                if (channel) {
                                    try {
                                        await channel.send({ embeds: [responseEmbed] });
                                    } catch (error) {
                                        console.log(`Failed to send verification message to channel ${config.logChannel} in guild ${interaction.guild.id}`);
                                    }
                                } else {
                                    console.log(`${config.logChannel} not found for guild ${interaction.guild.id}`);
                                }
                            }
                            
                            break;
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
                                const preferencesPath = path.join(__dirname, '..');
                                const preferencesFile = path.join(preferencesPath, 'preferences.json');

                                let preferences = {};

                                if (fs.existsSync(preferencesFile)) {
                                    const fileData = fs.readFileSync(preferencesFile, 'utf-8');
                                    preferences = JSON.parse(fileData);
                                } else {
                                    await fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2), 'utf-8');
                                }

                                preferences[interaction.user.id] = { timezoneOffset: timezoneOffset, sortByActivity: sortByActivity };

                                await fs.writeFileSync(preferencesFile, JSON.stringify(preferences, null, 2), 'utf-8');
                            } catch (error) {
                                console.error(error);
                                console.error('Failed to save timezone and activity preferences');
                            }

                            const response = await activeHours(interaction, true, timezoneOffset, sortByActivity);

                            if (response.activity.length === 0) {
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle('No Data')
                                    .setDescription(`There is no activity data for ${response.guildName}, try again later.`)
                                    .setColor(0xff0000);

                                await interaction.editReply({ embeds: [responseEmbed] });

                                return;
                            } else {
                                const responseEmbed = new EmbedBuilder();
                                const timezoneRow = new ActionRowBuilder();
                                const sortRow = new ActionRowBuilder();

                                // Create string select menu with all timezone options
                                const timezoneSelection = new StringSelectMenuBuilder()
                                    .setCustomId('timezone')
                                    .setPlaceholder('Select timezone!')
                                    .addOptions(
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PST')
                                            .setDescription('UTC-8')
                                            .setValue(`active_hours:${response.guildUuid}:-8:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PDT')
                                            .setDescription('UTC-7')
                                            .setValue(`active_hours:${response.guildUuid}:-7:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MDT')
                                            .setDescription('UTC-6')
                                            .setValue(`active_hours:${response.guildUuid}:-6:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CDT')
                                            .setDescription('UTC-5')
                                            .setValue(`active_hours:${response.guildUuid}:-5:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('EDT')
                                            .setDescription('UTC-4')
                                            .setValue(`active_hours:${response.guildUuid}:-4:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BRT')
                                            .setDescription('UTC-3')
                                            .setValue(`active_hours:${response.guildUuid}:-3:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('UTC')
                                            .setDescription('UTC+0')
                                            .setValue(`active_hours:${response.guildUuid}:0:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BST')
                                            .setDescription('UTC+1')
                                            .setValue(`active_hours:${response.guildUuid}:1:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CEST')
                                            .setDescription('UTC+2')
                                            .setValue(`active_hours:${response.guildUuid}:2:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MSK')
                                            .setDescription('UTC+3')
                                            .setValue(`active_hours:${response.guildUuid}:3:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('GST')
                                            .setDescription('UTC+4')
                                            .setValue(`active_hours:${response.guildUuid}:4:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('IST')
                                            .setDescription('UTC+5:30')
                                            .setValue(`active_hours:${response.guildUuid}:5.5:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CST/SNST')
                                            .setDescription('UTC+8')
                                            .setValue(`active_hours:${response.guildUuid}:8:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('JST')
                                            .setDescription('UTC+9')
                                            .setValue(`active_hours:${response.guildUuid}:9:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('AEST')
                                            .setDescription('UTC+10')
                                            .setValue(`active_hours:${response.guildUuid}:10:${sortByActivity}`),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('NZST')
                                            .setDescription('UTC+12')
                                            .setValue(`active_hours:${response.guildUuid}:12:${sortByActivity}`),
                                );

                                timezoneRow.addComponents(timezoneSelection);

                                const activityOrderButton = new ButtonBuilder()
                                    .setCustomId(`active_hours:${response.guildUuid}:activity:${timezoneOffset}`)
                                    .setLabel('Sort by activity');

                                const hourOrderButton = new ButtonBuilder()
                                    .setCustomId(`active_hours:${response.guildUuid}:time:${timezoneOffset}`)
                                    .setLabel('Sort by time');

                                if (sortByActivity) {
                                    activityOrderButton
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true);

                                    hourOrderButton
                                        .setStyle(ButtonStyle.Primary);
                                } else {
                                    activityOrderButton
                                        .setStyle(ButtonStyle.Primary);

                                    hourOrderButton
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true);
                                }

                                sortRow.addComponents(activityOrderButton);
                                sortRow.addComponents(hourOrderButton);

                                responseEmbed
                                    .setTitle(`[${response.guildPrefix}] ${response.guildName} Active Hours (${response.timezone})`)
                                    .setURL(`https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`)
                                    .setColor(0x00ffff);

                                let timeValue = '';
                                let averageValue = '';
                                let captainsValue = '';

                                for (const hour of response.activity) {
                                    timeValue += hour.hour + '\n';
                                    averageValue += hour.averageOnline + '\n';
                                    captainsValue += hour.averageCaptains + '\n';
                                }

                                responseEmbed
                                    .addFields(
                                        { name: 'Time', value: timeValue, inline: true },
                                        { name: 'Average Players', value: averageValue, inline: true },
                                        { name: 'Average Captain+\'s', value: captainsValue, inline: true },
                                    );

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
