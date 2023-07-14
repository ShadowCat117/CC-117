const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const MessageManager = require('../../message_type/MessageManager');
const worldActivity = require('../../functions/world_activity');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('worldactivity')
        .setDescription('View which world a guild is most active in currently.')
        .addStringOption(option =>
            option.setName('guild_name')
            .setDescription('The name of the guild you want to see the active world for.')
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const response = await worldActivity(interaction);

        if (response.componentIds.length > 0) {
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
        } else if (response.text === 'Nobody online') {
            interaction.editReply({
                content: response.pages[0],
                components: [],
            });
        } else {
            await interaction.editReply(response.pages[0]);
        }
    },
};
