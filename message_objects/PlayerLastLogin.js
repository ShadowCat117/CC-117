class PlayerLastLogin {
    // Creates a PlayerLastLogin object
    // playerName: name of the player
    // guildRank: Guild rank of the player
    // highestClassLevel: Highest combat level on any character of the player
    // daysSinceLastLogin: How many days since the player last logged in
    // isOnline: Is the player currently online
    // isOurGuild: Is the player in the Discord servers set guild
    // inactiveThreshold: Threshold for if the player should be marked for removal or not
    constructor(playerName, guildRank, highestClassLevel, daysSinceLastLogin, isOnline, isOurGuild, inactiveThreshold) {
        this.playerName = playerName;
        this.guildRank = guildRank;
        this.highestClassLevel = highestClassLevel;
        this.daysSinceLastLogin = daysSinceLastLogin;
        this.isOnline = isOnline;
        this.isOurGuild = isOurGuild;
        this.inactiveThreshold = inactiveThreshold;
    }

    // Returns a formatted string for the players last login
    toString() {
        // Only colour if in the Discord servers guild as they will have requirements setup and highest combat level can be shown
        if (this.isOurGuild) {
            // Get the colour for the player
            const colour = this.getColour();

            if (this.isOnline) {
                // If online
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) is currently online!\n`;
            } else if (this.daysSinceLastLogin == 1) {
                // If was online yesterday
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} day!\n`;
            } else if (this.daysSinceLastLogin == 0) {
                // If was online today
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) was last online today!\n`;
            } else {
                // Inactive for 2+ days
                return `${colour} ${this.playerName.padEnd(16)} (${this.guildRank}, ${this.highestClassLevel}) has been inactive for ${this.daysSinceLastLogin} days!\n`;
            }
        } else {
            if (this.isOnline) {
                // If online
                return `${this.playerName.padEnd(16)} (${this.guildRank}) is currently online!\n`;
            } else if (this.daysSinceLastLogin == 1) {
                // If was online yesterday
                return `${this.playerName.padEnd(16)} (${this.guildRank}) has been inactive for ${this.daysSinceLastLogin} day!\n`;
            } else if (this.daysSinceLastLogin == 0) {
                // If was online today
                return `${this.playerName.padEnd(16)} (${this.guildRank}) was last online today!\n`;
            } else {
                // Inactive for 2+ days
                return `${this.playerName.padEnd(16)} (${this.guildRank}) has been inactive for ${this.daysSinceLastLogin} days!\n`;
            }
        }
    }

    // Returns text format prefix for if the player should be removed or not
    getColour() {
        if (this.daysSinceLastLogin > this.inactiveThreshold) {
            // Red, should remove
            return '-';
        } else {
            // Green, safe
            return '+';
        }
    }

    // Sort players by days since last login first, then by if they are currently online
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
