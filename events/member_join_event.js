const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const configUtils = require('../functions/config_utils');

module.exports = {
    name: Events.GuildMemberAdd,
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
                    `${config['joinMessage'].replace(/\\n/g, '\n').replace('$user$', member.user)}`,
                );
            }

            // Don't add unverified role to bots
            if (member.user.bot) return;

            const unverifiedRole = guild.roles.cache.get(
                config['unverifiedRole'],
            );

            if (unverifiedRole) {
                await member.roles
                    .add(unverifiedRole)
                    .then(() => {
                        console.log(
                            `Added unverified role ${unverifiedRole.name} to ${member.user.username}`,
                        );
                    })
                    .catch(() => {
                        console.error(
                            `Failed to add unverified role ${unverifiedRole.name} to ${member.user.username}`,
                        );
                    });
            }
        } catch (error) {
            console.error(
                `Failed to read config file for guild ${guildId}: `,
                error,
            );
        }
    },
};
