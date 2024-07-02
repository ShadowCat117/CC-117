const fs = require('fs');
const path = require('path');
const findPlayer = require('../database/database');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const {
    admins,
} = require('../config.json');

// Call run queries on the database with promises
async function runAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

async function registerUser(interaction, discordId, force = false) {
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'configs', `${guildId}.json`);

    try {
        let config = {};

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);
        }

        let guildName;

        // If an admin is running the command, they can register anyone, otherwise use the current set guild
        if (admins.includes(interaction.member.id)) {
            guildName = '';
        } else {
            guildName = config.guildName;
        }

        let nameToSearch;

        if (interaction.options !== undefined) {
            nameToSearch = interaction.options.getString('username');
        } else if (interaction.customId) {
            nameToSearch = interaction.customId;
        }

        const player = await findPlayer(nameToSearch, guildName, force);

        if (player != null && player.message === 'Multiple possibilities found') {
            let textMessage = `Multiple players found with the username: ${nameToSearch}.`;
    
            for (let i = 0; i < player.playerUuids.length; i++) {
                const uuid = player.playerUuids[i];
                const playerUsername = player.playerUsernames[i];
                const rank = player.playerRanks[i];
                const guildRank = player.playerGuildRanks[i];
                const playerGuildName = player.playerGuildNames[i];

                if (!rank && !playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername} (UUID: ${uuid})`;
                } else if (!rank) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                } else if (!playerGuildName) {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank}. (UUID: ${uuid})`;
                } else {
                    textMessage += `\n${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}. (UUID: ${uuid})`;
                }
            }
    
            textMessage += '\nClick button to choose player.';
            textMessage += `\n${discordId}`;
            }

        if (!player) {
        }

        try {
            // Remove any previous registered account and then add the new one
            await runAsync('UPDATE players SET discordId = NULL WHERE discordId = ?', [discordId]);
            await runAsync('UPDATE players SET discordId = ? WHERE UUID = ?', [discordId, player.uuid]);
        } catch (error) {
            console.log(`Error registering user: ${error}`);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = registerUser;
