const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const checkForPromotions = require('../../functions/check_for_promotions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkforpromotions')
        .setDescription('Check your guild members to see who should be a higher rank.'),
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

            // The command can only be ran if the server has a guild set
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, then check if the user who ran the command has it
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply('Error checking for demotions.');
            return;
        }

        // Call checkForPromotions
        const response = await checkForPromotions(interaction);

        if (response.pages.length > 1) {
            // Show buttons for navigating between multiple pages
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
                content: response.pages[0],
                components: [row],
            });

            response.setMessage(editedReply);
        } else if (response.pages[0] === '```\n```') {
            // No players need promoting
            interaction.editReply({
                content: 'No players found in your guild that need promoting.',
                components: [],
            });
        } else {
            // Only one page of promotions
            await interaction.editReply(response.pages[0]);
        }
    },
};
