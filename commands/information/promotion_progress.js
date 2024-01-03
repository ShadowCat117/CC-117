const {
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotionprogress')
        .setDescription('Check how many requirements a player meets for their next guild rank.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to check.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;
            const memberRoles = interaction.member.roles.cache;

            const guildName = config.guildName;

            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            const username = interaction.options.getString('username');

            const promotionExceptions = config['promotionExceptions'] !== undefined ? config['promotionExceptions'] : {};

            const exemptUsernames = Object.keys(promotionExceptions);

            if (exemptUsernames.includes(username)) {
                if (promotionExceptions[username] === -1) {
                    await interaction.editReply(`${username} is exempt from promotions forever.`);
                } else {
                    await interaction.editReply(`${username} is exempt from promotions for ${promotionExceptions[username]} more day(s).`);
                }
                
                return;
            }

            const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
            const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
            const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
            const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
            const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);
            const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

            const guildMembers = await allAsync('SELECT UUID FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);
            const memberToCheck = await getAsync('SELECT UUID, username, guildRank, contributedGuildXP, highestClassLevel, guildJoinDate, wars FROM players WHERE username = ? AND guildName = ?', [username, guildName]);

            if (!memberToCheck) {
                await interaction.editReply(`${username} is not a member of ${guildName}`);
                return;
            }

            const tableName = guildName.replaceAll(' ', '_');

            const memberPlaytime = await getAsync(`SELECT averagePlaytime FROM ${tableName} WHERE UUID = ?`, [memberToCheck.UUID]);

            const contributionPos = guildMembers.findIndex(member => member.UUID === memberToCheck.UUID) + 1;

            const today = new Date();
            const [year, month, day] = memberToCheck.guildJoinDate.split('-');
            const joinDate = new Date(year, month - 1, day);
            const differenceInMilliseconds = today - joinDate;
            const daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));

            const serverMember = await findDiscordUser(interaction.guild.members.cache.values(), username);

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
                await interaction.editReply(`${username} is the owner of ${guildName}, they cannot be promoted.`);
                return;
            } else if (memberToCheck.guildRank === 'CHIEF') {
                await interaction.editReply(`${username} is a chief of ${guildName}, they cannot be promoted.`);
                return;
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
                if (contributionPos < contributionRequirement) {
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
                if (memberPlaytime.averagePlaytime >= weeklyPlaytimeRequirement) {
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

            const headerMessage = `${username} (${memberToCheck.guildRank}) has the following requirements for ${nextGuildRank} (${metRequirements}/${requirementsCount})\n`;

            const fullMessage = headerMessage + '\n' + timeMessage + '\n' + reqsMessage;

            await interaction.editReply(fullMessage);
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error checking promotion progress.');
            return;
        }
    },
};

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