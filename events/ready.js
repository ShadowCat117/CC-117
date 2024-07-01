const { ActivityType, Events } = require('discord.js');
const updateRoles = require('../functions/update_roles');
const database = require('../database/database');
const fs = require('fs');
const path = require('path');
const MessageManager = require('../message_type/MessageManager');
let client;

// Tasks to be ran every hour
async function hourlyTasks() {
    let now = new Date();

    if (now.getUTCMinutes() == 0) {
        // Update members of each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            await guild.members.fetch();
        }

        // Remove buttons from old message buttons.
        console.log('Removing old buttons');
        MessageManager.removeOldMessages();

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
                }

                // If the server has the hourly rank updates enabled, then update the roles
                if (config.updateRoles) {
                    console.log(`Updating roles for ${guild}`);
                    const response = await updateRoles(guild);

                    // Only send a message to their log channel if any members were updated
                    // and currently ignore the problem message whilst it's persisting a lot
                    if (response !== 'Updated roles for 0 members.' && response !== 'Updated roles for 0 members. (interrupted)' && response !== 'Problem updating roles') {
                        MessageManager.sendMessage(guild, config.logChannel, response);
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

    now = new Date();
    const timeUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds());

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
            activities: [{
                name: 'over Corkus Island',
                type: ActivityType.Watching,
            }],
            status: 'online',
        });

        // Update members of each server the bot is in
        for (const guild of client.guilds.cache.values()) {
            await guild.members.fetch();
        }

        // Calculate time to run first hourly task at
        const now = new Date();
        const timeUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds());

        setTimeout(() => {
            hourlyTasks();
        }, timeUntilNextHour);
    },
};
