const fs = require('fs').promises;
const path = require('path');

async function createConfig(client, guildId) {
  const directoryPath = path.join(__dirname, '..', 'configs');
  const filePath = path.join(directoryPath, `${guildId}.json`);

  try {
    if (!await fs.access(directoryPath)) {
      await fs.mkdir(directoryPath);
    }

    if (!await fs.access(filePath)) {
      const guild = client.guilds.cache.get(guildId);

      const highestRole = guild.roles.cache.reduce((prev, role) => (role.position > prev.position ? role : prev));

      const defaultData = {
        adminRole: highestRole.id,
        updateRanks: false,
        changeNicknames: false,
        checkDuplicateNicknames: false,
        logChannel: null,
        logMessages: false,
        joinLeaveChannel: null,
        sendJoinLeaveMessages: false,
        joinMessage: 'Welcome to the server $user$!',
        leaveMessage: '$user$ has left the server.',
        ownerRole: null,
        chiefRole: null,
        strategistRole: null,
        captainRole: null,
        recruiterRole: null,
        recruitRole: null,
        allyOwnerRole: null,
        allyRole: null,
        championRole: null,
        heroRole: null,
        vipPlusRole: null,
        vipRole: null,
        vetRole: null,
        veteranRole: false,
        verifyMembers: false,
        unverifiedRole: null,
        memberOf: false,
        memberOfRole: null,
        chiefThreshold: 365,
        strategistThreshold: 80,
        captainThreshold: 40,
        recruiterThreshold: 25,
        recruitThreshold: 25,
        guildName: null,
        allies: [null],
        trackedGuilds: [null],
      };

      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
      console.log(`Created config file for guild ${guildId}`);
    }
  } catch (error) {
    console.log(`Error creating config file for guild ${guildId}: ${error}`);
  }
}

module.exports = createConfig;
