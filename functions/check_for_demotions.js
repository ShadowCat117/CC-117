const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const ButtonedMessage = require('../message_type/ButtonedMessage');
const db = new sqlite3.Database('database/database.db');
const GuildMemberDemotion = require('../message_objects/GuildMemberDemotion');
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

async function checkForDemotions(interaction) {
    const guildId = interaction.guild.id;
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
            return new ButtonedMessage('', [], '', ['You have not set a guild.']);
        }

        const demotionRequirements = [chiefPromotionRequirement, strategistPromotionRequirement, captainPromotionRequirement, recruiterPromotionRequirement];
        const requirementsCount = [chiefRequirementsCount, strategistRequirementsCount, captainRequirementsCount, recruiterRequirementsCount];
        const chiefRequirements = [chiefTimeRequirement, chiefXPRequirement, chiefLevelRequirement, chiefContributorRequirement, chiefOptionalTimeRequirement, chiefWarsRequirement, chiefBuildRequirement, chiefWeeklyPlaytimeRequirement, chiefEcoRequirement];
        const strategistRequirements = [strategistTimeRequirement, strategistXPRequirement, strategistLevelRequirement, strategistContributorRequirement, strategistOptionalTimeRequirement, strategistWarsRequirement, strategistBuildRequirement, strategistWeeklyPlaytimeRequirement, strategistEcoRequirement];
        const captainRequirements = [captainTimeRequirement, captainXPRequirement, captainLevelRequirement, captainContributorRequirement, captainOptionalTimeRequirement, captainWarsRequirement, captainBuildRequirement, captainWeeklyPlaytimeRequirement, captainEcoRequirement];
        const recruiterRequirements = [recruiterTimeRequirement, recruiterXPRequirement, recruiterLevelRequirement, recruiterContributorRequirement, recruiterOptionalTimeRequirement, recruiterWarsRequirement, recruiterBuildRequirement, recruiterWeeklyPlaytimeRequirement, recruiterEcoRequirement];
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const demotionExceptions = config['demotionExceptions'] !== undefined ? config['demotionExceptions'] : {};

        const exemptUsernames = Object.keys(demotionExceptions);

        const originalRows = await allAsync('SELECT UUID, username, guildRank, contributedGuildXP, highestClassLevel, guildJoinDate, wars FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);

        let filteredRows = originalRows.filter(player => player.guildRank !== 'OWNER' && player.guildRank !== 'RECRUIT' && !exemptUsernames.includes(player.username));

        if (demotionRequirements[0].includes('NONE')) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'CHIEF');
        }

        if (demotionRequirements[1].includes('NONE')) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'STRATEGIST');
        }

        if (demotionRequirements[2].includes('NONE')) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'CAPTAIN');
        }

        if (demotionRequirements[3].includes('NONE')) {
            filteredRows = filteredRows.filter(player => player.guildRank !== 'RECRUITER');
        }

        if (filteredRows.length === 0) {
            return new ButtonedMessage('', [], '', [`No members of ${guildName} need demoting`]);
        }

        let position = 0;

        const today = new Date();

        const tableName = guildName.replaceAll(' ', '_');

        let demoteGuildMembers = await Promise.all(originalRows.map(async (row) => {
            position++;

            if (filteredRows.includes(row)) {
                const { username, guildRank, contributedGuildXP, highestClassLevel, wars } = row;
                const contributionPos = position;

                const [year, month, day] = row.guildJoinDate.split('-');
                const joinDate = new Date(year, month - 1, day);
                const differenceInMilliseconds = today - joinDate;
                const daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));

                const serverMember = await utilities.findDiscordUser(interaction.guild.members.cache.values(), username);

                const playtimeRow = await getAsync(`SELECT averagePlaytime FROM ${tableName} WHERE UUID = ?`, [row.UUID]);

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

                return new GuildMemberDemotion(username, guildRank, contributedGuildXP, highestClassLevel, contributionPos, daysInGuild, wars, hasBuildRole, playtime, hasEcoRole, demotionRequirements, requirementsCount, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
            }
        }));

        demoteGuildMembers = demoteGuildMembers.filter(player => player !== undefined).filter(player => player.toString() !== '');

        const pages = [];
        let demoteMembersPage = '```\n';
        let counter = 0;

        demoteGuildMembers.forEach((player) => {
            if (counter === 10) {
                demoteMembersPage += '```';
                pages.push(demoteMembersPage);
                demoteMembersPage = '```\n' + player.toString();
                counter = 1;
            } else {
                demoteMembersPage += player.toString();
                counter++;
            }
        });

        if (counter <= 10) {
            demoteMembersPage += '```';
            pages.push(demoteMembersPage);
        }

        return new ButtonedMessage('', [], '', pages);
    } catch (error) {
        console.log(error);
        return new ButtonedMessage('', [], '', ['Error checking for guild demotions.']);
    }
}

module.exports = checkForDemotions;
