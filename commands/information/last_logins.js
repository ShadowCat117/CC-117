const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const MessageManager = require('../../message_type/MessageManager');
const lastLogins = require('../../functions/last_logins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lastlogins')
        .setDescription('View the last time each member of a guild logged in.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to see last logins for.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        const response = await lastLogins(interaction);

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
        } else if (response.pages.length > 1) {
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

            MessageManager.addMessage(response);
        } else if (response.pages[0] === '```\n```') {
            interaction.editReply({
                content: `No players found in the guild ${interaction.options.getString('guild_name')}`,
                components: [],
            });
        } else {
            await interaction.editReply(response.pages[0]);
        }
    },
};
