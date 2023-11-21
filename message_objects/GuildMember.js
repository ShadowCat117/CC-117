class GuildMember {
    // Creates a guild member object
    // username: Username of the guild member
    // guildRank: Guild rank of the member
    // contributedGuildXP: How much XP they have contributed to the guild
    // onlineWorld: What world they are currently online on
    // joinDate: When did they join the guild
    // daysInGuild: How many days they have been in the guild for
    // contributionPosition: Their contribution position
    // wars: How many wars have they participated in
    constructor(username, guildRank, contributedGuildXP, onlineWorld, joinDate, daysInGuild, contributionPosition, wars) {
        this.username = username;
        this.guildRank = `(${guildRank})`;
        this.onlineWorld = onlineWorld;
        // Add commas between numbers for nicer viewing
        this.contributedGuildXP = contributedGuildXP.toLocaleString(); 
        this.joinDate = joinDate;
        this.daysInGuild = daysInGuild;
        this.contributionPosition = `${contributionPosition}.`;
        this.wars = wars;
    }

    // Returns a formatted string of the guild member with all the stats listed
    toString() {
        return `${this.contributionPosition.padEnd(3)} ${this.username} ${this.guildRank}:\n${this.getOnlineStatus()}\nJoined ${this.joinDate} (${this.daysInGuild} days ago)\n${this.contributedGuildXP} (${this.getFormattedXPPerDay()})\n${this.wars} wars\n\n`;
    }

    // Return a string of if the player is online and what world they are on or offline
    getOnlineStatus() {
        if (this.onlineWorld) {
            return `Online on ${this.onlineWorld}`;
        } else {
            return 'Offline';
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
}

module.exports = GuildMember;
