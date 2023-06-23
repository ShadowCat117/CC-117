const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const ButtonedMessage = require('../../message_type/ButtonedMessage');
const TrackedGuild = require('../../message_objects/TrackedGuild');
const MessageManager = require('../../message_type/MessageManager');

function getAsync(query, params) {
	return new Promise((resolve, reject) => {
		db.get(query, params, function(err, rows) {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trackedguilds')
		.setDescription('View the average number of online players for each tracked guild.'),
	async execute(interaction) {
		await interaction.deferReply();

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

			if (config.trackedGuilds.includes(null)) {
				await interaction.editReply('You are not tracking any guilds.');
				return;
			}

			return new Promise((resolve, reject) => {
				const fetchData = async () => {
					try {
						const trackedGuilds = [];

						for (const tracked of config.trackedGuilds) {
							let averageOnline = 0;
							let averageCaptains = 0;
							let divideBy = 0;

							for (let i = 0; i < 24; i++) {
								const currentHour = i.toString().padStart(2, '0');
								const averageKey = 'average' + currentHour;
								const captainsKey = 'captains' + currentHour;
				
								const query = 'SELECT ' + averageKey + ', ' + captainsKey + ' FROM guilds WHERE name = ?';
								const params = [tracked];
				
								const result = await getAsync(query, params);

								if (result[averageKey] !== null && result[averageKey] !== -1) {
									averageOnline += result[averageKey];
									averageCaptains += result[captainsKey];
									divideBy++;
								}
							}

							const playerQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1';
							const playerResult = await getAsync(playerQuery, [tracked]);
							const currentOnline = playerResult.count;

							const captainRanks = ['CAPTAIN', 'STRATEGIST', 'CHIEF', 'OWNER'];
							const captainQuery = 'SELECT COUNT(*) as count FROM players WHERE guildName = ? AND isOnline = 1 AND guildRank IN (' + captainRanks.map(() => '?').join(',') + ')';
							const captainResult = await getAsync(captainQuery, [tracked, ...captainRanks]);
							const captainsOnline = captainResult.count;

							if (divideBy !== 0) {
								averageOnline /= divideBy;
								averageCaptains /= divideBy;

								trackedGuilds.push(new TrackedGuild(tracked, averageOnline, averageCaptains, currentOnline, captainsOnline));
							} else {
								trackedGuilds.push(new TrackedGuild(tracked, -1, -1, -1, -1));
							}
						}

						trackedGuilds.sort((a, b) => a.compareTo(b));

						const header = '```Guild Name          Avg. Online     Avg. Captains     Current Online     Current Captains\n-----------------------------------------------------------------------------------------\n';

						const pages = [];
						let page = header;
						let counter = 0;

						for (const trackedGuild of trackedGuilds) {
							if (counter < 10) {
								page += trackedGuild.toString();

								counter++;
							} else if (counter === 10) {
								page += '```';

								counter = 0;

								pages.push(page);

								page = header;

								page += trackedGuild.toString();
							}
						}

						if (counter <= 10) {
							page += '```';

							pages.push(page);
						}

						const trackedGuildsMessage = new ButtonedMessage('', [], '', pages);

						if (pages.length > 1) {
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
								content: trackedGuildsMessage.pages[0],
								components: [row],
							});

							trackedGuildsMessage.setMessage(editedReply);
					
							MessageManager.addMessage(trackedGuildsMessage);
						} else {
							await interaction.editReply({ content: trackedGuildsMessage.pages[0], components: [] });
						}
					
						resolve();
					} catch (error) {
						reject(error);
					}
				};

				fetchData();
			});
		} catch (error) {
			await interaction.editReply('Unable to show tracked guilds');
		}
	},
};