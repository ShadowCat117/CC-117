const {
    ActivityType,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    time,
} = require('discord.js');
const updateRoles = require('../functions/update_roles');
const database = require('../database/database');
const messages = require('../functions/messages');
const fs = require('fs');
const path = require('path');
const createConfig = require('../functions/create_config');
const PagedMessage = require('../message_objects/PagedMessage');
let client;

// Tasks to be ran every hour
async function hourlyTasks() {
    let now = new Date();

    if (now.getUTCMinutes() == 0) {
        // Update members of each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.members.fetch({ time: 30000 });
            } catch (error) {
                console.error('Failed to fetch guild members: ' + error);
            }
        }

        // Remove buttons from old message buttons.
        console.log('Removing old buttons');
        messages.removeOldMessages();

        // For each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                // Get the config file for that server
                let config = {};

                const directoryPath = path.join(__dirname, '..', 'configs');
                const filePath = path.join(directoryPath, `${guild.id}.json`);

                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf-8');
                    config = JSON.parse(fileData);
                } else {
                    await createConfig(client, guild.id);
                    continue;
                }

                // If the server has the hourly rank updates enabled, then update the roles
                if (config.updateRoles) {
                    console.log(`Updating roles for ${guild}`);
                    const response = await updateRoles(guild);

                    // Only send a message if log channel is enabled and valid and any changes were made.
                    if (
                        response.length !== 0 &&
                        config.logMessages &&
                        config.logChannel
                    ) {
                        const embeds = [];
                        const row = new ActionRowBuilder();

                        if (response.length > 5) {
                            const pages = [];
                            for (let i = 0; i < response.length; i += 5) {
                                pages.push(response.slice(i, i + 5));
                            }

                            for (const page of pages) {
                                const responseEmbed = new EmbedBuilder();

                                responseEmbed
                                    .setTitle(
                                        `Updated roles for ${response.length} member${response.length !== 1 ? 's' : ''}`,
                                    )
                                    .setColor(0x00ffff);

                                for (const player of page) {
                                    let appliedChanges = 'Applied changes: \n';

                                    for (const update of player.updates) {
                                        appliedChanges += `${update}\n`;
                                    }

                                    for (const error of player.errors) {
                                        appliedChanges += `${error}\n`;
                                    }

                                    appliedChanges += `User: ${player.member}`;

                                    let name = player.username;

                                    if (!name) {
                                        name = `${player.member.user.username} Unverified`;
                                    }

                                    responseEmbed.addFields({
                                        name: `${name.replaceAll('_', '\\_')}`,
                                        value: `${appliedChanges}`,
                                    });
                                }

                                embeds.push(responseEmbed);
                            }

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
                                .setTitle(
                                    `Updated roles for ${response.length} member${response.length !== 1 ? 's' : ''}`,
                                )
                                .setColor(0x00ffff);

                            for (const player of response) {
                                let appliedChanges = 'Applied changes: \n';

                                for (const update of player.updates) {
                                    appliedChanges += `${update}\n`;
                                }

                                for (const error of player.errors) {
                                    appliedChanges += `${error}\n`;
                                }

                                appliedChanges += `User: ${player.member}`;

                                let name = player.username;

                                if (!name) {
                                    name = `${player.member.user.username} Unverified`;
                                }

                                responseEmbed.addFields({
                                    name: `${name.replaceAll('_', '\\_')}`,
                                    value: `${appliedChanges}`,
                                });
                            }

                            embeds.push(responseEmbed);
                        }

                        const channel = guild.channels.cache.get(
                            config.logChannel,
                        );

                        if (channel) {
                            try {
                                if (row.components.length > 0) {
                                    const message = await channel.send({
                                        embeds: [embeds[0]],
                                        components: [row],
                                    });

                                    messages.addMessage(
                                        message.id,
                                        new PagedMessage(message, embeds),
                                    );
                                } else {
                                    await channel.send({ embeds: [embeds[0]] });
                                }
                            } catch (error) {
                                console.log(
                                    `Failed to send update roles message to channel ${config.logChannel} in guild ${guild.id}`,
                                );
                            }
                        } else {
                            console.log(
                                `${config.logChannel} not found for guild ${guild.id}`,
                            );
                        }
                    }

                    console.log(`Updated roles for ${guild}`);
                } else {
                    continue;
                }
            } catch (err) {
                console.log(`Error checking config for guild ${guild.id}`);
            }
        }
    }

    if (now.getUTCHours() == 0) {
        // For each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                // Get the config file for that server
                let config = {};

                const directoryPath = path.join(__dirname, '..', 'configs');
                const filePath = path.join(directoryPath, `${guild.id}.json`);

                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf-8');
                    config = JSON.parse(fileData);
                } else {
                    await createConfig(client, guild.id);
                    continue;
                }

                if (config.guild) {
                    if (
                        config.checkBannedPlayers &&
                        Object.keys(config.bannedPlayers).length > 0
                    ) {
                        const bannedPlayersInGuild =
                            await database.checkForPlayers(
                                Object.keys(config.bannedPlayers),
                                config.guild,
                            );

                        if (bannedPlayersInGuild.length > 0) {
                            const responseEmbed = new EmbedBuilder()
                                .setTitle(
                                    'The following players are banned from your guild but are currently in your guild',
                                )
                                .setDescription(
                                    `${bannedPlayersInGuild.join('\n')}`,
                                )
                                .setColor(0x00ffff);

                            const channel = guild.channels.cache.get(
                                config.logChannel,
                            );

                            if (channel) {
                                try {
                                    await channel.send({
                                        embeds: [responseEmbed],
                                    });
                                } catch (error) {
                                    console.error(
                                        `Failed to send banned players in guild message to channel ${config.logChannel} in guild ${guild.id}: `,
                                        error,
                                    );
                                }
                            } else {
                                console.log(
                                    `${config.logChannel} not found for guild ${guild.id}`,
                                );
                            }
                        }
                    }

                    const guildMembers = await database.getGuildMembers(
                        config.guild,
                    );

                    for (const player of Object.keys(
                        config.inactivityExceptions,
                    )) {
                        if (!guildMembers.includes(player)) {
                            delete config['inactivityExceptions'][player];
                        }
                    }

                    for (const player of Object.keys(
                        config.promotionExceptions,
                    )) {
                        if (!guildMembers.includes(player)) {
                            delete config['promotionExceptions'][player];
                        }
                    }

                    for (const player of Object.keys(
                        config.demotionExceptions,
                    )) {
                        if (!guildMembers.includes(player)) {
                            delete config['demotionExceptions'][player];
                        }
                    }

                    for (const player of Object.keys(
                        config.promotionExceptions,
                    )) {
                        if (config.promotionExceptions[player] !== -1) {
                            if (config.promotionExceptions[player] === 1) {
                                delete config.promotionExceptions[player];
                            } else {
                                config.promotionExceptions[player] =
                                    config.promotionExceptions[player] - 1;
                            }
                        }
                    }

                    for (const player of Object.keys(
                        config.demotionExceptions,
                    )) {
                        if (config.demotionExceptions[player] !== -1) {
                            if (config.demotionExceptions[player] === 1) {
                                delete config.demotionExceptions[player];
                            } else {
                                config.demotionExceptions[player] =
                                    config.demotionExceptions[player] - 1;
                            }
                        }
                    }

                    fs.writeFileSync(
                        filePath,
                        JSON.stringify(config, null, 2),
                        'utf-8',
                    );
                }
            } catch (err) {
                console.error(
                    `Error checking config for guild ${guild.id}: `,
                    err,
                );
            }
        }
    }

    now = new Date();
    const timeUntilNextHour =
        (60 - now.getMinutes()) * 60 * 1000 -
        (now.getSeconds() * 1000 + now.getMilliseconds());

    setTimeout(hourlyTasks, timeUntilNextHour);
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(_client) {
        await database.setup();

        client = _client;
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // Set a custom activity for the bot
        client.user.setPresence({
            activities: [
                {
                    name: 'over Corkus Island',
                    type: ActivityType.Watching,
                },
            ],
            status: 'online',
        });

        // Update members of each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.members.fetch({ time: 30000 });
            } catch (error) {
                console.error('Failed to fetch guild members: ' + error);
            }

            const guildOwner = await guild.fetchOwner();
            console.log(
                `I am in the server ${guild} owned by ${guildOwner.user.username}`,
            );
        }

        // Calculate time to run first hourly task at
        const now = new Date();
        const timeUntilNextHour =
            (60 - now.getUTCMinutes()) * 60 * 1000 -
            (now.getUTCSeconds() * 1000 + now.getUTCMilliseconds());

        setTimeout(() => {
            hourlyTasks();
        }, timeUntilNextHour);
    },
};
