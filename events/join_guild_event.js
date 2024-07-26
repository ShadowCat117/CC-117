const { Events } = require('discord.js');
const createConfig = require('../functions/create_config');

module.exports = {
    name: Events.GuildCreate,
    once: false,
    execute(guild) {
        // Create a new config file for the newly joined server
        createConfig(guild.client, guild.id);
    },
};
