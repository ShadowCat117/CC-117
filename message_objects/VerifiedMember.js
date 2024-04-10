class VerifiedMember {
    // Creates a verified member object for if a player has a verified member in the discord
    // playerName: Username of the guild member
    // members: Members of the Discord server
    constructor(playerName, members) {
        this.playerName = playerName;
        this.members = members;

        this.isVerified();
    }

    // Checks if there is a Discord server member with a matching name of the guild member
    isVerified() {
        for (const serverMember of this.members) {
            if (serverMember.user.bot) {
                continue;
            }

            if (this.playerName === serverMember.user.username || this.playerName === serverMember.user.globalName || this.playerName === serverMember.nickname) {
                this.verifiedMember = serverMember.user.username;
                break;
            }
        }
    }

    // Returns a string for if the member has someone in the Discord server matching this username
    toString() {
        if (this.verifiedMember) {
            return `+ Guild Member ${this.playerName} is verified as @${this.verifiedMember}.\n`;
        } else {
            return `- Guild Member ${this.playerName} is not verified.\n`;
        }
    }
}

module.exports = VerifiedMember;
