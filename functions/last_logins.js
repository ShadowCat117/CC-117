const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const PlayerLastLogin = require('../message_objects/PlayerLastLogin');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const db = new sqlite3.Database('database/database.db');

async function lastLogins(interaction, force = false) {
	let nameToSearch;

	if (interaction.options !== undefined) {
		nameToSearch = interaction.options.getString('guild_name');
	} else {
		nameToSearch = interaction.customId;
	}
	
	const guildName = await findGuild(nameToSearch, force);

	if (guildName.message === 'Multiple possibilities found') {
		let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

		for (let i = 0; i < guildName.guildNames.length; i++) {
			const name = guildName.guildNames[i];
			
			textMessage += `\n${i + 1}. ${name}`;
		}

		textMessage += '\nClick button to choose guild.';

		return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.LAST_LOGINS, []);
	}
	
	if (guildName) {
		const guildId = interaction.guild.id;
		const directoryPath = path.join(__dirname, '..', 'configs');
		const filePath = path.join(directoryPath, `${guildId}.json`);
	
		try {
			let config = {};
		
			if (fs.existsSync(filePath)) {
				const fileData = fs.readFileSync(filePath, 'utf-8');
				config = JSON.parse(fileData);
			}
		
			if (config.guildName === guildName) {
				const chiefThreshold = config.chiefThreshold;
				const strategistThreshold = config.strategistThreshold;
				const captainThreshold = config.captainThreshold;
				const recruiterThreshold = config.recruiterThreshold;
				const recruitThreshold = config.recruitThreshold;
		
				return new Promise((resolve, reject) => {
				db.all(
					'SELECT username, guildRank, lastJoin, isOnline FROM players WHERE guildName = ?',
					[guildName],
					async (err, rows) => {
					if (err) {
						console.error('Error retrieving player data:', err);
						reject(err);
					}
		
					const playerLastLogins = rows.map(row => {
						const { username, guildRank, lastJoin, isOnline } = row;
						const displayColours = true;
						let inactiveThreshold;
		
						switch (guildRank) {
						case 'CHIEF':
							inactiveThreshold = chiefThreshold;
							break;
						case 'STRATEGIST':
							inactiveThreshold = strategistThreshold;
							break;
						case 'CAPTAIN':
							inactiveThreshold = captainThreshold;
							break;
						case 'RECRUITER':
							inactiveThreshold = recruiterThreshold;
							break;
						case 'RECRUIT':
							inactiveThreshold = recruitThreshold;
							break;
						default:
							inactiveThreshold = Number.MAX_SAFE_INTEGER;
							break;
						}
		
						const currentDate = new Date();
						const lastJoinDate = new Date(lastJoin);
						const timeDiff = currentDate.getTime() - lastJoinDate.getTime();
						const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
		
						return new PlayerLastLogin(username, guildRank, daysSinceLastLogin, isOnline, displayColours, inactiveThreshold);
					});
		
					playerLastLogins.sort((a, b) => a.compareTo(b));
		
					const pages = [];
					let lastLoginsPage = '```diff\n';
					let counter = 0;
		
					playerLastLogins.forEach((player) => {
						if (counter === 30) {
						lastLoginsPage += '```';
						pages.push(lastLoginsPage);
						lastLoginsPage = '```diff\n' + player.toString();
						counter = 1;
						} else {
						lastLoginsPage += player.toString();
						counter++;
						}
					});
		
					if (counter !== 30) {
						lastLoginsPage += '```';
						pages.push(lastLoginsPage);
					}
		
					const lastLoginsMessage = new ButtonedMessage('', [], '', pages);
		
					resolve(lastLoginsMessage);
					},
				);
				});
			} else {
				return new Promise((resolve, reject) => {
				db.all(
					'SELECT username, guildRank, lastJoin, isOnline FROM players WHERE guildName = ?',
					[guildName],
					async (err, rows) => {
					if (err) {
						console.error('Error retrieving player data:', err);
						reject(err);
					}
		
					const playerLastLogins = rows.map(row => {
						const { username, guildRank, lastJoin, isOnline } = row;
		
						const currentDate = new Date();
						const lastJoinDate = new Date(lastJoin);
						const timeDiff = currentDate.getTime() - lastJoinDate.getTime();
						const daysSinceLastLogin = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
		
						return new PlayerLastLogin(username, guildRank, daysSinceLastLogin, isOnline, false, 0);
					});
		
					playerLastLogins.sort((a, b) => a.compareTo(b));
		
					const pages = [];
					let lastLoginsPage = '```\n';
					let counter = 0;
		
					playerLastLogins.forEach((player) => {
						if (counter === 30) {
						lastLoginsPage += '```';
						pages.push(lastLoginsPage);
						lastLoginsPage = '```\n' + player.toString();
						counter = 1;
						} else {
						lastLoginsPage += player.toString();
						counter++;
						}
					});
		
					if (counter !== 30) {
						lastLoginsPage += '```';
						pages.push(lastLoginsPage);
					}
		
					const lastLoginsMessage = new ButtonedMessage('', [], '', pages);
		
					resolve(lastLoginsMessage);
					},
				);
				});
			}
		} catch (error) {
			return new ButtonedMessage('', [], '', [`Error checking last login stats for ${guildName}.`]);
		}
	} else {
		return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
	}
}

module.exports = lastLogins;