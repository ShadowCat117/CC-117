class PlayerLastLogin {
    constructor(playerName, guildRank, highestClassLevel, daysSinceLastLogin, isOnline, displayColours, inactiveThreshold) {
        this.playerName = playerName;
        this.guildRank = guildRank;
        this.highestClassLevel = highestClassLevel;
        this.daysSinceLastLogin = daysSinceLastLogin;
        this.isOnline = isOnline;
        this.displayColours = displayColours;
        this.inactiveThreshold = inactiveThreshold;
    }

    toString() {
        if (this.displayColours) {
            const colour = this.getColour();

            if (this.isOnline) {
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) is currently online!\n`;
            } else if (this.daysSinceLastLogin == 1) {
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} day!\n`;
            } else if (this.daysSinceLastLogin == 0) {
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) was last online today!\n`;
            } else {
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} days!\n`;
            }
        } else {
            if (this.isOnline) {
                return `${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) is currently online!\n`;
            } else if (this.daysSinceLastLogin == 1) {
                return `${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} day!\n`;
            } else if (this.daysSinceLastLogin == 0) {
                return `${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) was last online today!\n`;
            } else {
                return `${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} days!\n`;
            }
        }
    }

    getColour() {
        if (this.daysSinceLastLogin > this.inactiveThreshold) {
            return '-';
        } else {
            return '+';
        }
    }

    compareTo(other) {
        if (this.daysSinceLastLogin > other.daysSinceLastLogin) {
            return -1;
        } else if (this.daysSinceLastLogin < other.daysSinceLastLogin) {
            return 1;
        } else {
            if (this.isOnline && !other.isOnline) {
                return 1;
            } else if (!this.isOnline && other.isOnline) {
                return -1;
            } else {
                return 0;
            }
        }
    }
}

module.exports = PlayerLastLogin;
