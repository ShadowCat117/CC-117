class OnlineGuildMember {
    // Creates a OnlineGuildMember object
    // playerName: name of the player
    // guildRank: Guild rank of the player
    // onlineWorld: What world the player is currently on
    constructor(playerName, guildRank, onlineWorld) {
        this.playerName = playerName;
        this.guildRank = guildRank;
        this.onlineWorld = onlineWorld;
    }

    // Returns a formatted string for the players online state
    toString() {
        return `${this.playerName.padEnd(16)} (${this.guildRank}) is currently online on ${this.onlineWorld}!\n`;
    }
}

module.exports = OnlineGuildMember;
