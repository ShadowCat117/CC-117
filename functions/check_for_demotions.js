const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const ButtonedMessage = require('../message_type/ButtonedMessage');
const db = new sqlite3.Database('database/database.db');
const GuildMemberDemotion = require('../message_objects/GuildMemberDemotion');

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

async function checkForDemotions(guildId) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildName = config.guildName;
        const chiefDemotionRequirement = config.chiefPromotionRequirement;
        const strategistDemotionRequirement = config.strategistPromotionRequirement;
        const captainDemotionRequirement = config.captainPromotionRequirement;
        const recruiterDemotionRequirement = config.recruiterPromotionRequirement;
        const chiefXPRequirement = config.chiefXPRequirement;
        const chiefLevelRequirement = config.chiefLevelRequirement;
        const chiefContributorRequirement = config.chiefContributorRequirement;
        const chiefTimeRequirement = config.chiefTimeRequirement;
        const strategistXPRequirement = config.strategistXPRequirement;
        const strategistLevelRequirement = config.strategistLevelRequirement;
        const strategistContributorRequirement = config.strategistContributorRequirement;
        const strategistTimeRequirement = config.strategistTimeRequirement;
        const captainXPRequirement = config.captainXPRequirement;
        const captainLevelRequirement = config.captainLevelRequirement;
        const captainContributorRequirement = config.captainContributorRequirement;
        const captainTimeRequirement = config.captainTimeRequirement;
        const recruiterXPRequirement = config.recruiterXPRequirement;
        const recruiterLevelRequirement = config.recruiterLevelRequirement;
        const recruiterContributorRequirement = config.recruiterContributorRequirement;
        const recruiterTimeRequirement = config.recruiterTimeRequirement;

        if (!guildName) {
            return new ButtonedMessage('', [], '', ['You have not set a guild.']);
        }

        const demotionRequirements = [chiefDemotionRequirement, strategistDemotionRequirement, captainDemotionRequirement, recruiterDemotionRequirement];
        const chiefRequirements = [chiefXPRequirement, chiefLevelRequirement, chiefContributorRequirement, chiefTimeRequirement];
        const strategistRequirements = [strategistXPRequirement, strategistLevelRequirement, strategistContributorRequirement, strategistTimeRequirement];
        const captainRequirements = [captainXPRequirement, captainLevelRequirement, captainContributorRequirement, captainTimeRequirement];
        const recruiterRequirements = [recruiterXPRequirement, recruiterLevelRequirement, recruiterContributorRequirement, recruiterTimeRequirement];

        const demotionExceptions = config['demotionExceptions'] !== undefined ? config['demotionExceptions'] : {};

        const exemptUsernames = Object.keys(demotionExceptions);

        const originalRows = await allAsync('SELECT username, guildRank, contributedGuildXP, highestClassLevel, guildJoinDate FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);

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

        let contributionPosition = 0;

        const today = new Date();

        let demoteGuildMembers = originalRows.map(row => {
            contributionPosition++;

            if (filteredRows.includes(row)) {
                const {
                    username,
                    guildRank,
                    contributedGuildXP,
                    highestClassLevel,
                } = row;

                const [year, month, day] = row.guildJoinDate.split('-');
            
                const joinDate = new Date(year, month - 1, day);
        
                const differenceInMilliseconds = today - joinDate;
                
                const daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));

                return new GuildMemberDemotion(username, guildRank, contributedGuildXP, highestClassLevel, contributionPosition, daysInGuild, demotionRequirements, chiefRequirements, strategistRequirements, captainRequirements, recruiterRequirements);
            }
        });

        demoteGuildMembers = demoteGuildMembers.filter(player => player !== undefined).filter(player => player.toString() !== '');

        const pages = [];
        let demoteMembersPage = '```\n';
        let counter = 0;

        demoteGuildMembers.forEach((player) => {
            if (counter === 20) {
                demoteMembersPage += '```';
                pages.push(demoteMembersPage);
                demoteMembersPage = '```\n' + player.toString();
                counter = 1;
            } else {
                demoteMembersPage += player.toString();
                counter++;
            }
        });

        if (counter <= 20) {
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
