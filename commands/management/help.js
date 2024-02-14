const {
    SlashCommandBuilder,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sends a link to the temporary manual.'),
    ephemeral: true,
    async execute(interaction) {
        const message = 'The CC-117 Manual is available at this link: \nhttps://docs.google.com/document/d/1anSFPfBuMPzKJ7JwejBnpB7KMsiw-Lrk50LMfNRJt6Q/edit?usp=sharing';

        await interaction.editReply(message);
    },
};
