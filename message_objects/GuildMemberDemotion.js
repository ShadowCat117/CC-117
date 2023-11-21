class GuildMemberDemotion {
    // Creates a GuildMemberDemotion object
    // username: Username of the guild member
    // guildRank: Their current guild rank
    // contributedGuildXP: How much XP have they contributed to the guild
    // highestClassLevel: Highest combat level of any of their classes
    // contributionPos: What position in the guild are they for contributed XP
    // daysInGuild: How many days they've been in the guild for
    // demotionRequirements: The demotion requirements for each rank. Eg. NONE, TOP or XP
    // chiefRequirements: The values for each Chief promotion requirement
    // strategistRequirements: The values for each Strategist promotion requirement
    // captainRequirements: The values for each Captain promotion requirement
    // recruiterRequirements: The values for each Recruiter promotion requirement
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

    // Check for a demotion to each rank
    // demotionRequirements: The demotion requirements for each rank. Eg. NONE, TOP or XP
    // chiefRequirements: The values for each Chief demotion requirement
    // strategistRequirements: The values for each Strategist demotion requirement
    // captainRequirements: The values for each Captain demotion requirement
    // recruiterRequirements: The values for each Recruiter demotion requirement
    checkForDemotion(demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements) {
        // Loop through all requirements for a rank to see if they qualify
        for (let i = 0; i < demotionRequirements.length; i++) {
            // If the current rank being checked has no requirement and they are that rank, then don't bother checking for demotion
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

            // Check each rank to see if they should be demoted
            switch (i) {
                case 0:
                    // If they are a chief, check if they should be a strategist
                    if (this.guildRank === 'CHIEF') {
                        this.demotionStatus = this.shouldBeDemoted('STRATEGIST', demotionRequirements[i], chiefRequirements);
                    }
                    break;
                case 1:
                    // If they are a strategist and haven't already been demoted from chief, check if they should be a captain
                    if (this.guildRank === 'STRATEGIST' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('CAPTAIN', demotionRequirements[i], strategistRequirements);
                    } else if (this.demotionStatus !== '') {
                        // Has been demoted from chief, check if they should be a captain
                        const demoteAgain = this.shouldBeDemoted('CAPTAIN', demotionRequirements[i], strategistRequirements);

                        // If they should be demoted again, update their current rank or set new demotion message
                        if (demoteAgain === '') {
                            this.guildRank = 'STRATEGIST';
                        } else {
                            this.demotionStatus = demoteAgain;
                        }
                    }
                    break;
                case 2:
                    // If they are a captain and haven't already been demoted from strategist, check if they should be a recruiter
                    if (this.guildRank === 'CAPTAIN' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUITER', demotionRequirements[i], captainRequirements);
                    } else if (this.demotionStatus !== '') {
                        // Has been demoted from strategist, check if they should be a recruiter
                        const demoteAgain = this.shouldBeDemoted('RECRUITER', demotionRequirements[i], captainRequirements);

                        // If they should be demoted again, update their current rank or set new demotion message
                        if (demoteAgain === '') {
                            this.guildRank = 'CAPTAIN';
                        } else {
                            this.demotionStatus = demoteAgain;
                        }
                    }
                    break;
                case 3:
                    // If they are a recruiter and haven't already been demoted from captain, check if they should be a recruit
                    if (this.guildRank === 'RECRUITER' && this.demotionStatus === '') {
                        this.demotionStatus = this.shouldBeDemoted('RECRUIT', demotionRequirements[i], recruiterRequirements);
                    } else if (this.demotionStatus !== '') {
                        // Has been demoted from captain, check if they should be a recruit
                        const demoteAgain = this.shouldBeDemoted('RECRUIT', demotionRequirements[i], recruiterRequirements);

                        // If they should be demoted again, update their current rank or set new demotion message
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

    // Checks if a player should be demoted. Do they still meet the requirements for a promotion essentially
    // rankToDemote: Rank to check if they should be demoted to
    // demotionRequirements: The requirements to be that rank
    // rankRequirements: The values for each requirement
    shouldBeDemoted(rankToDemote, demotionRequirements, rankRequirements) {
        let demote = false;
        let reason = '';

        // If they haven't been in the guild long enough for this rank, mark for demotion
        if (demotionRequirements.includes('TIME')) {
            if (this.daysInGuild < rankRequirements[3]) {
                demote = true;
                reason = `Has been in the guild for less than ${rankRequirements[3]} days`;
            } else {
                return '';
            }
        }

        // If XP is a requirement, have they contributed enough
        if (demotionRequirements.includes('XP')) {
            // If they haven't contributed enough, mark for demotion/add new reason
            if (this.contributedGuildXP < rankRequirements[0]) {
                demote = true;
                if (reason === '') {
                    reason = `Contributed less than ${rankRequirements[0]} XP`;
                } else {
                    reason += `, contributed less than ${rankRequirements[0]} XP`;
                }
            } else if (demote) {
                return '';
            }
        }

        // If level is a requirement, do they have a character with a high enough combat level
        if (demotionRequirements.includes('LEVEL')) {
            // If they don't have a high enough levelled class, mark for demotion/add new reason
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

        // If contribution position is a requirement, is their contribution position above that
        if (demotionRequirements.includes('TOP')) {
            // If they aren't a high enough contribution position, mark for demotion/add new reason
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

        // If they should be demoted, update their rank and set demotion message
        if (demote) {
            this.guildRank = rankToDemote;
            return `${this.username} should be demoted to ${rankToDemote} for: ${reason}\n`;
        } else {
            return '';
        }
    }

    // Returns a string of the demotion status for the player
    toString() {
        return this.demotionStatus;
    }
}

module.exports = GuildMemberDemotion;
