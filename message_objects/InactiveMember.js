class InactiveMember {
    // Creates an InactiveMember object
    // username: Username of the guild member
    // guildRank: Guild rank of the member
    // daysSinceLastLogin: How many days since the player last logged in
    // threshold: The custom inactivity threshold if the player has one
    constructor(username, guildRank, daysSinceLastLogin, threshold = -1) {
        this.username = username.replaceAll('_', '\\_');
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.daysSinceLastLogin = daysSinceLastLogin;
        this.threshold = threshold;
    }
}

module.exports = InactiveMember;
