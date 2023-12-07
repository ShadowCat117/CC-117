const {
    ActivityType,
    Events,
} = require('discord.js');
const updateRanks = require('../functions/update_ranks');
const fs = require('fs');
const path = require('path');
const sendMessage = require('../functions/send_message');
const MessageManager = require('../message_type/MessageManager');
let client;

async function hourlyTasks() {
    let now = new Date();

    if (now.getUTCMinutes() == 0) {
        // Remove buttons from old message buttons.
        console.log('Removing old buttons');
        MessageManager.removeOldMessages();
    } else if (now.getUTCMinutes() == 30) {
        for (const guild of client.guilds.cache.values()) {
            try {
                let config = {};

                const directoryPath = path.join(__dirname, '..', 'configs');
                const filePath = path.join(directoryPath, `${guild.id}.json`);

                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf-8');
                    config = JSON.parse(fileData);
                }

                if (config.updateRanks) {
                    console.log(`Updating ranks for ${guild}`);
                    const response = await updateRanks(guild);

                    if (response !== 'Updated roles for 0 members.') {
                        sendMessage(guild, config.logChannel, response);
                    }
                    console.log(`Updated ranks for ${guild}`);
                } else {
                    continue;
                }
            } catch (err) {
                console.log(`Error checking config for guild ${guild.id}`);
            }
        }
    }

    now = new Date();
    const minutesUntilNextHalfHour = 30 - now.getMinutes() % 30;
    const timeUntilNextHalfHour = (minutesUntilNextHalfHour * 60 * 1000) - (now.getSeconds() * 1000 + now.getMilliseconds());

    setTimeout(hourlyTasks, timeUntilNextHalfHour);
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(_client) {
        client = _client;
        console.log(`Ready! Logged in as ${client.user.tag}`);

        client.user.setPresence({
            activities: [{
                name: 'over Corkus Island',
                type: ActivityType.Watching,
            }],
            status: 'online',
        });

        for (const guild of client.guilds.cache.values()) {
            await guild.members.fetch();
        }

        const now = new Date();
        const minutesUntilNextHalfHour = 30 - now.getMinutes() % 30;
        const timeUntilNextHalfHour = (minutesUntilNextHalfHour * 60 * 1000) - (now.getSeconds() * 1000 + now.getMilliseconds());

        setTimeout(() => {
            hourlyTasks();
        }, timeUntilNextHalfHour);
    },
};
