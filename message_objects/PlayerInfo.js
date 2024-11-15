class PlayerInfo {
    // Creates a PlayerInfo object
    // username: Player username
    // guildUuid: UUID of the guild the player is in
    // guildPrefix: Prefix of the guild the player is in
    // guildRank: Rank of the player in their guild
    // supportRank: Support rank of the player
    // veteran: If the player is a veteran or not
    // serverRank: Server rank of the player
    // highestCharacterLevel: Highest character level of the player
    constructor(
        username,
        guildUuid,
        guildPrefix,
        guildRank,
        supportRank,
        veteran,
        serverRank,
        highestCharacterLevel,
    ) {
        this.username = username;
        this.guildUuid = guildUuid;
        this.guildPrefix = guildPrefix;
        this.guildRank = guildRank;
        this.supportRank = supportRank;
        this.veteran = veteran;
        this.serverRank = serverRank;
        this.highestCharacterLevel = highestCharacterLevel;
    }
}

module.exports = PlayerInfo;
