const { SlashCommandBuilder } = require('discord.js');
const createConfig = require('../../functions/create_config');
const updateRanks = require('../../functions/update_ranks');
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateranks')
		.setDescription('Updates the rank of every member of the server.'),
	async execute(interaction) {
		await interaction.deferReply();

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

			if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
				await interaction.editReply('You do not have the required permissions to run this command.');
				return;
			}

		} catch (error) {
			console.log(error);
			await interaction.editReply('Error updating ranks.');
			return;
		}

		const response = await updateRanks(interaction.guild);

		await interaction.editReply(response);
	},
};