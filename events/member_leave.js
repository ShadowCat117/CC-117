const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        const guild = member.guild;
        const guildId = guild.id;
        const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

        // Don't do anything when the bot leaves the server
        if (member.client.user.id === member.id) {
            return;
        }

        if (fs.existsSync(filePath)) {
            try {
                fs.readFile(filePath, 'utf-8', (error, fileData) => {
                    if (error) {
                        console.log(`Error reading the JSON file for guild ${guildId}: ${error}`);
                        return;
                    }

                    try {
                        // Get the config file for the server
                        const config = JSON.parse(fileData);
                        // Get the channel to send leave messages in
                        const joinLeaveChannelId = config.joinLeaveChannel;
                        // See whether a message should be sent when a member leaves
                        const sendJoinLeaveMessages = config.sendJoinLeaveMessages;

                        // If no message sent, do nothing
                        if (!sendJoinLeaveMessages) {
                            return;
                        }

                        // Get the message to send when a member leaves
                        const leaveMessage = config.leaveMessage;

                        if (joinLeaveChannelId) {
                            guild.fetch().then(() => {
                                // Replace $user$ with the username of the member who left if present.
                                // Then send the message
                                if (leaveMessage.includes('$user$')) {
                                    const userLeaveMessage = leaveMessage.replace('$user$', member.user.username.replace(/_/g, '\\_'));
                                } else {
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
