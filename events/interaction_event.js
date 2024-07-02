const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Events,
    EmbedBuilder,
} = require('discord.js');
const MessageManager = require('../message_type/MessageManager');
const PagedMessage = require('../message_type/PagedMessage');
const MessageType = require('../message_type/MessageType');
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
const registerUser = require('../functions/register_user');
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
