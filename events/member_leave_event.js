const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const configUtils = require('../functions/config_utils');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        const guild = member.guild;
        const guildId = guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            'configs',
            `${guildId}.json`,
        );

        // Don't do anything when the bot leaves the server
        if (member.client.user.id === member.id) {
            return;
        }

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(member.client, guildId);
                return;
            }

            const sendJoinLeaveMessages = config['sendJoinLeaveMessages'];

            if (sendJoinLeaveMessages) {
                const channel = guild.channels.cache.get(
                    config['joinLeaveChannel'],
                );

                await channel.send(
                    `${config['leaveMessage'].replace(/\\n/g, '\n').replace('$user$', member.user.username)}`,
                );
            }
        } catch (error) {
            console.error(
                `Failed to read config file for guild ${guildId}: `,
                error,
            );
        }
    },
};
