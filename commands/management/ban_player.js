const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const banPlayer = require('../../functions/ban_player');
const MessageManager = require('../../message_type/MessageManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banplayer')
        .setDescription('Adds a player to the banned list so they shouldn\'t be invited to the guild.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to add to the banned list.')
                .setRequired(true))
        .addStringOption((option) =>
        option.setName('reason')
            .setDescription('Why is this player banned from joining?')
            .setRequired(true)),
    ephemeral: true,
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

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;
            const guildName = config.guildName;

            // A guild must be set to use this command
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, require it
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Only owners and admins can run this command
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }  

            // Get the ban reason
            const reason = interaction.options.getString('reason');

            // Call banPlayer
            const response = await banPlayer(interaction, false, reason);

            if (response.componentIds.length > 0) {
                // If multiple players were found, present choice
                const row = new ActionRowBuilder();
    
                for (let i = 0; i < response.componentIds.length; i++) {
                    const button = new ButtonBuilder()
                        .setCustomId(response.componentIds[i])
                        .setStyle(ButtonStyle.Primary)
                        .setLabel((i + 1).toString());
                    row.addComponents(button);
                }
    
                const editedReply = await interaction.editReply({
                    content: response.text,
                    components: [row],
                });
    
                response.setMessage(editedReply);
    
                MessageManager.addMessage(response);
            } else {
                // Found player, show response
                await interaction.editReply(response.pages[0]);
            }
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error banning player');
            return;
        }
    },
};
