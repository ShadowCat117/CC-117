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
        return `${this.playerName.padEnd(16)} ${`(${this.guildRank})`.padEnd(12)} is currently online on ${this.onlineWorld}!\n`;
    }

    // Compare an online player with another for sorting.
    // First sort by guild rank, Owner, Chief, Strategist, Captain, Recruiter, Recruit
    // Then sort by world number
    // Then sort by username
    compareTo(other) {
        const rankOrder = ['OWNER', 'CHIEF', 'STRATEGIST', 'CAPTAIN', 'RECRUITER', 'RECRUIT'];
        const thisRankIndex = rankOrder.indexOf(this.guildRank);
        const otherRankIndex = rankOrder.indexOf(other.guildRank);
    
        if (thisRankIndex < otherRankIndex) {
            return -1;
        } else if (thisRankIndex > otherRankIndex) {
            return 1;
        } else {
            const worldNumber = parseInt(this.onlineWorld.split('WC')[1], 10);
            const otherWorldNumber = parseInt(other.onlineWorld.split('WC')[1], 10);
    
            if (worldNumber < otherWorldNumber) {
                return -1;
            } else if (worldNumber > otherWorldNumber) {
                return 1;
            } else {
                return this.playerName.localeCompare(other.playerName);
            }
        }
    }
    
    
}

module.exports = OnlineGuildMember;
