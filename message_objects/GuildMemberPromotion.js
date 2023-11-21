class GuildMemberPromotion {
    // Creates a GuildMemberPromotion object
    // username: Username of the guild member
    // guildRank: Their current guild rank
    // contributedGuildXP: How much XP have they contributed to the guild
    // highestClassLevel: Highest combat level of any of their classes
    // contributionPos: What position in the guild are they for contributed XP
    // daysInGuild: How many days they've been in the guild for
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // chiefRequirements: The values for each Chief promotion requirement
    // strategistRequirements: The values for each Strategist promotion requirement
    // captainRequirements: The values for each Captain promotion requirement
    // recruiterRequirements: The values for each Recruiter promotion requirement
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        this.username = username;
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.daysInGuild = daysInGuild;
        this.promotionStatus = '';

        this.checkForPromotion(promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
    }

    // Check for a promotion of each rank
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // chiefRequirements: The values for each Chief promotion requirement
    // strategistRequirements: The values for each Strategist promotion requirement
    // captainRequirements: The values for each Captain promotion requirement
    // recruiterRequirements: The values for each Recruiter promotion requirement
    checkForPromotion(promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        // Chiefs can't be promoted
        if (this.guildRank === 'CHIEF') {
            return;
        }

        // Loop through the requirements of each rank and check if they should be promoted
        // Check highest first as if they qualify for that, no need to check rest
        for (let i = 0; i < promotionRequirements.length; i++) {
            // Rank has no promotion requirement, skip to next
            if (promotionRequirements[i].includes('NONE')) {
                continue;
            }

            // Promotion requirement found
            if (this.promotionStatus !== '') {
                break;
            }

            switch (i) {
                case 0:
                    // If not a chief check if they should be promoted
                    if (this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('CHIEF', promotionRequirements[i], chiefRequirements);
                    }
                    break;
                case 1:
                    // If not a chief or strategist check if they should be promoted
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('STRATEGIST', promotionRequirements[i], strategistRequirements);
                    }
                    break;
                case 2:
                    // If not a chief, strategist or captain check if they should be promoted
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN') {
                        this.promotionStatus = this.shouldBePromoted('CAPTAIN', promotionRequirements[i], captainRequirements);
                    }
                    break;
                case 3:
                    // If not a chief, strategist, captain or recruiter check if they should be promoted
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN' && this.guildRank !== 'RECRUITER') {
                        this.promotionStatus = this.shouldBePromoted('RECRUITER', promotionRequirements[i], recruiterRequirements);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // Check if the player should be promoted to a rank based on the requirements
    // rankToPromote: The rank to check for promotion
    // promotionRequirements: What are the requirements for promotion. Eg. xp, level, top or time
    // rankRequirements: What are the actual values for the requirement of each type
    shouldBePromoted(rankToPromote, promotionRequirements, rankRequirements) {
        let promote = false;
        let reason = '';

        // If xp is a requirement
        if (promotionRequirements.includes('XP')) {
            // If they've contributed more or equal to the amount required
            if (this.contributedGuildXP >= rankRequirements[0]) {
                promote = true;
                reason = `Contributed more than ${rankRequirements[0]} XP`;
            }
        }

        // If highest combat level is a requirement
        if (promotionRequirements.includes('LEVEL')) {
            // If their highest combat level is more or equal to the required level
            if (this.highestClassLevel >= rankRequirements[1]) {
                promote = true;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Highest class level is higher than ${rankRequirements[1]}`;
                } else {
                    reason += `, highest class level is higher than ${rankRequirements[1]}`;
                }
            }
        }

        // If top contributor is a requirement
        if (promotionRequirements.includes('TOP')) {
            // If their contribution position is higher or equal to the required position
            if (this.contributionPos <= rankRequirements[2]) {
                promote = true;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Contribution position higher than ${rankRequirements[2]}`;
                } else {
                    reason += `, contribution position higher than ${rankRequirements[2]}`;
                }
            }
        }

        // If time in guild is a requirement
        // Unlike the others, time overwrites the others so if they qualify for other requirements but not time, they shouldn't be promoted
        if (promotionRequirements.includes('TIME')) {
            // If not been in the guild long enough, deny promotion
            if (this.daysInGuild < rankRequirements[3]) {
                promote = false;
            }
        }

        // Return promotion message
        if (promote) {
            return `${this.username} should be promoted to ${rankToPromote} for: ${reason}\n`;
        } else {
            return '';
        }
    }

    // Returns the string of what rank someone should be promoted to and why if they should be
    toString() {
        return this.promotionStatus;
    }
}

module.exports = GuildMemberPromotion;
