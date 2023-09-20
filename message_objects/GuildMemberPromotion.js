class GuildMemberPromotion {
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements, ignoreXPContributions) {
        this.username = username;
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.ignoreXPContributions = ignoreXPContributions;
        this.promotionStatus = '';

        this.checkForPromotion(promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
    }

    checkForPromotion(promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        for (let i = 0; i < promotionRequirements.length; i++) {
            if (promotionRequirements[i].includes('NONE')) {
                continue;
            }

            if (this.promotionStatus !== '') {
                continue;
            }

            switch (i) {
                case 0:
                    if (this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('CHIEF', promotionRequirements[i], chiefRequirements);
                    }
                    break;
                case 1:
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF') {
                        this.promotionStatus = this.shouldBePromoted('STRATEGIST', promotionRequirements[i], strategistRequirements);
                    }
                    break;
                case 2:
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN') {
                        this.promotionStatus = this.shouldBePromoted('CAPTAIN', promotionRequirements[i], captainRequirements);
                    }
                    break;
                case 3:
                    if (this.guildRank !== 'STRATEGIST' && this.guildRank !== 'CHIEF' && this.guildRank !== 'CAPTAIN' && this.guildRank !== 'RECRUITER') {
                        this.promotionStatus = this.shouldBePromoted('RECRUITER', promotionRequirements[i], recruiterRequirements);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    shouldBePromoted(rankToPromote, promotionRequirements, rankRequirements) {
        let promote = false;
        let reason = '';

        if (promotionRequirements.includes('XP') && !this.ignoreXPContributions) {
            if (this.contributedGuildXP >= rankRequirements[0]) {
                promote = true;
                reason = `Contributed more than ${rankRequirements[0]} XP`;
            }
        }

        if (promotionRequirements.includes('LEVEL')) {
            if (this.highestClassLevel >= rankRequirements[1]) {
                promote = true;
                if (reason === '') {
                    reason = `Highest class level is higher than ${rankRequirements[1]}`;
                } else {
                    reason += `, highest class level is higher than ${rankRequirements[1]}`;
                }
            }
        }

        if (promotionRequirements.includes('TOP') && !this.ignoreXPContributions) {
            if (this.contributionPos <= rankRequirements[2]) {
                promote = true;
                if (reason === '') {
                    reason = `Contribution position higher than ${rankRequirements[2]}`;
                } else {
                    reason += `, contribution position higher than ${rankRequirements[2]}`;
                }
            }
        }

        if (promote) {
            return `${this.username} should be promoted to ${rankToPromote} for: ${reason}\n`;
        } else {
            return '';
        }
    }

    toString() {
        return this.promotionStatus;
    }
}

module.exports = GuildMemberPromotion;
