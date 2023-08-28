class GuildMemberDemotion {
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        this.username = username;
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.demotionStatus = '';

        this.checkForDemotion(demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
    }

    checkForDemotion(demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        for (let i = 0; i < demotionRequirements.length; i++) {
            if (demotionRequirements[i].includes('NONE')) {
                if (i === 0 && this.guildRank === 'CHIEF') {
                    break;
                } else if (i === 1 && this.guildRank === 'STRATEGIST') {
                    break;
                } else if (i === 2 && this.guildRank === 'CAPTAIN') {
                    break;
                } else if (i === 3 && this.guildRank === 'RECRUITER') {
                    break;
                } else {
                    continue;
                }
            }

            if (this.demotionStatus !== '') {
                continue;
            }

            switch (i) {
                case 0:
                    if (this.guildRank === 'CHIEF') {
                        this.demotionStatus = this.shouldBeDemoted('STRATEGIST', demotionRequirements[i], chiefRequirements);
                    }
                    break;
                case 1:
                    if (this.guildRank === 'STRATEGIST') {
                        this.demotionStatus = this.shouldBeDemoted('CAPTAIN', demotionRequirements[i], strategistRequirements);
                    }
                    break;
                case 2:
                    if (this.guildRank === 'CAPTAIN') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUITER', demotionRequirements[i], captainRequirements);
                    }
                    break;
                case 3:
                    if (this.guildRank === 'RECRUITER') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUIT', demotionRequirements[i], recruiterRequirements);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    shouldBeDemoted(rankToDemote, demotionRequirements, rankRequirements) {
        let demote = false;
        let reason = '';

        if (demotionRequirements.includes('XP')) {
            if (this.contributedGuildXP < rankRequirements[0]) {
                demote = true;
                reason = `Contributed less than ${rankRequirements[0]} XP`;
            } else if (this.demotionStatus !== '') {
                return '';
            }
        }

        if (demotionRequirements.includes('LEVEL')) {
            if (this.highestClassLevel < rankRequirements[1]) {
                demote = true;
                if (reason === '') {
                    reason = `Highest class level is lower than ${rankRequirements[1]}`;
                } else {
                    reason += `, highest class level is lower than ${rankRequirements[1]}`;
                }
            } else if (demote) {
                return '';
            }
        }

        if (demotionRequirements.includes('TOP')) {
            if (this.contributionPos > rankRequirements[2]) {
                demote = true;
                if (reason === '') {
                    reason = `Contribution position lower than ${rankRequirements[2]}`;
                } else {
                    reason += `, contribution position lower than ${rankRequirements[2]}`;
                }
            } else if (demote) {
                return '';
            }
        }

        if (demote) {
            this.guildRank = rankToDemote;
            return `${this.username} should be demoted to ${rankToDemote} for: ${reason}\n`;
        } else {
            return '';
        }
    }

    toString() {
        return this.demotionStatus;
    }
}

module.exports = GuildMemberDemotion;
