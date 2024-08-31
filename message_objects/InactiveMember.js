class InactiveMember {
    // Creates an InactiveMember object
    // username: Username of the guild member
    // guildRank: Guild rank of the member
    // daysSinceLastLogin: How many days since the player last logged in
    // averagePlaytime: Average weekly playtime of the player
    // weeklyPlaytime: How many hours the player has played this week
    // threshold: The custom inactivity threshold if the player has one
    constructor(
        username,
        guildRank,
        daysSinceLastLogin,
        averagePlaytime,
        weeklyPlaytime,
        threshold = -1,
    ) {
        this.username = username.replaceAll('_', '\\_');
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.daysSinceLastLogin = daysSinceLastLogin;
        this.averagePlaytime = parseFloat(averagePlaytime.toFixed(2));
        this.weeklyPlaytime = parseFloat(weeklyPlaytime.toFixed(2));
        this.threshold = threshold;
    }
}

module.exports = InactiveMember;
