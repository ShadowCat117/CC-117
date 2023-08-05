class VerifiedMember {
    constructor(playerName, members) {
        this.playerName = playerName;
        this.members = members;

        this.isVerified();
    }

    isVerified() {
        for (const serverMember of this.members) {
            if (serverMember.user.bot) {
                continue;
            }

            let nickname = undefined;

            if (serverMember.nickname) {
                nickname = serverMember.nickname.split(' [')[0];
            }

            if (this.playerName === serverMember.user.username || this.playerName === serverMember.user.globalName || this.playerName === nickname) {
                this.verifiedMember = serverMember.user.username;
                break;
            }
        }
    }

    toString() {
        if (this.verifiedMember) {
            return `+ Guild Member ${this.playerName} is verified as ${this.verifiedMember}.\n`;
        } else {
            return `- Guild Member ${this.playerName} is not verified.\n`;
        }
    }
}

module.exports = VerifiedMember;
