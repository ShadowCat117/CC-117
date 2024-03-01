const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const ButtonedMessage = require('../../message_type/ButtonedMessage');
const TrackedGuild = require('../../message_objects/TrackedGuild');
const MessageManager = require('../../message_type/MessageManager');

function getAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trackedguilds')
        .setDescription('View the average number of online players for each tracked guild.'),
    ephemeral: false,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            // If no guilds tracked, send message
            if (config.trackedGuilds.includes(null)) {
                await interaction.editReply('You are not tracking any guilds.');
                return;
            }

            return new Promise((resolve, reject) => {
                const fetchData = async () => {
                    try {
                        const trackedGuilds = [];

                        // Loop through every tracked guild
                        for (const tracked of config.trackedGuilds) {
                            let averageOnline = 0;
                            let averageCaptains = 0;
                            let divideBy = 0;

                            // Loop through each hour
                            for (let i = 0; i < 24; i++) {
                                const currentHour = i.toString().padStart(2, '0');

                                // Loop through the 4 times each hour has activity tracked at
                                for (let j = 0; j < 4; j++) {
                                    let currentMinute;

                                    if (j === 0) {
                                        currentMinute = '00';
                                    } else if (j === 1) {
                                        currentMinute = '15';
                                    } else if (j === 2) {
                                        currentMinute = '30';
                                    } else if (j === 3) {
                                        currentMinute = '45';
                                    }

                                    // The time for current activity check
                                    const currentTime = `${currentHour}${currentMinute}`;

                                    // The column names in table for current average
                                    const averageKey = 'average' + currentTime;
                                    const captainsKey = 'captains' + currentTime;

                                    const query = 'SELECT ' + averageKey + ', ' + captainsKey + ' FROM guilds WHERE name = ?';
                                    const params = [tracked];

                                    // Get the activity at current time
                                    const result = await getAsync(query, params);

                                    // If there is valid activity data
                                    if (result[averageKey] !== null && result[averageKey] !== -1) {
                                        // Increment average
                                        averageOnline += result[averageKey];
                                        averageCaptains += result[captainsKey];
                                        divideBy++;
                                    }
                                }
                            }

                            // Get current online players in guild
                            const playerQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1';
                            const playerResult = await getAsync(playerQuery, [tracked]);
                            const currentOnline = playerResult.count;

                            // Get current online players where their rank is captain or above
                            const captainRanks = ['CAPTAIN', 'STRATEGIST', 'CHIEF', 'OWNER'];
                            const captainQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1 AND guildRank IN (' + captainRanks.map(() => '?').join(',') + ')';
                            const captainResult = await getAsync(captainQuery, [tracked, ...captainRanks]);
                            const captainsOnline = captainResult.count;

                            if (divideBy !== 0) {
                                // If valid data, divide the averages by number of averages checked
                                averageOnline /= divideBy;
                                averageCaptains /= divideBy;

                                // Create new TrackedGuild object for current guild
                                trackedGuilds.push(new TrackedGuild(tracked, averageOnline, averageCaptains, currentOnline, captainsOnline));
                            } else {
                                // Create new TrackedGuild object with default data
                                trackedGuilds.push(new TrackedGuild(tracked, -1, -1, -1, -1));
                            }
                        }

                        // Sort by activity
                        trackedGuilds.sort((a, b) => a.compareTo(b));

                        // Begin creation of message response
                        const header = '```Guild Name          Avg. Online     Avg. Captain+     Current Online     Current Captain+\n-----------------------------------------------------------------------------------------\n';

                        const pages = [];
                        let page = header;
                        let counter = 0;

                        // Loop through all tracked guild responses
                        for (const trackedGuild of trackedGuilds) {
                            if (counter < 10) {
                                // Display 10 per page
                                page += trackedGuild.toString();

                                counter++;
                            } else if (counter === 10) {
                                // When 10 have been displayed, complete current page
                                page += '```';

                                counter = 0;

                                // Push new page to list
                                pages.push(page);

                                // Create new page
                                page = header;

                                page += trackedGuild.toString();
                            }
                        }

                        // If looped through all guilds but final page did not reach 10 guilds, finish the page
                        if (counter <= 10) {
                            page += '```';

                            pages.push(page);
                        }

                        // Create the message response
                        const trackedGuildsMessage = new ButtonedMessage('', [], '', pages);

                        if (pages.length > 1) {
                            // Add buttons if more than 1 page
                            const previousPage = new ButtonBuilder()
                                .setCustomId('previousPage')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('⬅️');

                            const nextPage = new ButtonBuilder()
                                .setCustomId('nextPage')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➡️');

                            const row = new ActionRowBuilder().addComponents(previousPage, nextPage);

                            const editedReply = await interaction.editReply({
                                content: trackedGuildsMessage.pages[0],
                                components: [row],
                            });

                            trackedGuildsMessage.setMessage(editedReply);

                            MessageManager.addMessage(trackedGuildsMessage);
                        } else {
                            // 1 page of activity
                            await interaction.editReply({
                                content: trackedGuildsMessage.pages[0],
                                components: [],
                            });
                        }

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };

                fetchData();
            });
        } catch (error) {
            await interaction.editReply('Unable to show tracked guilds');
        }
    },
};
