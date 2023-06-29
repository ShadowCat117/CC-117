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
  }

  if (now.getUTCHours() === 0 && now.getUTCMinutes() == 0) {
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
      const timeUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds());

      setTimeout(() => {
          hourlyTasks();
      }, timeUntilNextHour);
  },
};
