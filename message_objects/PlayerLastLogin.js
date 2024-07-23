class PlayerLastLogin {
    // Creates a PlayerLastLogin object
    // uuid: UUID of the player
    // username: Username of the player
    // guildRank: Guild rank of the player
    // online: If the player is currently online
    // lastLogin: Timestamp for when the player last logged in
    // highestCharacterLevel: Highest combat level on all the players characters
    constructor(uuid, username, guildRank, online, lastLogin, highestCharacterLevel) {
        this.uuid = uuid;

        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (username === 'Owen_Rocks_3') {
            this.username = 'Amber\\_Rocks\\_3';
        } else {
            this.username = username.replaceAll('_', '\\_');
        }

        // Capitalise the first letter as the database stores full lower case
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.online = online;
        this.lastLogin = lastLogin;
        this.highestCharacterLevel = highestCharacterLevel;
    }

    // Sort players by days since last login first, then by if they are currently online
    compareTo(other) {
        if (this.online && !other.online) {
            return 1;
        } else if (!this.online && other.online) {
            return -1;
        } else {
            if (this.lastLogin > other.lastLogin) {
                return 1;
            } else if (this.lastLogin < other.lastLogin) {
                return -1;
            }
        }
    }
}

module.exports = PlayerLastLogin;
