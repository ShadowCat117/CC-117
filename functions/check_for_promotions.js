const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const GuildMemberPromotion = require('../message_objects/GuildMemberPromotion');
const utilities = require('./utilities');

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

async function getAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function checkForPromotions(interaction) {
    const guildId = interaction.guild.id;
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildUuid = config.guild;
        const chiefPromotionRequirement = config.chiefPromotionRequirement;
        const strategistPromotionRequirement = config.strategistPromotionRequirement;
        const captainPromotionRequirement = config.captainPromotionRequirement;
        const recruiterPromotionRequirement = config.recruiterPromotionRequirement;
        const chiefTimeRequirement = config.chiefTimeRequirement;
        const strategistTimeRequirement = config.strategistTimeRequirement;
        const captainTimeRequirement = config.captainTimeRequirement;
        const recruiterTimeRequirement = config.recruiterTimeRequirement;
        const chiefRequirementsCount = config.chiefRequirementsCount;
        const strategistRequirementsCount = config.strategistRequirementsCount;
        const captainRequirementsCount = config.captainRequirementsCount;
        const recruiterRequirementsCount = config.recruiterRequirementsCount;
        const chiefXPRequirement = config.chiefXPRequirement;
        const chiefLevelRequirement = config.chiefLevelRequirement;
        const chiefContributorRequirement = config.chiefContributorRequirement;
        const chiefOptionalTimeRequirement = config.chiefOptionalTimeRequirement;
        const chiefWarsRequirement = config.chiefWarsRequirement;
        const chiefBuildRequirement = config.chiefBuildRequirement;
        const chiefWeeklyPlaytimeRequirement = config.chiefWeeklyPlaytimeRequirement;
        const chiefEcoRequirement = config.chiefEcoRequirement;
        const strategistXPRequirement = config.strategistXPRequirement;
        const strategistLevelRequirement = config.strategistLevelRequirement;
        const strategistContributorRequirement = config.strategistContributorRequirement;
        const strategistOptionalTimeRequirement = config.strategistOptionalTimeRequirement;
        const strategistWarsRequirement = config.strategistWarsRequirement;
        const strategistBuildRequirement = config.strategistBuildRequirement;
        const strategistWeeklyPlaytimeRequirement = config.strategistWeeklyPlaytimeRequirement;
        const strategistEcoRequirement = config.strategistEcoRequirement;
        const captainXPRequirement = config.captainXPRequirement;
        const captainLevelRequirement = config.captainLevelRequirement;
        const captainContributorRequirement = config.captainContributorRequirement;
        const captainOptionalTimeRequirement = config.captainOptionalTimeRequirement;
        const captainWarsRequirement = config.captainWarsRequirement;
        const captainBuildRequirement = config.captainBuildRequirement;
        const captainWeeklyPlaytimeRequirement = config.captainWeeklyPlaytimeRequirement;
        const captainEcoRequirement = config.captainEcoRequirement;
        const recruiterXPRequirement = config.recruiterXPRequirement;
        const recruiterLevelRequirement = config.recruiterLevelRequirement;
        const recruiterContributorRequirement = config.recruiterContributorRequirement;
        const recruiterOptionalTimeRequirement = config.recruiterOptionalTimeRequirement;
        const recruiterWarsRequirement = config.recruiterWarsRequirement;
        const recruiterBuildRequirement = config.recruiterBuildRequirement;
        const recruiterWeeklyPlaytimeRequirement = config.recruiterWeeklyPlaytimeRequirement;
        const recruiterEcoRequirement = config.recruiterEcoRequirement;
        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
        const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
        const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);

        if (!guildName) {
        }

        const promotionRequirements = [chiefPromotionRequirement, strategistPromotionRequirement, captainPromotionRequirement, recruiterPromotionRequirement];
        const requirementsCount = [chiefRequirementsCount, strategistRequirementsCount, captainRequirementsCount, recruiterRequirementsCount];
        const chiefRequirements = [chiefTimeRequirement, chiefXPRequirement, chiefLevelRequirement, chiefContributorRequirement, chiefOptionalTimeRequirement, chiefWarsRequirement, chiefBuildRequirement, chiefWeeklyPlaytimeRequirement, chiefEcoRequirement];
        const strategistRequirements = [strategistTimeRequirement, strategistXPRequirement, strategistLevelRequirement, strategistContributorRequirement, strategistOptionalTimeRequirement, strategistWarsRequirement, strategistBuildRequirement, strategistWeeklyPlaytimeRequirement, strategistEcoRequirement];
        const captainRequirements = [captainTimeRequirement, captainXPRequirement, captainLevelRequirement, captainContributorRequirement, captainOptionalTimeRequirement, captainWarsRequirement, captainBuildRequirement, captainWeeklyPlaytimeRequirement, captainEcoRequirement];
        const recruiterRequirements = [recruiterTimeRequirement, recruiterXPRequirement, recruiterLevelRequirement, recruiterContributorRequirement, recruiterOptionalTimeRequirement, recruiterWarsRequirement, recruiterBuildRequirement, recruiterWeeklyPlaytimeRequirement, recruiterEcoRequirement];
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const promotionExceptions = config['promotionExceptions'] !== undefined ? config['promotionExceptions'] : {};

        const exemptUsernames = Object.keys(promotionExceptions);

        const originalRows = await allAsync('SELECT UUID, username, guildRank, contributedGuildXP, highestClassLevel, guildJoinDate, wars FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);

        let filteredRows = originalRows.filter(player => player.guildRank !== 'OWNER' && player.guildRank !== 'CHIEF' && !exemptUsernames.includes(player.username));
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
        }

        let position = 0;

        const today = new Date();

        const tableName = guildName.replaceAll(' ', '_');

        let promoteGuildMembers = await Promise.all(originalRows.map(async (row) => {
            position++;
    
            if (filteredRows.includes(row)) {
                const { username, guildRank, contributedGuildXP, highestClassLevel, wars } = row;
                const contributionPos = position;
    
                const [year, month, day] = row.guildJoinDate.split('-');
                const joinDate = new Date(year, month - 1, day);
                const differenceInMilliseconds = today - joinDate;
                const daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));
    
                const serverMember = await utilities.findDiscordUser(interaction.guild.members.cache.values(), username);

                let playtimeRow;

                try {
                    playtimeRow = await getAsync(`SELECT averagePlaytime FROM ${tableName} WHERE UUID = ?`, [row.UUID]);
                } catch (err) {
                    playtimeRow = undefined;
                    console.log(`No table exists: ${tableName}`);
                }

                let hasBuildRole = false;
                let hasEcoRole = false;

                if (serverMember) {
                    const memberRoles = serverMember.roles.cache;

                    for (const role of memberRoles.values()) {
                        if (role === ecoRole) {
                            hasEcoRole = true;
                        } else if (warBuildRoles.includes(role)) {
                            hasBuildRole = true;
                        }

                        if (hasBuildRole && hasEcoRole) {
                            break;
                        }
                    }
                }

                let playtime;

                if (!playtimeRow || playtimeRow.averagePlaytime === -1) {
                    playtime = 0;
                } else {
                    playtime = playtimeRow.averagePlaytime;
                }
    
                return new GuildMemberPromotion(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, wars, hasBuildRole, playtime, hasEcoRole, promotionRequirements, requirementsCount, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
            }
        }));

        const eligibleChiefs = promoteGuildMembers.filter(player => player !== undefined).filter(player => player.toString().startsWith('CHIEFPROMOTION '));

        promoteGuildMembers = promoteGuildMembers.filter(player => player !== undefined).filter(player => player.toString() !== '').filter(player => !player.toString().startsWith('CHIEFPROMOTION '));

        const pages = [];
        let promoteMembersPage = '```\n';
        let counter = 0;

        promoteGuildMembers.forEach((player) => {
            if (counter === 10) {
                promoteMembersPage += '```';
                pages.push(promoteMembersPage);
                promoteMembersPage = '```\n' + player.toString();
                counter = 1;
            } else {
                promoteMembersPage += player.toString();
                counter++;
            }
        });

        if (counter <= 10) {
            promoteMembersPage += '```';
            pages.push(promoteMembersPage);
        }

        if (eligibleChiefs.length > 0) {
            const chiefPages = [];
            let promoteChiefsPage = '```\n';
            let chiefCounter = 0;

            eligibleChiefs.forEach((player) => {
                if (config['chiefPromotions'] && !config['chiefPromotions'].includes(player.username)) {
                    if (chiefCounter === 10) {
                        promoteChiefsPage += '```';
                        chiefPages.push(promoteChiefsPage);
                        promoteChiefsPage = '```\n' + player.toString().substring(15);
                        chiefCounter = 1;
                    } else {
                        promoteChiefsPage += player.toString().substring(15);
                        chiefCounter++;
                    }

                    config['chiefPromotions'].push(player.username);
                }
            });

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (chiefCounter <= 10) {
                promoteChiefsPage += '```';
                chiefPages.push(promoteChiefsPage);
            }

            if (promoteChiefsPage !== '```\n```') {
            }
        }

    } catch (error) {
        console.log(error);
    }
}

module.exports = checkForPromotions;
