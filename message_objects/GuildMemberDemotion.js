class GuildMemberDemotion {
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        this.username = username;
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.daysInGuild = daysInGuild;
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

            switch (i) {
                case 0:
                    if (this.guildRank === 'CHIEF') {
                        this.demotionStatus = this.shouldBeDemoted('STRATEGIST', demotionRequirements[i], chiefRequirements);
                    }
                    break;
                case 1:
                    if (this.guildRank === 'STRATEGIST' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('CAPTAIN', demotionRequirements[i], strategistRequirements);
                    } else if (this.demotionStatus !== '') {
                        const demoteAgain = this.shouldBeDemoted('CAPTAIN', demotionRequirements[i], strategistRequirements);

                        if (demoteAgain === '') {
                            this.guildRank = 'STRATEGIST';
                        } else {
                            this.demotionStatus = demoteAgain;
                        }
                    }
                    break;
                case 2:
                    if (this.guildRank === 'CAPTAIN' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUITER', demotionRequirements[i], captainRequirements);
                    } else if (this.demotionStatus !== '') {
                        const demoteAgain = this.shouldBeDemoted('RECRUITER', demotionRequirements[i], captainRequirements);

                        if (demoteAgain === '') {
                            this.guildRank = 'CAPTAIN';
                        } else {
                            this.demotionStatus = demoteAgain;
                        }
                    }
                    break;
                case 3:
                    if (this.guildRank === 'RECRUITER' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUIT', demotionRequirements[i], recruiterRequirements);
                    } else if (this.demotionStatus !== '') {
                        const demoteAgain = this.shouldBeDemoted('RECRUIT', demotionRequirements[i], recruiterRequirements);

                        if (demoteAgain === '') {
                            this.guildRank = 'RECRUITER';
                        } else {
                            this.demotionStatus = demoteAgain;
                        }
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
            } else {
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

        if (demotionRequirements.includes('TIME')) {
            if (this.daysInGuild < rankRequirements[3]) {
                demote = true;
                if (reason === '') {
                    reason = `Has been in the guild for less than ${rankRequirements[3]} days`;
                } else {
                    reason += `, has been in the guild for less than ${rankRequirements[3]} days`;
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
