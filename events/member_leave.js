const fs = require('fs');
const path = require('path');
const {
    Events,
} = require('discord.js');
const sendMessage = require('../functions/send_message');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        const guild = member.guild;
        const guildId = guild.id;
        const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

        if (fs.existsSync(filePath)) {
            try {
                fs.readFile(filePath, 'utf-8', (error, fileData) => {
                    if (error) {
                        console.log(`Error reading the JSON file for guild ${guildId}: ${error}`);
                        return;
                    }

                    try {
                        const config = JSON.parse(fileData);
                        const joinLeaveChannelId = config.joinLeaveChannel;
                        const sendJoinLeaveMessages = config.sendJoinLeaveMessages;

                        if (!sendJoinLeaveMessages) {
                            return;
                        }

                        const leaveMessage = config.leaveMessage;

                        if (joinLeaveChannelId) {
                            guild.fetch().then(() => {
                                if (leaveMessage.includes('$user$')) {
                                    const userLeaveMessage = leaveMessage.replace('$user$', member.user.username.replace(/_/g, '\\_'));
                                    sendMessage(guild, joinLeaveChannelId, userLeaveMessage);
                                } else {
                                    sendMessage(guild, joinLeaveChannelId, leaveMessage);
                                }
                            });
                        } else {
                            console.log(`Join/Leave channel not specified for guild ${guildId}`);
                        }
                    } catch (parseError) {
                        console.log(`Error parsing the JSON file for guild ${guildId}: ${parseError}`);
                    }
                });
            } catch (error) {
                console.log(`Error reading the JSON file for guild ${guildId}: ${error}`);
            }
        } else {
            console.log(`Config file not found for guild ${guildId}`);
        }
    },
};
