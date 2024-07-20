const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const database = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewconfig')
        .setDescription('View the config in a user friendly format.'),
    ephemeral: true,
    async execute(interaction) {
        let configContent = `__${interaction.guild}'s Config__\n\n`;
        const pages = [];

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

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const memberOfRoleCheck = config.memberOfRole;

            const guildUuid = config.guild;

            // Requires a set guild to run command
            if (!guildUuid) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If member of role is used, require it to run command
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRoleCheck))) {
                const guildName = (await database.findGuild(guildUuid, true)).name;
                await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                return;
            }

            // Only owners and admins can run command
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            const guildName = (await database.findGuild(guildUuid, true)).name;

            // Add all of the various config options to a page and go to a new page every so often
            configContent += `Guild: ${guildName}\n`;
            configContent += `Chief Inactivity Upper Threshold: ${config.chiefUpperThreshold}\n`;
            configContent += `Chief Inactivity Lower Threshold: ${config.chiefLowerThreshold}\n`;
            configContent += `Chief Promotion Requirements: ${config.chiefPromotionRequirement}\n`;
            configContent += `Chief XP Promotion Requirement: ${config.chiefXPRequirement}\n`;
            configContent += `Chief Level Promotion Requirement: ${config.chiefLevelRequirement}\n`;
            configContent += `Chief Top Contributor Promotion Requirement: ${config.chiefContributorRequirement}\n`;
            configContent += `Chief Time Promotion Requirement: ${config.chiefTimeRequirement}\n`;
            configContent += `Strategist Inactivity Upper Threshold: ${config.strategistUpperThreshold}\n`;
            configContent += `Strategist Inactivity Lower Threshold: ${config.strategistLowerThreshold}\n`;
            configContent += `Strategist Promotion Requirements: ${config.strategistPromotionRequirement}\n`;
            configContent += `Strategist XP Promotion Requirement: ${config.strategistXPRequirement}\n`;
            configContent += `Strategist Level Promotion Requirement: ${config.strategistLevelRequirement}\n`;
            configContent += `Strategist Top Contributor Promotion Requirement: ${config.strategistContributorRequirement}\n`;
            configContent += `Strategist Time Promotion Requirement: ${config.strategistTimeRequirement}\n`;
            configContent += `Captain Inactivity Upper Threshold: ${config.captainUpperThreshold}\n`;
            configContent += `Captain Inactivity Lower Threshold: ${config.captainLowerThreshold}\n`;
            configContent += `Captain Promotion Requirements: ${config.captainPromotionRequirement}\n`;
            configContent += `Captain XP Promotion Requirement: ${config.captainXPRequirement}\n`;
            configContent += `Captain Level Promotion Requirement: ${config.captainLevelRequirement}\n`;
            configContent += `Captain Top Contributor Promotion Requirement: ${config.captainContributorRequirement}\n`;
            configContent += `Captain Time Promotion Requirement: ${config.captainTimeRequirement}\n`;
            configContent += `Recruiter Inactivity Upper Threshold: ${config.recruiterUpperThreshold}\n`;
            configContent += `Recruiter Inactivity Lower Threshold: ${config.recruiterLowerThreshold}\n`;
            configContent += `Recruiter Promotion Requirements: ${config.recruiterPromotionRequirement}\n`;
            configContent += `Recruiter XP Promotion Requirement: ${config.recruiterXPRequirement}\n`;
            configContent += `Recruiter Level Promotion Requirement: ${config.recruiterLevelRequirement}\n`;
            configContent += `Recruiter Top Contributor Promotion Requirement: ${config.recruiterContributorRequirement}\n`;
            configContent += `Recruiter Time Promotion Requirement: ${config.recruiterTimeRequirement}\n`;
            configContent += `Recruit Inactivity Upper Threshold: ${config.recruitUpperThreshold}\n`;
            configContent += `Recruit Inactivity Lower Threshold: ${config.recruitLowerThreshold}\n`;
            configContent += `Inactivity Level Requirement: ${config.levelRequirement}\n`;
            configContent += `Extra Time Multiplier: ${config.extraTimeMultiplier}\n`;
            configContent += `Average Online Requirement: ${config.averageRequirement}\n`;
            configContent += `Total Members Threshold: ${config.memberThreshold}\n`;
            configContent += `New Member Minimum Time: ${config.newPlayerMinimumTime}\n`;
            configContent += `New Member Threshold: ${config.newPlayerThreshold}\n`;
            configContent += `War Level Requirement: ${config.warLevelRequirement}\n`;

            pages.push(configContent);

            configContent = '';

            // If a user can be mentioned, replace it with a mention of the user that ran the command
            if (!config.joinMessage) {
                configContent += `Join Message: ${config.joinMessage}\n`;
            } else if (config.joinMessage.includes('$user$')) {
                configContent += `Join Message: ${config.joinMessage.replace('$user$', interaction.member.user).replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `Join Message: ${config.joinMessage.replace(/\\n/g, '\n')}\n`;
            }  

            // Or in this case, just use their username
            if (!config.leaveMessage) {
                configContent += `Leave Message: ${config.leaveMessage}\n`;
            } else if (config.joinMessage.includes('$user$')) {
                configContent += `Leave Message: ${config.leaveMessage.replace('$user$', interaction.member.user.username).replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `Leave Message: ${config.leaveMessage.replace(/\\n/g, '\n')}\n`;
            }

            pages.push(configContent);

            configContent = '';

            if (config.warMessage) {
                configContent += `War Message: ${config.warMessage.replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `War Message: ${config.warMessage}\n`;
            }

            if (config.warClassMessage) {
                configContent += `War Class Message: ${config.warClassMessage.replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `War Class Message: ${config.warClassMessage}\n`;
            }

            pages.push(configContent);

            configContent = '';

            if (config.classMessage) {
                configContent += `Class Message: ${config.classMessage.replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `Class Message: ${config.classMessage}\n`;
            }

            if (config.classArchetypeMessage) {
                configContent += `Class Archetype Message: ${config.classArchetypeMessage.replace(/\\n/g, '\n')}\n`;
            } else {
                configContent += `Class Archetype Message: ${config.classArchetypeMessage}\n`;
            }

            pages.push(configContent);

            configContent = '';

            configContent += `Update Roles Daily: ${config.updateRoles}\n`;
            configContent += `Only allow unique nicknames: ${config.checkDuplicateNicknames}\n`;
            configContent += `Send messages to log channel: ${config.logMessages}\n`;
            configContent += `Send join/leave messages: ${config.sendJoinLeaveMessages}\n`;
            configContent += `Add Veteran role: ${config.veteranRole}\n`;
            configContent += `Add Unverified role: ${config.verifyMembers}\n`;
            configContent += `Add Member of guild role: ${config.memberOf}\n`;
            configContent += `Add Level roles: ${config.levelRoles}\n`;
            configContent += `Add Server Rank roles: ${config.serverRankRoles}\n`;
            configContent += `Add guild prefixes to nicknames for non guild members: ${config.addGuildPrefixes}\n`;

            pages.push(configContent);

            configContent = '';

            const joinLeaveChannel = interaction.guild.channels.cache.get(config.joinLeaveChannel);

            // Link the channel if a valid one is present
            if (joinLeaveChannel) {
                configContent += `Join/Leave channel: ${joinLeaveChannel}\n`;
            } else {
                configContent += `Join/Leave channel: ${config.joinLeaveChannel}\n`;
            }

            const logChannel = interaction.guild.channels.cache.get(config.logChannel);

            if (logChannel) {
                configContent += `Log channel: ${logChannel}\n`;
            } else {
                configContent += `Log channel: ${config.logChannel}\n`;
            }

            const highRankChannel = interaction.guild.channels.cache.get(config.highRankChannel);

            if (highRankChannel) {
                configContent += `High Rank channel: ${highRankChannel}\n`;
            } else {
                configContent += `High Rank channel: ${config.highRankChannel}\n`;
            }

            pages.push(configContent);

            configContent = '';

            // @ The role if it is valid
            const adminRole = interaction.guild.roles.cache.get(adminRoleId);

            if (adminRole) {
                configContent += `Admin role: ${adminRole}\n`;
            } else {
                configContent += `Admin role: ${adminRoleId}\n`;
            }

            const ownerRole = interaction.guild.roles.cache.get(config.ownerRole);

            if (ownerRole) {
                configContent += `Owner role: ${ownerRole}\n`;
            } else {
                configContent += `Owner role: ${config.ownerRole}\n`;
            }

            const chiefRole = interaction.guild.roles.cache.get(config.chiefRole);

            if (chiefRole) {
                configContent += `Chief role: ${chiefRole}\n`;
            } else {
                configContent += `Chief role: ${config.chiefRole}\n`;
            }

            const strategistRole = interaction.guild.roles.cache.get(config.strategistRole);

            if (strategistRole) {
                configContent += `Strategist role: ${strategistRole}\n`;
            } else {
                configContent += `Strategist role: ${config.strategistRole}\n`;
            }

            const captainRole = interaction.guild.roles.cache.get(config.captainRole);

            if (captainRole) {
                configContent += `Captain role: ${captainRole}\n`;
            } else {
                configContent += `Captain role: ${config.captainRole}\n`;
            }

            const recruiterRole = interaction.guild.roles.cache.get(config.recruiterRole);

            if (recruiterRole) {
                configContent += `Recruiter role: ${recruiterRole}\n`;
            } else {
                configContent += `Recruiter role: ${config.recruiterRole}\n`;
            }

            const recruitRole = interaction.guild.roles.cache.get(config.recruitRole);

            if (recruitRole) {
                configContent += `Recruit role: ${recruitRole}\n`;
            } else {
                configContent += `Recruit role: ${config.recruitRole}\n`;
            }

            const allyOwnerRole = interaction.guild.roles.cache.get(config.allyOwnerRole);

            if (allyOwnerRole) {
                configContent += `Ally Owner role: ${allyOwnerRole}\n`;
            } else {
                configContent += `Ally Owner role: ${config.allyOwnerRole}\n`;
            }

            const allyRole = interaction.guild.roles.cache.get(config.allyRole);

            if (allyRole) {
                configContent += `Ally role: ${allyRole}\n`;
            } else {
                configContent += `Ally role: ${config.allyRole}\n`;
            }

            const championRole = interaction.guild.roles.cache.get(config.championRole);

            if (championRole) {
                configContent += `Champion role: ${championRole}\n`;
            } else {
                configContent += `Champion role: ${config.championRole}\n`;
            }

            const heroRole = interaction.guild.roles.cache.get(config.heroRole);

            if (heroRole) {
                configContent += `Hero role: ${heroRole}\n`;
            } else {
                configContent += `Hero role: ${config.heroRole}\n`;
            }

            const vipPlusRole = interaction.guild.roles.cache.get(config.vipPlusRole);

            if (vipPlusRole) {
                configContent += `VIP+ role: ${vipPlusRole}\n`;
            } else {
                configContent += `VIP+ role: ${config.vipPlusRole}\n`;
            }

            const vipRole = interaction.guild.roles.cache.get(config.vipRole);

            if (vipRole) {
                configContent += `VIP role: ${vipRole}\n`;
            } else {
                configContent += `VIP role: ${config.vipRole}\n`;
            }

            const vetRole = interaction.guild.roles.cache.get(config.vetRole);

            if (vetRole) {
                configContent += `Veteran role: ${vetRole}\n`;
            } else {
                configContent += `Veteran role: ${config.vetRole}\n`;
            }

            const memberOfRole = interaction.guild.roles.cache.get(config.memberOfRole);

            if (memberOfRole) {
                configContent += `Member of role: ${memberOfRole}\n`;
            } else {
                configContent += `Member of role: ${config.memberOfRole}\n`;
            }

            const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRole);

            if (verifiedRole) {
                configContent += `Verified role: ${verifiedRole}\n`;
            } else {
                configContent += `Verified role: ${config.verifiedRole}\n`;
            }

            const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRole);

            if (unverifiedRole) {
                configContent += `Unverified role: ${unverifiedRole}\n`;
            } else {
                configContent += `Unverified role: ${config.unverifiedRole}\n`;
            }

            const administratorRole = interaction.guild.roles.cache.get(config.administratorRole);

            if (administratorRole) {
                configContent += `Administrator role: ${administratorRole}\n`;
            } else {
                configContent += `Administrator role: ${config.administratorRole}\n`;
            }

            const moderatorRole = interaction.guild.roles.cache.get(config.moderatorRole);

            if (moderatorRole) {
                configContent += `Moderator role: ${moderatorRole}\n`;
            } else {
                configContent += `Moderator role: ${config.moderatorRole}\n`;
            }

            const contentTeamRole = interaction.guild.roles.cache.get(config.contentTeamRole);

            if (contentTeamRole) {
                configContent += `Content Team role: ${contentTeamRole}\n`;
            } else {
                configContent += `Content Team role: ${config.contentTeamRole}\n`;
            }

            pages.push(configContent);

            configContent = '';

            const levelRoleOne = interaction.guild.roles.cache.get(config.levelRoleOne);

            if (levelRoleOne) {
                configContent += `Level role one: ${levelRoleOne}\n`;
            } else {
                configContent += `Level role one: ${config.levelRoleOne}\n`;
            }

            configContent += `Level role one level: ${config.levelRoleOneLevel}\n`;

            const levelRoleTwo = interaction.guild.roles.cache.get(config.levelRoleTwo);

            if (levelRoleTwo) {
                configContent += `Level role two: ${levelRoleTwo}\n`;
            } else {
                configContent += `Level role two: ${config.levelRoleTwo}\n`;
            }

            configContent += `Level role two level: ${config.levelRoleTwoLevel}\n`;

            const levelRoleThree = interaction.guild.roles.cache.get(config.levelRoleThree);

            if (levelRoleThree) {
                configContent += `Level role three: ${levelRoleThree}\n`;
            } else {
                configContent += `Level role three: ${config.levelRoleThree}\n`;
            }

            configContent += `Level role three level: ${config.levelRoleThreeLevel}\n`;

            const levelRoleFour = interaction.guild.roles.cache.get(config.levelRoleFour);

            if (levelRoleFour) {
                configContent += `Level role four: ${levelRoleFour}\n`;
            } else {
                configContent += `Level role four: ${config.levelRoleFour}\n`;
            }

            configContent += `Level role four level: ${config.levelRoleFourLevel}\n`;

            const levelRoleFive = interaction.guild.roles.cache.get(config.levelRoleFive);

            if (levelRoleFive) {
                configContent += `Level role five: ${levelRoleFive}\n`;
            } else {
                configContent += `Level role five: ${config.levelRoleFive}\n`;
            }

            configContent += `Level role five level: ${config.levelRoleFiveLevel}\n`;

            const levelRoleSix = interaction.guild.roles.cache.get(config.levelRoleSix);

            if (levelRoleSix) {
                configContent += `Level role six: ${levelRoleSix}\n`;
            } else {
                configContent += `Level role six: ${config.levelRoleSix}\n`;
            }

            configContent += `Level role six level: ${config.levelRoleSixLevel}\n`;

            const levelRoleSeven = interaction.guild.roles.cache.get(config.levelRoleSeven);

            if (levelRoleSeven) {
                configContent += `Level role seven: ${levelRoleSeven}\n`;
            } else {
                configContent += `Level role seven: ${config.levelRoleSeven}\n`;
            }

            configContent += `Level role seven level: ${config.levelRoleSevenLevel}\n`;

            const levelRoleEight = interaction.guild.roles.cache.get(config.levelRoleEight);

            if (levelRoleEight) {
                configContent += `Level role eight: ${levelRoleEight}\n`;
            } else {
                configContent += `Level role eight: ${config.levelRoleEight}\n`;
            }

            configContent += `Level role eight level: ${config.levelRoleEightLevel}\n`;

            const levelRoleNine = interaction.guild.roles.cache.get(config.levelRoleNine);

            if (levelRoleNine) {
                configContent += `Level role nine: ${levelRoleNine}\n`;
            } else {
                configContent += `Level role nine: ${config.levelRoleNine}\n`;
            }

            configContent += `Level role nine level: ${config.levelRoleNineLevel}\n`;

            const levelRoleTen = interaction.guild.roles.cache.get(config.levelRoleTen);

            if (levelRoleTen) {
                configContent += `Level role ten: ${levelRoleTen}\n`;
            } else {
                configContent += `Level role ten: ${config.levelRoleTen}\n`;
            }

            configContent += `Level role ten level: ${config.levelRoleTenLevel}\n`;

            pages.push(configContent);

            configContent = '';

            const warRole = interaction.guild.roles.cache.get(config.warRole);

            if (warRole) {
                configContent += `War role: ${warRole}\n`;
            } else {
                configContent += `War role: ${config.warRole}\n`;
            }

            const tankRole = interaction.guild.roles.cache.get(config.tankRole);

            if (tankRole) {
                configContent += `Tank role: ${tankRole}\n`;
            } else {
                configContent += `Tank role: ${config.tankRole}\n`;
            }

            const healerRole = interaction.guild.roles.cache.get(config.healerRole);

            if (healerRole) {
                configContent += `Healer role: ${healerRole}\n`;
            } else {
                configContent += `Healer role: ${config.healerRole}\n`;
            }

            const damageRole = interaction.guild.roles.cache.get(config.damageRole);

            if (damageRole) {
                configContent += `Damage role: ${damageRole}\n`;
            } else {
                configContent += `Damage role: ${config.damageRole}\n`;
            }

            const soloRole = interaction.guild.roles.cache.get(config.soloRole);

            if (soloRole) {
                configContent += `Solo role: ${soloRole}\n`;
            } else {
                configContent += `Solo role: ${config.soloRole}\n`;
            }

            const ecoRole = interaction.guild.roles.cache.get(config.ecoRole);

            if (ecoRole) {
                configContent += `Eco role: ${ecoRole}\n`;
            } else {
                configContent += `Eco role: ${config.ecoRole}\n`;
            }

            const warrerRole = interaction.guild.roles.cache.get(config.warrerRole);

            if (ecoRole) {
                configContent += `Warrer role: ${warrerRole}\n`;
            } else {
                configContent += `Warrer role: ${config.warrerRole}\n`;
            }

            pages.push(configContent);

            configContent = '';

            const warriorRole = interaction.guild.roles.cache.get(config.warriorRole);

            if (warriorRole) {
                configContent += `Warrior role: ${warriorRole}\n`;
            } else {
                configContent += `Warrior role: ${config.warriorRole}\n`;
            }

            const fallenRole = interaction.guild.roles.cache.get(config.fallenRole);

            if (fallenRole) {
                configContent += `Fallen role: ${fallenRole}\n`;
            } else {
                configContent += `Fallen role: ${config.fallenRole}\n`;
            }

            const battleMonkRole = interaction.guild.roles.cache.get(config.battleMonkRole);

            if (battleMonkRole) {
                configContent += `Battle Monk role: ${battleMonkRole}\n`;
            } else {
                configContent += `Battle Monk role: ${config.battleMonkRole}\n`;
            }

            const paladinRole = interaction.guild.roles.cache.get(config.paladinRole);

            if (paladinRole) {
                configContent += `Paladin role: ${paladinRole}\n`;
            } else {
                configContent += `Paladin role: ${config.paladinRole}\n`;
            }

            const mageRole = interaction.guild.roles.cache.get(config.mageRole);

            if (mageRole) {
                configContent += `Mage role: ${mageRole}\n`;
            } else {
                configContent += `Mage role: ${config.mageRole}\n`;
            }

            const riftwalkerRole = interaction.guild.roles.cache.get(config.riftwalkerRole);

            if (riftwalkerRole) {
                configContent += `Riftwalker role: ${riftwalkerRole}\n`;
            } else {
                configContent += `Riftwalker role: ${config.riftwalkerRole}\n`;
            }

            const lightBenderRole = interaction.guild.roles.cache.get(config.lightBenderRole);

            if (lightBenderRole) {
                configContent += `Light Bender role: ${lightBenderRole}\n`;
            } else {
                configContent += `Light Bender role: ${config.lightBenderRole}\n`;
            }

            const arcanistRole = interaction.guild.roles.cache.get(config.arcanistRole);

            if (arcanistRole) {
                configContent += `Arcanist role: ${arcanistRole}\n`;
            } else {
                configContent += `Arcanist role: ${config.arcanistRole}\n`;
            }

            const archerRole = interaction.guild.roles.cache.get(config.archerRole);

            if (archerRole) {
                configContent += `Archer role: ${archerRole}\n`;
            } else {
                configContent += `Archer role: ${config.archerRole}\n`;
            }

            const sharpshooterRole = interaction.guild.roles.cache.get(config.sharpshooterRole);

            if (sharpshooterRole) {
                configContent += `Sharpshooter role: ${sharpshooterRole}\n`;
            } else {
                configContent += `Sharpshooter role: ${config.sharpshooterRole}\n`;
            }

            const trapperRole = interaction.guild.roles.cache.get(config.trapperRole);

            if (trapperRole) {
                configContent += `Trapper role: ${trapperRole}\n`;
            } else {
                configContent += `Trapper role: ${config.trapperRole}\n`;
            }

            const boltslingerRole = interaction.guild.roles.cache.get(config.boltslingerRole);

            if (boltslingerRole) {
                configContent += `Boltslinger role: ${boltslingerRole}\n`;
            } else {
                configContent += `Boltslinger role: ${config.boltslingerRole}\n`;
            }

            const shamanRole = interaction.guild.roles.cache.get(config.shamanRole);

            if (shamanRole) {
                configContent += `Shaman role: ${shamanRole}\n`;
            } else {
                configContent += `Shaman role: ${config.shamanRole}\n`;
            }

            const ritualistRole = interaction.guild.roles.cache.get(config.ritualistRole);

            if (ritualistRole) {
                configContent += `Ritualist role: ${ritualistRole}\n`;
            } else {
                configContent += `Ritualist role: ${config.ritualistRole}\n`;
            }

            const summonerRole = interaction.guild.roles.cache.get(config.summonerRole);

            if (summonerRole) {
                configContent += `Summoner role: ${summonerRole}\n`;
            } else {
                configContent += `Summoner role: ${config.summonerRole}\n`;
            }

            const acolyteRole = interaction.guild.roles.cache.get(config.acolyteRole);

            if (acolyteRole) {
                configContent += `Acolyte role: ${acolyteRole}\n`;
            } else {
                configContent += `Acolyte role: ${config.acolyteRole}\n`;
            }

            const assassinRole = interaction.guild.roles.cache.get(config.assassinRole);

            if (assassinRole) {
                configContent += `Assassin role: ${assassinRole}\n`;
            } else {
                configContent += `Assassin role: ${config.assassinRole}\n`;
            }

            const acrobatRole = interaction.guild.roles.cache.get(config.acrobatRole);

            if (acrobatRole) {
                configContent += `Acrobat role: ${acrobatRole}\n`;
            } else {
                configContent += `Acrobat role: ${config.acrobatRole}\n`;
            }

            const shadestepperRole = interaction.guild.roles.cache.get(config.shadestepperRole);

            if (shadestepperRole) {
                configContent += `Shadestepper role: ${shadestepperRole}\n`;
            } else {
                configContent += `Shadestepper role: ${config.shadestepperRole}\n`;
            }

            const tricksterRole = interaction.guild.roles.cache.get(config.tricksterRole);

            if (tricksterRole) {
                configContent += `Trickster role: ${tricksterRole}\n`;
            } else {
                configContent += `Trickster role: ${config.tricksterRole}\n`;
            }

            pages.push(configContent);

            // Create a ButtonedMessage with all of the pages of content

            // We know it will be multiple pages so add buttons
            const previousPage = new ButtonBuilder()
                .setCustomId('previousPage')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬅️');

            const nextPage = new ButtonBuilder()
                .setCustomId('nextPage')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️');

            const row = new ActionRowBuilder().addComponents(previousPage, nextPage);

            const editedReply = await interaction.editReply({
                content: viewConfigMessage.pages[0],
                components: [row],
            });

            viewConfigMessage.setMessage(editedReply);
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error viewing config.');
        }
    },
};
