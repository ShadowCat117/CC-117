const utilities = require('../functions/utilities');

class VerifiedMember {
    // Creates a verified member object for if a player has a verified member in the Discord
    // username: Username of the guild member
    // members: Members of the Discord server
    constructor(username, members) {
        this.username = username.replaceAll('_', '\\_');
        this.members = members;

        this.findDiscordUser(username);
    }

    async findDiscordUser(username) {
        const serverMember = await utilities.findDiscordUser(
            this.members,
            username,
        );

        if (serverMember) {
            this.verifiedMember = serverMember.id;
        } else {
            this.verifiedMember = null;
        }
    }
}

module.exports = VerifiedMember;
