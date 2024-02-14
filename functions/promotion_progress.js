const ButtonedMessage = require('../message_type/ButtonedMessage');
const fs = require('fs');
const path = require('path');
const findPlayer = require('./find_player');
const MessageType = require('../message_type/MessageType');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

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

async function promotionProgress(interaction, force = false) {
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        const guildName = config.guildName;

        let nameToSearch;

        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('username');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId;
        }

        const player = await findPlayer(nameToSearch, guildName, force);

        if (player != null && player.message === 'Multiple possibilities found') {
            let textMessage = `Multiple players found with the username: ${nameToSearch}.`;
    
            for (let i = 0; i < player.playerUuids.length; i++) {
                const uuid = player.playerUuids[i];
                const playerUsername = player.playerUsernames[i];
                const rank = player.playerRanks[i];
                const guildRank = player.playerGuildRanks[i];
                const playerGuildName = player.playerGuildNames[i];

                if (!rank && !playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername} (UUID: ${uuid})`;
                } else if (!rank) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                } else if (!playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank}. (UUID: ${uuid})`;
                } else {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                }
            }
    
            textMessage += '\nClick button to choose player.';
    
            return new ButtonedMessage(textMessage, player.playerUuids, MessageType.PROMOTION_PROGRESS, []);
        }

        if (!player) {
            return new ButtonedMessage('', [], '', [`Unknown player, ${nameToSearch.replace(/_/g, '\\_')}. They may not be a member of ${guildName}`]);
        }

        const promotionExceptions = config['promotionExceptions'] !== undefined ? config['promotionExceptions'] : {};

        const exemptUsernames = Object.keys(promotionExceptions);

        if (exemptUsernames.includes(player.username)) {
            if (promotionExceptions[player.username] === -1) {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is exempt from promotions forever.`]);
            } else {
                return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is exempt from promotions for ${promotionExceptions[player.username]} more day(s).`]);
            }
        }

        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
        const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
        const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const guildMembers = await allAsync('SELECT UUID FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);
        const memberToCheck = await getAsync('SELECT UUID, username, guildRank, contributedGuildXP, highestClassLevel, guildJoinDate, wars FROM players WHERE UUID = ? AND guildName = ?', [player.uuid, guildName]);

        if (!memberToCheck) {
            return new ButtonedMessage('', [], '', [`${nameToSearch.replace(/_/g, '\\_')} is not a member of ${guildName}`]);
        }

        const tableName = guildName.replaceAll(' ', '_');

        const memberPlaytime = await getAsync(`SELECT averagePlaytime FROM ${tableName} WHERE UUID = ?`, [memberToCheck.UUID]);

        const contributionPos = guildMembers.findIndex(member => member.UUID === memberToCheck.UUID) + 1;

        const today = new Date();
        const [year, month, day] = memberToCheck.guildJoinDate.split('-');
        const joinDate = new Date(year, month - 1, day);
        const differenceInMilliseconds = today - joinDate;
        const daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));

        const serverMember = await findDiscordUser(interaction.guild.members.cache.values(), player.username);

        let hasBuildRole = false;
        let hasEcoRole = false;

        if (serverMember) {
            const serverMemberRoles = serverMember.roles.cache;

            for (const role of serverMemberRoles.values()) {
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

        let promotionRequirements;
        let timeRequirement;
        let requirementsCount;

        let XPRequirement;
        let levelRequirement;
        let contributionRequirement;
        let optionalTimeRequirement;
        let warsRequirement;
        let weeklyPlaytimeRequirement ;

        let nextGuildRank;

        if (memberToCheck.guildRank === 'OWNER') {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is the owner of ${guildName}, they cannot be promoted.`]);
        } else if (memberToCheck.guildRank === 'CHIEF') {
            return new ButtonedMessage('', [], '', [`${player.username.replace(/_/g, '\\_')} is a chief of ${guildName}, they cannot be promoted.`]);
        } else if (memberToCheck.guildRank === 'STRATEGIST') {
            promotionRequirements = config.chiefPromotionRequirement;
            timeRequirement = config.chiefTimeRequirement;
            requirementsCount = config.chiefRequirementsCount;

            XPRequirement = config.chiefXPRequirement;
            levelRequirement = config.chiefLevelRequirement;
            contributionRequirement = config.chiefContributorRequirement;
            optionalTimeRequirement = config.chiefOptionalTimeRequirement;
            warsRequirement = config.chiefWarsRequirement;
            weeklyPlaytimeRequirement = config.chiefWeeklyPlaytimeRequirement;

            nextGuildRank = 'CHIEF';
        } else if (memberToCheck.guildRank === 'CAPTAIN') {
            promotionRequirements = config.strategistPromotionRequirement;
            timeRequirement = config.strategistTimeRequirement;
            requirementsCount = config.strategistRequirementsCount;

            XPRequirement = config.strategistXPRequirement;
            levelRequirement = config.strategistLevelRequirement;
            contributionRequirement = config.strategistContributorRequirement;
            optionalTimeRequirement = config.strategistOptionalTimeRequirement;
            warsRequirement = config.strategistWarsRequirement;
            weeklyPlaytimeRequirement = config.strategistWeeklyPlaytimeRequirement;

            nextGuildRank = 'STRATEGIST';
        } else if (memberToCheck.guildRank === 'RECRUITER') {
            promotionRequirements = config.captainPromotionRequirement;
            timeRequirement = config.captainTimeRequirement;
            requirementsCount = config.captainRequirementsCount;

            XPRequirement = config.captainXPRequirement;
            levelRequirement = config.captainLevelRequirement;
            contributionRequirement = config.captainContributorRequirement;
            optionalTimeRequirement = config.captainOptionalTimeRequirement;
            warsRequirement = config.captainWarsRequirement;
            weeklyPlaytimeRequirement = config.captainWeeklyPlaytimeRequirement;

            nextGuildRank = 'CAPTAIN';
        } else if (memberToCheck.guildRank === 'RECRUIT') {
            promotionRequirements = config.recruiterPromotionRequirement;
            timeRequirement = config.recruiterTimeRequirement;
            requirementsCount = config.recruiterRequirementsCount;

            XPRequirement = config.recruiterXPRequirement;
            levelRequirement = config.recruiterLevelRequirement;
            contributionRequirement = config.recruiterContributorRequirement;
            optionalTimeRequirement = config.recruiterOptionalTimeRequirement;
            warsRequirement = config.recruiterWarsRequirement;
            weeklyPlaytimeRequirement = config.recruiterWeeklyPlaytimeRequirement;

            nextGuildRank = 'RECRUITER';
        }

        let metRequirements = 0;

        let timeMessage;

        if (daysInGuild < timeRequirement) {
            timeMessage = `🔴 Does not meet time requirement (${daysInGuild} days/${timeRequirement} days)\n`;
        } else {
            timeMessage = `🟢 Meets time requirement (${daysInGuild} days/${timeRequirement} days)\n`;
        }

        let reqsMessage = '';

        if (promotionRequirements.includes('XP')) {
            if (memberToCheck.contributedGuildXP >= XPRequirement) {
                reqsMessage += `🟢 Has contributed enough XP (${memberToCheck.contributedGuildXP.toLocaleString()}/${XPRequirement.toLocaleString()})\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Has not contributed enough XP (${memberToCheck.contributedGuildXP.toLocaleString()}/${XPRequirement.toLocaleString()})\n`;
            }
        }

        if (promotionRequirements.includes('LEVEL')) {
            if (memberToCheck.highestClassLevel >= levelRequirement) {
                reqsMessage += `🟢 Has a high enough level class (${memberToCheck.highestClassLevel}/${levelRequirement})\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Does not have a high enough level class (${memberToCheck.highestClassLevel}/${levelRequirement})\n`;
            }
        }

        if (promotionRequirements.includes('TOP')) {
            if (contributionPos <= contributionRequirement) {
                reqsMessage += `🟢 Is a top contributor (${contributionPos}/${contributionRequirement})\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Is not a top contributor (${contributionPos}/${contributionRequirement})\n`;
            }
        }

        if (promotionRequirements.includes('TIME')) {
            if (daysInGuild >= optionalTimeRequirement) {
                reqsMessage += `🟢 Has been in the guild long enough (${daysInGuild}/${optionalTimeRequirement})\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Has not been in the guild long enough (${daysInGuild}/${optionalTimeRequirement})\n`;
            }
        }

        if (promotionRequirements.includes('WARS')) {
            if (memberToCheck.wars >= warsRequirement) {
                reqsMessage += `🟢 Has participated in enough wars (${memberToCheck.wars}/${warsRequirement})\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Has not participated in enough wars (${memberToCheck.wars}/${warsRequirement})\n`;
            }
        }

        if (promotionRequirements.includes('BUILD')) {
            if (hasBuildRole) {
                reqsMessage += '🟢 Has a war build\n';
                metRequirements++;
            } else {
                reqsMessage += '🔴 Does not have a war build\n';
            }
        }

        if (promotionRequirements.includes('PLAYTIME')) {
            if (!memberPlaytime || memberPlaytime.averagePlaytime === -1) {
                reqsMessage += '🔴 Has not been in guild long enough for weekly playtime to be tracked\n';
            } else if (memberPlaytime.averagePlaytime >= weeklyPlaytimeRequirement) {
                reqsMessage += `🟢 Has enough weekly playtime (${parseFloat(memberPlaytime.averagePlaytime.toFixed(2))} hrs/${weeklyPlaytimeRequirement} hrs)\n`;
                metRequirements++;
            } else {
                reqsMessage += `🔴 Does not have enough weekly playtime (${parseFloat(memberPlaytime.averagePlaytime.toFixed(2))} hrs/${weeklyPlaytimeRequirement} hrs)\n`;
            }
        }

        if (promotionRequirements.includes('ECO')) {
            if (hasEcoRole) {
                reqsMessage += '🟢 Is willing to learn/knows eco';
                metRequirements++;
            } else {
                reqsMessage += '🔴 Is not willing to learn and does not know eco';
            }
        }

        const headerMessage = `${player.username.replace(/_/g, '\\_')} (${memberToCheck.guildRank}) has the following requirements for ${nextGuildRank} (${metRequirements}/${requirementsCount})\n`;

        const fullMessage = headerMessage + '\n' + timeMessage + '\n' + reqsMessage;

        return new ButtonedMessage('', [], '', [fullMessage]);
    } catch (error) {
        console.log(error);
        return new ButtonedMessage('', [], '', ['Unable to display promotion progress.']);
    }
}

async function findDiscordUser(serverMembers, username) {
    for (const serverMember of serverMembers) {
        if (serverMember.user.bot) {
            continue;
        }

        if (username === serverMember.user.username || username === serverMember.user.globalName || username === serverMember.nickname) {
            return serverMember;
        }
    }

    return null;
}

module.exports = promotionProgress;
