class OnlineGuildMember {
    // Creates a OnlineGuildMember object
    // username: Member username
    // guildRank: Guild rank of the player
    // server: What server the player is currently on
    constructor(username, guildRank, server) {
        this.username = username.replaceAll('_', '\\_');
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.server = server;
    }

    // Compare an online player with another for sorting.
    // First sort by guild rank, Owner, Chief, Strategist, Captain, Recruiter, Recruit
    // Then sort by world number
    // Then sort by username
    compareTo(other) {
        const rankOrder = ['Owner', 'Chief', 'Strategist', 'Captain', 'Recruiter', 'Recruit'];
        const thisRankIndex = rankOrder.indexOf(this.guildRank);
        const otherRankIndex = rankOrder.indexOf(other.guildRank);
    
        if (thisRankIndex < otherRankIndex) {
            return -1;
        } else if (thisRankIndex > otherRankIndex) {
            return 1;
        } else {
            const worldNumber = parseInt(this.server.split('WC')[1], 10);
            const otherWorldNumber = parseInt(other.server.split('WC')[1], 10);
    
            if (worldNumber < otherWorldNumber) {
                return -1;
            } else if (worldNumber > otherWorldNumber) {
                return 1;
            } else {
                return this.username.localeCompare(other.username);
            }
        }
    }
    
    
}

module.exports = OnlineGuildMember;
