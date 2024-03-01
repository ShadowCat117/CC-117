const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inactivityexceptions')
        .setDescription('Check who in your guild has custom inactivity thresholds.'),
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

            // A guild must be set to use the command
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, the user must have it
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Only the owner or users with the admin command or above can run the command
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            // No players have a custom inactivity threshold
            if (!config['inactivityExceptions'] || Object.keys(config['inactivityExceptions']).length === 0) {
                await interaction.editReply('No players with custom inactivity thresholds');
                return;
            }

            // Create the list of exceptions
            const exemptionList = Object.entries(config['inactivityExceptions']).map(([username, period]) => {
                if (period === -1) {
                    return `${username} is exempt from inactivity forever`;
                } else {
                    return `${username} is allowed to be inactive ${period} day(s)`;
                }
            });
            
            const inactivityThresholds = exemptionList.join('\n');            

            await interaction.editReply(`Players with custom inactivity thresholds: \n${inactivityThresholds}`);
        } catch (error) {
            await interaction.editReply('Unable to show inactivity exceptions');
        }
    },
};
