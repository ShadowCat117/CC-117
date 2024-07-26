const utilities = require('../functions/utilities');

class VerifiedMember {
    // Creates a verified member object for if a player has a verified member in the Discord
    // username: Username of the guild member
    // members: Members of the Discord server
    constructor(username, members) {
        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (username === 'Owen_Rocks_3') {
            this.username = 'Amber\\_Rocks\\_3';
        } else {
            this.username = username.replaceAll('_', '\\_');
        }
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
