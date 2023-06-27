const { ActivityType, Events } = require('discord.js');
const updateRanks = require('../functions/update_ranks');
const fs = require('fs');
const path = require('path');
const sendMessage = require('../functions/send_message');
const { Worker } = require('worker_threads');
let client;

async function updateGuildRoles() {
  let now = new Date();

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
    const millisecondsToNextMidnight = (24 * 60 * 60 * 1000) - (now.getTime() % (24 * 60 * 60 * 1000));
  
    setTimeout(updateGuildRoles, millisecondsToNextMidnight);
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
    const secondsRemaining = 60 - now.getUTCSeconds();

    setTimeout(() => {
      new Worker('./functions/scheduled_tasks.js');
      updateGuildRoles();
    }, secondsRemaining * 1000);
  },
};
