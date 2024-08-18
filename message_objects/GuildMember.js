const utilities = require('../functions/utilities');

class GuildMember {
    // Creates a guild member object
    // username: Username of the guild member
    // guildRank: Guild rank of the member
    // lastJoin: How many days since the player last joined
    // contributed: How much XP they have contributed to the guild
    // contributionRank: What position is the member in for contributed XP
    // online: Is the guild member currently online
    // server: What world they are currently online on
    // joinDate: When did they join the guild
    // wars: How many wars have they participated in
    // averagePlaytime: How many hours per week does the player play
    // weeklyPlaytime: How many hours the players has played in the current week
    constructor(
        username,
        guildRank,
        lastJoin,
        contributed,
        contributionRank,
        online,
        server,
        joinDate,
        wars,
        averagePlaytime,
        weeklyPlaytime,
    ) {
        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (username === 'Owen_Rocks_3') {
            this.username = 'Amber\\_Rocks\\_3';
        } else {
            this.username = username.replaceAll('_', '\\_');
        }
        this.guildRank = guildRank.charAt(0).toUpperCase() + guildRank.slice(1);
        this.lastLogin = lastJoin;
        this.online = online;
        this.server = server;
        this.contributed = contributed;
        this.localeContributed = contributed.toLocaleString();
        this.contributionRank = contributionRank;
        this.joinDate = joinDate;
        this.wars = wars.toLocaleString();
        this.averagePlaytime = parseFloat(averagePlaytime.toFixed(2));
        this.weeklyPlaytime = parseFloat(weeklyPlaytime.toFixed(2));
    }

    // Return a string of if the player is online and what world they are on or offline and time since last login
    getOnlineStatus() {
        if (this.online) {
            // If online
            return `Online on ${this.server}`;
        } else {
            return `Offline, last seen ${utilities.getTimeSince(this.lastLogin)} ago`;
        }
    }

    // Compare against another GuildMember for sorting.
    // Sort by contributionRank
    compareTo(other) {
        if (this.contributionRank < other.contributionRank) {
            return -1;
        } else {
            return 1;
        }
    }
}

module.exports = GuildMember;
