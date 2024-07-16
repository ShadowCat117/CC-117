class PlayerInfo {
    // Creates a PlayerInfo object
    // username: Player username
    // guildName: Name of the guild the player is in
    // guildPrefix: Prefix of the guild the player is in
    // guildRank: Rank of the player in their guild
    // supportRank: Support rank of the player
    // veteran: If the player is a veteran or not
    // serverRank: Server rank of the player
    // highestCharacterLevel: Highest character level of the player
    constructor(username, guildName, guildPrefix, guildRank, supportRank, veteran, serverRank, highestCharacterLevel) {
        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (username === 'Owen_Rocks_3') {
            this.username = 'Amber\\_Rocks\\_3';
        } else {
            this.username = username.replaceAll('_', '\\_');
        }

        this.guildName = guildName;
        this.guildPrefix = guildPrefix;
        this.guildRank = guildRank;
        this.supportRank = supportRank;
        this.veteran = veteran;
        this.serverRank = serverRank;
        this.level = highestCharacterLevel;
    }
}

module.exports = PlayerInfo;
