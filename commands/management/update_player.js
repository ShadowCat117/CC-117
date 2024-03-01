const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const updatePlayer = require('../../functions/update_player');
const MessageManager = require('../../message_type/MessageManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateplayer')
        .setDescription('Prioritises a player to be updated in the database.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('The name of the player you want to be updated.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        // Call updatePlayer
        const response = await updatePlayer(interaction, false);

        if (response.componentIds.length > 0) {
            // If multiple players found, display options
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
            // Player found, show response
            await interaction.editReply(response.pages[0]);
        }
    },
};
