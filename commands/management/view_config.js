const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewconfig')
        .setDescription('View the config in a user friendly format.'),
    async execute(interaction) {
        let configContent = `__${interaction.guild}'s Config__\n\n`;

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

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

            configContent += `Guild: ${config.guildName}\n`;
            configContent += `Chief Inactivity Threshold: ${config.chiefThreshold}\n`;
            configContent += `Strategist Inactivity Threshold: ${config.strategistThreshold}\n`;
            configContent += `Captain Inactivity Threshold: ${config.captainThreshold}\n`;
            configContent += `Recruiter Inactivity Threshold: ${config.recruiterThreshold}\n`;
            configContent += `Recruit Inactivity Threshold: ${config.recruitThreshold}\n`;

            if (config.joinMessage.includes('$user$')) {
                configContent += `Join Message: ${config.joinMessage.replace('$user$', interaction.member.user)}\n`;
            } else {
                configContent += `Join Message: ${config.joinMessage}\n`;
            }

            if (config.joinMessage.includes('$user$')) {
                configContent += `Leave Message: ${config.leaveMessage.replace('$user$', interaction.member.user)}\n`;
            } else {
                configContent += `Leave Message: ${config.leaveMessage}\n`;
            }

            configContent += `Update Ranks Daily: ${config.updateRanks}\n`;
            configContent += `Change nicknames to Minecraft username: ${config.changeNicknames}\n`;
            configContent += `Only allow unique nicknames: ${config.checkDuplicateNicknames}\n`;
            configContent += `Send messages to log channel: ${config.logMessages}\n`;
            configContent += `Send join/leave messages: ${config.sendJoinLeaveMessages}\n`;
            configContent += `Add Veteran role: ${config.veteranRole}\n`;
            configContent += `Add Unverified role: ${config.verifyMembers}\n`;
            configContent += `Add Member of guild role: ${config.memberOf}\n`;

            const joinLeaveChannel = interaction.guild.channels.cache.get(config.joinLeaveChannel);

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

            const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRole);

            if (unverifiedRole) {
                configContent += `Unverified role: ${unverifiedRole}\n`;
            } else {
                configContent += `Unverified role: ${config.unverifiedRole}\n`;
            }

            await interaction.reply({
                content: configContent,
                ephemeral: true,
            });
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'Error viewing config.',
                ephemeral: true,
            });
        }
    },
};
