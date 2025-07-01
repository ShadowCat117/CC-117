const { Events } = require('discord.js');
const configUtils = require('../functions/config_utils');

module.exports = {
    name: Events.GuildCreate,
    once: false,
    execute(guild) {
        // Create a new config file for the newly joined server
        configUtils.createConfig(guild.client, guild.id);
    },
};
