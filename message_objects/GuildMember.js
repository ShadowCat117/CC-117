class GuildMember {
    // Creates a guild member object
    // username: Username of the guild member
    // guildRank: Guild rank of the member
    // lastJoin: How many days since the player last joined
    // contributedGuildXP: How much XP they have contributed to the guild
    // onlineWorld: What world they are currently online on
    // joinDate: When did they join the guild
    // daysInGuild: How many days they have been in the guild for
    // contributionPosition: Their contribution position
    // wars: How many wars have they participated in
    // averagePlaytime: How many hours per week does the player play
    constructor(username, guildRank, lastJoin, contributedGuildXP, onlineWorld, joinDate, daysInGuild, contributionPosition, wars, averagePlaytime) {
        this.username = username;
        this.guildRank = `(${guildRank})`;
        this.lastJoin = lastJoin;
        this.onlineWorld = onlineWorld;
        // Add commas between numbers for nicer viewing
        this.contributedGuildXP = contributedGuildXP.toLocaleString(); 
        this.joinDate = joinDate;
        this.daysInGuild = daysInGuild;
        this.contributionPosition = `${contributionPosition}.`;
        this.wars = wars;
        this.averagePlaytime = parseFloat(averagePlaytime.toFixed(2));
    }

    // Returns a formatted string of the guild member with all the stats listed
    toString() {
        if (this.averagePlaytime >= 0) {
            return `${this.contributionPosition.padEnd(3)} ${this.username} ${this.guildRank}:\n${this.getOnlineStatus()}\nJoined ${this.joinDate} (${this.daysInGuild} days ago)\n${this.contributedGuildXP} (${this.getFormattedXPPerDay()})\n${this.getWars()}\n${this.averagePlaytime} hours per week\n\n`;
        } else {
            return `${this.contributionPosition.padEnd(3)} ${this.username} ${this.guildRank}:\n${this.getOnlineStatus()}\nJoined ${this.joinDate} (${this.daysInGuild} days ago)\n${this.contributedGuildXP} (${this.getFormattedXPPerDay()})\n${this.getWars()}\n\n`;
        }
    }

    // Return a string of if the player is online and what world they are on or offline
    getOnlineStatus() {
        if (this.onlineWorld) {
            // If online
            return `Online on ${this.onlineWorld}`;
        } else if (this.lastJoin === 1) {
            // Last online yesterday
            return `Offline, last seen ${this.lastJoin} day ago`;
        } else if (this.lastJoin === 0) {
            // Last online today
            return 'Offline, last seen today.';
        } else {
            // Last online 2+ days ago
            return `Offline, last seen ${this.lastJoin} days ago`;
        }
    }

    // Format the amount of XP the player earns per day.
    getFormattedXPPerDay() {
        const contributedXP = parseFloat(this.contributedGuildXP.replace(/,/g, ''));
        const xpPerDay = contributedXP / this.daysInGuild;
    
        // Display at billions, millions, thousands per day or below
        if (xpPerDay >= 1000000000) {
            return `${(xpPerDay / 1000000000).toFixed(1)}B/day`;
        } else if (xpPerDay >= 1000000) {
            return `${(xpPerDay / 1000000).toFixed(1)}M/day`;
        } else if (xpPerDay >= 1000) {
            return `${(xpPerDay / 1000).toFixed(1)}k/day`;
        } else {
            return `${xpPerDay.toFixed(2)}/day`;
        }
    }

    // Get amount of wars completed.
    getWars() {
        if (this.wars === null) {
            return '0 wars';
        } else if (this.wars === 1) {
            return '1 war';
        } else {
            return `${this.wars} wars`;
        }
    }
}

module.exports = GuildMember;
