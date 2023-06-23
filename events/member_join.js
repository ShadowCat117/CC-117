const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const sendMessage = require('../functions/send_message');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {    
    const guild = member.guild;
    const guildId = guild.id;
    const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

    if (fs.existsSync(filePath)) {
      try {
        fs.readFile(filePath, 'utf-8', async (error, fileData) => {
          if (error) {
            console.log(`Error reading the JSON file for guild ${guildId}: ${error}`);
            return;
          }

          try {
            const config = JSON.parse(fileData);
            const joinLeaveChannelId = config.joinLeaveChannel;
            const sendJoinLeaveMessages = config.sendJoinLeaveMessages;

            if (sendJoinLeaveMessages) {
              const joinMessage = config.joinMessage;

              if (joinLeaveChannelId) {
                guild.fetch().then(async () => {
                  if (joinMessage.includes('$user$')) {
                    const userJoinMessage = joinMessage.replace('$user$', member.user);
                    sendMessage(guild, joinLeaveChannelId, userJoinMessage);
                  } else {
                    sendMessage(guild, joinLeaveChannelId, joinMessage);
                  }
                });
              } else {
                console.log(`Join/Leave channel not specified for guild ${guildId}`);
              }
            }

            const verifyMembers = config.verifyMembers;

            if (verifyMembers) {
              const unverifiedRole = guild.roles.cache.get(config.unverifiedRole);

              if (unverifiedRole) {
                member.roles.add(unverifiedRole).catch(async () => {
                  sendMessage(guild, config.logChannel, `Unable to apply unverified role to ${member.displayName}, please make sure that the CC-117 role is above all roles you want it to be able to add/remove in the hierarchy and make sure you've set the unverified role with /config_roles Unverified Role <role>`);
                });
              } else {
                sendMessage(guild, config.logChannel, `Unable to apply unverified role to ${member.displayName}. You have not set the unverified role with /config_roles Unverified Role <role>`);
              }
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
