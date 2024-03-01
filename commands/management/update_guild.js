const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const updateGuild = require('../../functions/update_guild');
const MessageManager = require('../../message_type/MessageManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateguild')
        .setDescription('Prioritises a guild to be updated in the database.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to be updated.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        // Call updateGuild
        const response = await updateGuild(interaction);

        if (response.componentIds.length > 0) {
            // Multiple guilds found, show options
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
            // Guild found, show response
            await interaction.editReply(response.pages[0]);
        }
    },
};
