const { Events } = require('discord.js');
const utilities = require('../functions/utilities');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(oldMember, newMember) {
        if (!newMember.nickname) return;
        if (oldMember.nickname === newMember.nickname) return;
        if (oldMember.id === oldMember.guild.ownerId) return;

        const validChange = await utilities.checkValidUsername(
            newMember,
            newMember.guild,
            newMember.nickname,
        );

        if (!validChange) {
            let oldNicknameValid = false;

            if (oldMember.nickname) {
                oldNicknameValid = await utilities.checkValidUsername(
                    newMember,
                    newMember.guild,
                    oldMember.nickname,
                );
            }

            try {
                if (oldNicknameValid) {
                    newMember.setNickname(oldMember.nickname);
                } else {
                    newMember.setNickname(null);
                }
            } catch (ex) {
                console.error(
                    `Failed to change nickname for ${newMember.user.username}`,
                );
            }
        }
    },
};
