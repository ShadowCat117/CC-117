const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bannedplayers')
        .setDescription('Check who is banned from joining your guild.'),
    ephemeral: false,
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

            // No players are on the banned list
            if (!config['bannedPlayers'] || config['bannedPlayers'].length === 0) {
                await interaction.editReply('No players are banned');
                return;
            }

            // Create the list of banned players
            const bannedList = Object.entries(config['bannedPlayers']).map(([username, reason]) => {
                return `${username}\nReason: ${reason}\n`;
            });
            
            const bannedPlauers = bannedList.join('\n');            

            await interaction.editReply(`Players banned from ${guildName}: \n\n${bannedPlauers}`);
        } catch (error) {
            await interaction.editReply('Unable to show banned players');
        }
    },
};
