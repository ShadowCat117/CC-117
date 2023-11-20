class GuildMember {
    constructor(username, guildRank, contributedGuildXP, onlineWorld, joinDate, daysInGuild, contributionPosition, wars) {
        this.username = username;
        this.guildRank = `(${guildRank})`;
        this.onlineWorld = onlineWorld;
        this.contributedGuildXP = contributedGuildXP.toLocaleString(); 
        this.joinDate = joinDate;
        this.daysInGuild = daysInGuild;
        this.contributionPosition = `${contributionPosition}.`;
        this.wars = wars;
    }

    toString() {
        return `${this.contributionPosition.padEnd(3)} ${this.username.padEnd(16)} ${this.guildRank.padStart(12)}: ${this.getOnlineStatus()}
                                   Joined ${this.joinDate} (${this.daysInGuild} days ago)
                                   ${this.contributedGuildXP} (${this.getFormattedXPPerDay()})
                                   ${this.wars} wars\n`;
        // return `${this.contributionPosition.padEnd(3)} ${this.username.padEnd(16)} ${this.guildRank.padStart(12)}: ${this.contributedGuildXP} XP in ${this.daysInGuild} days (${this.getFormattedXPPerDay()})\n                                   ${this.wars} wars\n`;
    }

    getOnlineStatus() {
        if (this.onlineWorld) {
            return `Online on ${this.onlineWorld}`;
        } else {
            return 'Offline';
        }
    }

    getFormattedXPPerDay() {
        const contributedXP = parseFloat(this.contributedGuildXP.replace(/,/g, ''));
        const xpPerDay = contributedXP / this.daysInGuild;
    
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
