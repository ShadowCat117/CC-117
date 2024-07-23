class GuildMemberDemotion {
    // Creates a GuildMemberDemotion object
    // username: Username of the guild member
    // guildRank: Their current guild rank
    // contributedGuildXP: How much XP have they contributed to the guild
    // highestCharacterLevel: Highest combat level of any of their characters
    // contributionPos: What position in the guild are they for contributed XP
    // daysInGuild: How many days they've been in the guild for
    // wars: How many wars has the player participated in
    // hasBuildRole: Does the player have one of the war build roles in the Discord server
    // playtime: How many hours per week does the player play on average
    // hasEcoRole: Does the player have the eco role in the Discord server
    // promotionRequirements: The promotion requirements for each rank.
    // timeRequirements: How long you have to be in the guild to be eligible for this rank.
    // requirementsCount: How many requirements must be met to get this promotion
    constructor(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, wars, hasBuildRole, playtime, hasEcoRole, promotionRequirements, timeRequirements, requirementsCount) {
        this.username = username.replaceAll('_', '\\_');
        this.guildRank = guildRank;
        this.contributedGuildXP = contributedGuildXP;
        this.highestClassLevel = highestClassLevel;
        this.contributionPos = contributionPos;
        this.daysInGuild = daysInGuild;
        this.wars = wars;
        this.hasBuildRole = hasBuildRole;
        this.playtime = playtime;
        this.hasEcoRole = hasEcoRole;

        this.checkForDemotion(promotionRequirements, timeRequirements, requirementsCount);
    }

    // Check each rank to see if the member still qualifies for this rank
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // timeRequirements: How long you have to be in the guild to be eligible for this rank.
    // requirementsCount: How many requirements must be met to get this promotion
    checkForDemotion(promotionRequirements, timeRequirements, requirementsCount) {
        // Loop through all requirements for a rank to see if they qualify
        for (let i = 0; i < promotionRequirements.length; i++) {
            // If the current rank being checked has no requirement and they are that rank, then don't bother checking for demotion
            if (Object.keys(promotionRequirements[i]).length === 0) {
                if (i === 0 && this.guildRank === 'chief') {
                    break;
                } else if (i === 1 && this.guildRank === 'strategist') {
                    break;
                } else if (i === 2 && this.guildRank === 'captain') {
                    break;
                } else if (i === 3 && this.guildRank === 'recruiter') {
                    break;
                } else {
                    continue;
                }
            }

            // Check each rank to see if they should be demoted
            switch (i) {
                case 0:
                    // If they are a chief, check if they should be a strategist
                    if (this.guildRank === 'chief') {
                        this.shouldBeDemoted('strategist', promotionRequirements[i], timeRequirements[i], requirementsCount[i]);
                    }
                    break;
                case 1:
                    // If they are a strategist or have been demoted from chief, check if they should be a captain
                    if (this.guildRank === 'strategist' || this.rankToDemote === 'Strategist') {
                        this.shouldBeDemoted('captain', promotionRequirements[i], timeRequirements[i], requirementsCount[i]);
                    }
                    break;
                case 2:
                    // If they are a captain or have been demoted from strategist, check if they should be a recruiter
                    if (this.guildRank === 'captain' || this.rankToDemote === 'Captain') {
                        this.shouldBeDemoted('recruiter', promotionRequirements[i], timeRequirements[i], requirementsCount[i]);
                    }
                    break;
                case 3:
                    // If they are a recruiter or have been demoted from captain, check if they should be a recruit
                    if (this.guildRank === 'recruiter' || this.rankToDemote === 'Recruiter') {
                        this.shouldBeDemoted('recruit', promotionRequirements[i], timeRequirements[i], requirementsCount[i]);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // Checks if a player should be demoted. Do they still meet the requirements for a promotion essentially
    // rankToDemote: Rank to check if they should be demoted to
    // requirementsCount: How many requirements they must meet to be demoted
    // demotionRequirements: The requirements to be that rank
    // rankRequirements: The values for each requirement
    shouldBeDemoted(rankToDemote, promotionRequirements, timeRequirement, requirementsCount) {
        let demote = false;
        const reasons = [];
        let metRequirements = 0;

        if (this.daysInGuild < timeRequirement) {
            reasons.push(`Has not been in guild for ${timeRequirement} days.`);
            this.demote = true;
            this.reasons = reasons;
            this.rankToDemote = rankToDemote.charAt(0).toUpperCase() + rankToDemote.slice(1);
            return;
        }

        // If xp is a requirement
        if (promotionRequirements['XP']) {
            // If they've contributed more or equal to the amount required
            if (this.contributedGuildXP >= promotionRequirements['XP']) {
                metRequirements++;
            } else {
                reasons.push(`Has not contributed ${promotionRequirements['XP'].toLocaleString()} XP`);
            }
        }

        // If highest combat level is a requirement
        if (promotionRequirements['LEVEL']) {
            // If their highest combat level is more or equal to the required level
            if (this.highestClassLevel >= promotionRequirements['LEVEL']) {
                metRequirements++;
            } else {
                reasons.push(`Does not have a character at or above level ${promotionRequirements['LEVEL']}.`);
            }
        }

        // If top contributor is a requirement
        if (promotionRequirements['TOP']) {
            // If their contribution position is higher or equal to the required position
            if (this.contributionPos <= promotionRequirements['TOP']) {
                metRequirements++;
            } else {
                reasons.push(`Is not in the top ${promotionRequirements['TOP']} contributors.`);
            }
        }

        // If time in guild is a requirement
        if (promotionRequirements['TIME']) {
            if (this.daysInGuild >= promotionRequirements['TIME']) {
                metRequirements++;
            } else {
                reasons.push(`Has not been in the guild for ${promotionRequirements['TIME']} day${promotionRequirements['TIME'] != 1 ? 's' : ''}.`);
            }
        }

        // If wars is a requirement
        if (promotionRequirements['WARS']) {
            if (this.wars >= promotionRequirements['WARS']) {
                metRequirements++;
            } else {
                reasons.push(`Has not participated in ${promotionRequirements['WARS']} wars.`);
            }
        }

        // If war build is a requirement
        if (promotionRequirements['BUILD']) {
            if (this.hasBuildRole) {
                metRequirements++;
            } else {
                reasons.push('Does not have a war build');
            }
        }

        // If playtime is a requirement
        if (promotionRequirements['PLAYTIME']) {
            if (this.playtime >= promotionRequirements['PLAYTIME']) {
                metRequirements++;
            } else {
                reasons.push(`Does not have an average weekly playtime of ${promotionRequirements['PLAYTIME']} hour${promotionRequirements['PLAYTIME'] != 1 ? 's' : ''}.`);
            }
        }

        // If eco is a requirement
        if (promotionRequirements['ECO']) {
            if (this.hasEcoRole) {
                metRequirements++;
            } else {
                reasons.push('Does not know eco.');
            }
        }

        if (metRequirements < requirementsCount) {
            demote = true;
        }

        // If they should be demoted, update their rank and set demotion reasons
        if (demote) {
            this.demote = demote;
            this.reasons = reasons;
            this.metRequirements = metRequirements;
            this.requirementsCount = requirementsCount;
            this.rankToDemote = rankToDemote.charAt(0).toUpperCase() + rankToDemote.slice(1);
        }
    }
}

module.exports = GuildMemberDemotion;
