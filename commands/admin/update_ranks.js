const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateranks')
		.setDescription('Updates the rank of every member of the server.'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
