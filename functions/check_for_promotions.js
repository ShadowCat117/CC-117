const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const ButtonedMessage = require('../message_type/ButtonedMessage');
const db = new sqlite3.Database('database/database.db');
const GuildMemberPromotion = require('../message_objects/GuildMemberPromotion');

async function allAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function checkForPromotions(guildId) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildName = config.guildName;
        const chiefPromotionRequirement = config.chiefPromotionRequirement;
        const strategistPromotionRequirement = config.strategistPromotionRequirement;
        const captainPromotionRequirement = config.captainPromotionRequirement;
        const recruiterPromotionRequirement = config.recruiterPromotionRequirement;
        const chiefXPRequirement = config.chiefXPRequirement;
        const chiefLevelRequirement = config.chiefLevelRequirement;
        const chiefContributorRequirement = config.chiefContributorRequirement;
        const strategistXPRequirement = config.strategistXPRequirement;
        const strategistLevelRequirement = config.strategistLevelRequirement;
        const strategistContributorRequirement = config.strategistContributorRequirement;
        const captainXPRequirement = config.captainXPRequirement;
        const captainLevelRequirement = config.captainLevelRequirement;
        const captainContributorRequirement = config.captainContributorRequirement;
        const recruiterXPRequirement = config.recruiterXPRequirement;
        const recruiterLevelRequirement = config.recruiterLevelRequirement;
        const recruiterContributorRequirement = config.recruiterContributorRequirement;

        if (!guildName) {
            return new ButtonedMessage('', [], '', ['You have not set a guild.']);
        }

        const promotionRequirements = [chiefPromotionRequirement, strategistPromotionRequirement, captainPromotionRequirement, recruiterPromotionRequirement];
        const chiefRequirements = [chiefXPRequirement, chiefLevelRequirement, chiefContributorRequirement];
        const strategistRequirements = [strategistXPRequirement, strategistLevelRequirement, strategistContributorRequirement];
        const captainRequirements = [captainXPRequirement, captainLevelRequirement, captainContributorRequirement];
        const recruiterRequirements = [recruiterXPRequirement, recruiterLevelRequirement, recruiterContributorRequirement];

        const originalRows = await allAsync('SELECT username, guildRank, contributedGuildXP, highestClassLevel FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);

        let filteredRows = originalRows.filter(player => player.guildRank !== 'OWNER' && player.guildRank !== 'CHIEF');
        let checkForChiefPromotion = true;
        let checkForStrategistPromotion = true;
        let checkForCaptainPromotion = true;

        if (promotionRequirements[0].includes('NONE')) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'STRATEGIST');
            checkForChiefPromotion = false;
        }

        if (promotionRequirements[1].includes('NONE') && !checkForChiefPromotion) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'CAPTAIN');
            checkForStrategistPromotion = false;
        }

        if (promotionRequirements[2].includes('NONE') && !checkForChiefPromotion && !checkForStrategistPromotion) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'RECRUITER');
            checkForCaptainPromotion = false;
        }

        if (promotionRequirements[3].includes('NONE') && !checkForChiefPromotion && !checkForStrategistPromotion && !checkForCaptainPromotion) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'RECRUIT');
        }

        if (filteredRows.length === 0) {
            return new ButtonedMessage('', [], '', [`No members of ${guildName} need promoting`]);
        }

        let contributionPosition = 0;

        let promoteGuildMembers = originalRows.map(row => {
            contributionPosition++;

            if (filteredRows.includes(row)) {
                const {
                    username,
                    guildRank,
                    contributedGuildXP,
                    highestClassLevel,
                } = row;

                return new GuildMemberPromotion(username, guildRank, contributedGuildXP, highestClassLevel, contributionPosition, promotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
            }
        });

        promoteGuildMembers = promoteGuildMembers.filter(player => player !== undefined).filter(player => player.toString() !== '');

        const pages = [];
        let promoteMembersPage = '```\n';
        let counter = 0;

        promoteGuildMembers.forEach((player) => {
            if (counter === 20) {
                promoteMembersPage += '```';
                pages.push(promoteMembersPage);
                promoteMembersPage = '```\n' + player.toString();
                counter = 1;
            } else {
                promoteMembersPage += player.toString();
                counter++;
            }
        });

        if (counter !== 20) {
            promoteMembersPage += '```';
            pages.push(promoteMembersPage);
        }

        return new ButtonedMessage('', [], '', pages);
    } catch (error) {
        console.log(error);
        return new ButtonedMessage('', [], '', ['Error checking for guild promotions.']);
    }
}

module.exports = checkForPromotions;
