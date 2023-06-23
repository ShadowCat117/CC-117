const { Events } = require('discord.js');
const createConfig = require('../functions/create_config');

module.exports = {
  name: Events.GuildCreate,
  once: false,
  execute(guild) {
    const guildId = guild.id;
    
    createConfig(guildId);
  },
};
