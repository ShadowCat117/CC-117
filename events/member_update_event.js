const {
    Events,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(oldMember, newMember) {
        if (oldMember.nickname === newMember.nickname) return;
        if (oldMember.id === oldMember.guild.ownerId) return;

        const guild = newMember.guild;
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
                        // Get config file for server
                        const config = JSON.parse(fileData);

                        // If they don't care about duplicate nicknames, ignore
                        if (!config.checkDuplicateNicknames) return;

                        // Check if new nickname is valid
                        const validChange = await validUsername(newMember, guild);

                        // If not valid, set nickname to old nickname
                        // or no nickname if they did not have a previous nickname
                        if (!validChange) {
                            const oldNickname = oldMember.nickname;

                            // Attempt to change nickname, will fail if missing permissions
                            try {
                                if (oldNickname) {
                                    newMember.setNickname(oldNickname);
                                } else {
                                    newMember.setNickname(null);
                                }
                            } catch (ex) {
                            }
                        }
                    } catch (fileError) {
                        console.log(fileError);
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    },
};

// Check if a username is valid, as in does the new nickname match the username, display name and nickname of any existing server member
// newMember: The member who is trying to change their username
// guild: The Discord server they are changing their nickname in
async function validUsername(newMember, guild) {
    // Temporary fix to stop others verifying as friends old name
    if (newMember.nickname && newMember.nickname.toLowerCase() === 'owen_rocks_3') return false;

    // Loop through all members of the server
    for (const member of guild.members.cache) {
        // If member is same as member changing nickname, ignore
        // member[0] is member ID
        if (member[0] === newMember.id) {
            continue;
        }

        const nicknameToChange = newMember.nickname;
        const nicknameToCheck = member[1].nickname;
        const usernameToCheck = member[1].user.username;

        // If new nickname matches any variation of an existing member, return false
        if (nicknameToChange && (nicknameToChange.toLowerCase() === (nicknameToCheck || '').toLowerCase() || nicknameToChange.toLowerCase() === usernameToCheck.toLowerCase())) {
            return false;
        }
    }

    return true;
}
