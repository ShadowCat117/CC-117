const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configUtils = require('../functions/config_utils');
const applyRoles = require('../functions/apply_roles');

module.exports = {
    name: Events.UserUpdate,
    once: false,
    async execute(oldUser, newUser) {
        if (
            oldUser.displayName === newUser.displayName &&
            oldUser.username === newUser.username
        ) {
            return;
        }

        const client = newUser.client;

        for (const guild of client.guilds.cache.values()) {
            const member = guild.members.cache.get(newUser.id);
            if (!member) continue; // Not a mutual guild

            try {
                // Load config file for the guild
                const configPath = path.join(
                    __dirname,
                    '..',
                    'configs',
                    `${guild.id}.json`,
                );
                let config = {};

                if (fs.existsSync(configPath)) {
                    const fileData = fs.readFileSync(configPath, 'utf-8');
                    config = JSON.parse(fileData);
                } else {
                    await configUtils.createConfig(client, guild.id);
                    continue;
                }

                if (config.doubleVerification) {
                    console.log(
                        `Unverifying ${newUser.username} in ${guild.name}`,
                    );
                    await applyRoles(guild, member, null);
                }
            } catch (err) {
                console.error(
                    `Error handling user update in guild ${guild.id}:`,
                    err,
                );
            }
        }
    },
};
