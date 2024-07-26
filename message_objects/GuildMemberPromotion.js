class GuildMemberPromotion {
    // Creates a GuildMemberPromotion object
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
    constructor(
        username,
        guildRank,
        contributedGuildXP,
        highestClassLevel,
        contributionPos,
        daysInGuild,
        wars,
        hasBuildRole,
        playtime,
        hasEcoRole,
        promotionRequirements,
        timeRequirements,
        requirementsCount,
    ) {
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

        this.checkForPromotion(
            promotionRequirements,
            timeRequirements,
            requirementsCount,
        );
    }

    // Check for a promotion of each rank
    // promotionRequirements: The promotion requirements for each rank. Eg. NONE, TOP or XP
    // timeRequirements: How long you have to be in the guild to be eligible for this rank.
    // requirementsCount: How many requirements must be met to get this promotion
    checkForPromotion(
        promotionRequirements,
        timeRequirements,
        requirementsCount,
    ) {
        // Loop through the requirements of each rank and check if they should be promoted
        // Check highest first as if they qualify for that, no need to check rest
        for (let i = 0; i < promotionRequirements.length; i++) {
            // Rank has no promotion requirement, skip to next
            if (Object.keys(promotionRequirements[i]).length === 0) {
                continue;
            }

            // Promotion found
            if (this.promote) {
                break;
            }

            switch (i) {
                case 0:
                    this.shouldBePromoted(
                        'chief',
                        promotionRequirements[i],
                        timeRequirements[i],
                        requirementsCount[i],
                    );
                    break;
                case 1:
                    // If not a strategist check if they should be promoted to strategist
                    if (this.guildRank !== 'strategist') {
                        this.shouldBePromoted(
                            'strategist',
                            promotionRequirements[i],
                            timeRequirements[i],
                            requirementsCount[i],
                        );
                    }
                    break;
                case 2:
                    // If not a strategist or captain check if they should be promoted to captain
                    if (
                        this.guildRank !== 'strategist' &&
                        this.guildRank !== 'captain'
                    ) {
                        this.shouldBePromoted(
                            'captain',
                            promotionRequirements[i],
                            timeRequirements[i],
                            requirementsCount[i],
                        );
                    }
                    break;
                case 3:
                    // If not a strategist, captain or recruiter check if they should be promoted to recruiter
                    if (
                        this.guildRank !== 'strategist' &&
                        this.guildRank !== 'captain' &&
                        this.guildRank !== 'recruiter'
                    ) {
                        this.shouldBePromoted(
                            'recruiter',
                            promotionRequirements[i],
                            timeRequirements[i],
                            requirementsCount[i],
                        );
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // Check if the player should be promoted to a rank based on the requirements
    // rankToPromote: The rank to check for promotion
    // promotionRequirements: What are the requirements for promotion
    // timeRequirement: How long must they be in the guild to be eligible for this promotion.
    // requirementsCount: How many requirements must be met to be eligible for this promotion
    shouldBePromoted(
        rankToPromote,
        promotionRequirements,
        timeRequirement,
        requirementsCount,
    ) {
        let promote = false;
        const reasons = [];
        let metRequirements = 0;

        // Hard requirement, members must be in the guild for X days to qualify for this promotion
        if (this.daysInGuild < timeRequirement) {
            return '';
        }

        // If xp is a requirement
        if (promotionRequirements['XP']) {
            // If they've contributed more or equal to the amount required
            if (this.contributedGuildXP >= promotionRequirements['XP']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Contributed more than ${promotionRequirements['XP'].toLocaleString()} XP`,
                );
            }
        }

        // If highest combat level is a requirement
        if (promotionRequirements['LEVEL']) {
            // If their highest combat level is more or equal to the required level
            if (this.highestClassLevel >= promotionRequirements['LEVEL']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Highest class level is higher than ${promotionRequirements['LEVEL']}`,
                );
            }
        }

        // If top contributor is a requirement
        if (promotionRequirements['TOP']) {
            // If their contribution position is higher or equal to the required position
            if (this.contributionPos <= promotionRequirements['TOP']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Contribution position higher than ${promotionRequirements['TOP']}`,
                );
            }
        }

        // If time in guild is a requirement
        if (promotionRequirements['TIME']) {
            if (this.daysInGuild >= promotionRequirements['TIME']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Has been in the guild for ${promotionRequirements['TIME']} days`,
                );
            }
        }

        // If wars is a requirement
        if (promotionRequirements['WARS']) {
            if (this.wars >= promotionRequirements['WARS']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Has participated in ${promotionRequirements['WARS']} wars`,
                );
            }
        }

        // If war build is a requirement
        if (promotionRequirements['BUILD']) {
            if (this.hasBuildRole) {
                promote = true;
                metRequirements++;
                reasons.push('Has a war build');
            }
        }

        // If playtime is a requirement
        if (promotionRequirements['PLAYTIME']) {
            if (this.playtime >= promotionRequirements['PLAYTIME']) {
                promote = true;
                metRequirements++;
                reasons.push(
                    `Has an average weekly playtime over ${promotionRequirements['PLAYTIME']} hrs/week`,
                );
            }
        }

        // If eco is a requirement
        if (promotionRequirements['ECO']) {
            if (this.hasEcoRole) {
                promote = true;
                metRequirements++;
                reasons.push('Knows/is willing to learn eco');
            }
        }

        if (metRequirements < requirementsCount) {
            promote = false;
        }

        this.promote = promote;
        this.reasons = reasons;
        this.rankToPromote =
            rankToPromote.charAt(0).toUpperCase() + rankToPromote.slice(1);
    }
}

module.exports = GuildMemberPromotion;
