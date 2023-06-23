const { Events } = require('discord.js');
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
                        const config = JSON.parse(fileData);

                        if (!config.checkDuplicateNicknames) return;

                        const validChange = await validUsername(newMember, guild);

                        if (!validChange) {
                            const oldNickname = oldMember.nickname;

                            if (oldNickname) {
                                newMember.setNickname(oldNickname);
                            } else {
                                newMember.setNickname(null);
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

async function validUsername(newMember, guild) {
    for (const member of guild.members.cache) {
        if (member[0] === newMember.id) {
            continue;
        }

        const nicknameToChange = newMember.nickname;
        const nicknameToCheck = member[1].nickname;
        const usernameToCheck = member[1].user.username;

        if (nicknameToChange && (nicknameToChange.toLowerCase() === (nicknameToCheck || '').toLowerCase() || nicknameToChange.toLowerCase() === usernameToCheck.toLowerCase())) {
            return false;
        }
    }

    return true;
}