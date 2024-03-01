const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotionexceptions')
        .setDescription('Check who in your guild is exempt from promotion.'),
    ephemeral: true,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

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
            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;

            const guildName = config.guildName;

            // Command can only be ran if the server has a guild set
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, check the user has it to let them run the command
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Only users with the admin role or above can run the command, also the server owner
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            // No players are on the exempt list
            if (!config['promotionExceptions'] || config['promotionExceptions'].length === 0) {
                await interaction.editReply('No players are exempt from promotion');
                return;
            }

            // Create the list of exempt players
            const exemptionList = Object.entries(config['promotionExceptions']).map(([username, period]) => {
                if (period === -1) {
                    return `${username} is exempt from promotion forever`;
                } else {
                    return `${username} is exempt from promotion for ${period} day(s)`;
                }
            });
            
            const exemptPlayers = exemptionList.join('\n');
            

            await interaction.editReply(`Players who are exempt from promotion: \n${exemptPlayers}`);
        } catch (error) {
            await interaction.editReply('Unable to show promotion exemptions');
        }
    },
};
