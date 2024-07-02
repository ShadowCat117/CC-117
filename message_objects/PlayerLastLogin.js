class PlayerLastLogin {
    // Creates a PlayerLastLogin object
    // username: name of the player
    // guildRank: Guild rank of the player
    // online: If the player is currently online
    // lastLogin: Timestamp for when the player last logged in
    constructor(username, guildRank, online, lastLogin) {
        this.username = username.replaceAll('_', '\\_');
        // Capitalise the first letter as the database stores full lower case
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.online = online;
        this.lastLogin = lastLogin;
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
