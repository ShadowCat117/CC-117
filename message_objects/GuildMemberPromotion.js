class GuildMemberPromotion {
    // Creates a GuildMemberPromotion object
    // username: Username of the guild member
    // guildRank: Their current guild rank
    // contributedGuildXP: How much XP have they contributed to the guild
    // highestClassLevel: Highest combat level of any of their classes
    // contributionPos: What position in the guild are they for contributed XP
    // daysInGuild: How many days they've been in the guild for
    // wars: How many wars has the player participated in
    // hasBuildRole: Does the player have one of the war build roles in the Discord server
    // playtime: How many hours per week does the player play on average
    // hasEcoRole: Does the player have the eco role in the Discord server
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // requirementsCount: How many requirements must be met to get this promotion
    // chiefRequirements: The values for each Chief promotion requirement
    // strategistRequirements: The values for each Strategist promotion requirement
    // captainRequirements: The values for each Captain promotion requirement
    // recruiterRequirements: The values for each Recruiter promotion requirement
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, wars, hasBuildRole, playtime, hasEcoRole, promotionRequirements, requirementsCount, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        this.username = username;
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.daysInGuild = daysInGuild;
        this.wars = wars;
        this.hasBuildRole = hasBuildRole;
        this.playtime = playtime;
        this.hasEcoRole = hasEcoRole;
        this.promotionStatus = '';

        this.checkForPromotion(promotionRequirements, requirementsCount, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
    }

    // Check for a promotion of each rank
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // requirementsCount: How many requirements must be met to get this promotion
    // chiefRequirements: The values for each Chief promotion requirement
    // strategistRequirements: The values for each Strategist promotion requirement
    // captainRequirements: The values for each Captain promotion requirement
    // recruiterRequirements: The values for each Recruiter promotion requirement
    checkForPromotion(promotionRequirements, requirementsCount, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
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

            // Promotion found
            if (this.promotionStatus !== '') {
                break;
            }

            switch (i) {
                case 0:
                    // If not a chief check if they should be promoted to chief
                    if (this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('CHIEF', promotionRequirements[i], requirementsCount[i], chiefRequirements);
                    }
                    break;
                case 1:
                    // If not a chief or strategist check if they should be promoted to strategist
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('STRATEGIST', promotionRequirements[i], requirementsCount[i], strategistRequirements);
                    }
                    break;
                case 2:
                    // If not a chief, strategist or captain check if they should be promoted to captain
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN') {
                        this.promotionStatus = this.shouldBePromoted('CAPTAIN', promotionRequirements[i], requirementsCount[i], captainRequirements);
                    }
                    break;
                case 3:
                    // If not a chief, strategist, captain or recruiter check if they should be promoted to recruiter
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN' && this.guildRank !== 'RECRUITER') {
                        this.promotionStatus = this.shouldBePromoted('RECRUITER', promotionRequirements[i], requirementsCount[i], recruiterRequirements);
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
    // requirementsCount: How many requirements must be met to be eligible for this promotion
    // rankRequirements: What are the actual values for the requirement of each type
    shouldBePromoted(rankToPromote, promotionRequirements, requirementsCount, rankRequirements) {
        let promote = false;
        let reason = '';
        let metRequirements = 0;

        // Hard requirement, members must be in the guild for X days to qualify for this promotion
        if (this.daysInGuild < rankRequirements[0]) {
            return '';
        }

        // If xp is a requirement
        if (promotionRequirements.includes('XP')) {
            // If they've contributed more or equal to the amount required
            if (this.contributedGuildXP >= rankRequirements[1]) {
                promote = true;
                metRequirements++;
                reason = `Contributed more than ${rankRequirements[1]} XP`;
            }
        }

        // If highest combat level is a requirement
        if (promotionRequirements.includes('LEVEL')) {
            // If their highest combat level is more or equal to the required level
            if (this.highestClassLevel >= rankRequirements[2]) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Highest class level is higher than ${rankRequirements[2]}`;
                } else {
                    reason += `, highest class level is higher than ${rankRequirements[2]}`;
                }
            }
        }

        // If top contributor is a requirement
        if (promotionRequirements.includes('TOP')) {
            // If their contribution position is higher or equal to the required position
            if (this.contributionPos <= rankRequirements[3]) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Contribution position higher than ${rankRequirements[3]}`;
                } else {
                    reason += `, contribution position higher than ${rankRequirements[3]}`;
                }
            } else {
                if (this.username === 'AutumnLeaf_') {
                    console.log(`Not top ${rankRequirements[3]}, instead ${this.contributionPos}`);
                }
            }
        }

        // If time in guild is a requirement
        if (promotionRequirements.includes('TIME')) {
            if (this.daysInGuild >= rankRequirements[4]) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Has been in the guild for ${rankRequirements[4]} days`;
                } else {
                    reason += `, has been in the guild for ${rankRequirements[4]} days`;
                }
            }
        }

        // If wars is a requirement
        if (promotionRequirements.includes('WARS')) {
            if (this.wars >= rankRequirements[5]) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Has participated in ${rankRequirements[5]} wars`;
                } else {
                    reason += `, has participated in ${rankRequirements[5]} wars`;
                }
            }
        }

        // If war build is a requirement
        if (promotionRequirements.includes('BUILD')) {
            if (this.hasBuildRole) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = 'Has a war build';
                } else {
                    reason += ', has a war build';
                }
            }
        }

        // If playtime is a requirement
        if (promotionRequirements.includes('PLAYTIME')) {
            if (this.playtime >= rankRequirements[7]) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = `Has an average weekly playtime over ${rankRequirements[7]} hrs/week`;
                } else {
                    reason += `, has an average weekly playtime over ${rankRequirements[7]} hrs/week`;
                }
            }
        }

        // If eco is a requirement
        if (promotionRequirements.includes('ECO')) {
            if (this.hasEcoRole) {
                promote = true;
                metRequirements++;
                // Append reason is there already is a promotion reason
                if (reason === '') {
                    reason = 'Knows/is willing to learn eco';
                } else {
                    reason += ', knows/is willing to learn eco';
                }
            }
        }

        if (metRequirements < requirementsCount) {
            promote = false;
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
