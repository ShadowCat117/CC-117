const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const db = new sqlite3.Database('database/database.db');

async function allAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function worldActivity(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        // Get guild name from command input
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        // Get guild name from selected button
        nameToSearch = interaction.customId;
    }

    // Search for guild name in database
    const guildName = await findGuild(nameToSearch, force);

    // When multiple guilds matching the inbut were found, should never happen if force is true
    if (guildName && guildName.message === 'Multiple possibilities found') {
        let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

        // Add all guild names found to message
        for (let i = 0; i < guildName.guildNames.length; i++) {
            const name = guildName.guildNames[i];

            textMessage += `\n${i + 1}. ${name}`;
        }

        textMessage += '\nClick button to choose guild.';

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.WORLD_ACTIVITY, []);
    }

    if (guildName) {
        // Query database for worlds with players online in selected guild
        const query = `
            SELECT onlineWorld, COUNT(*) AS count
            FROM players
            WHERE guildName = ? AND isOnline = 1 AND onlineWorld IS NOT NULL
            GROUP BY onlineWorld
            ORDER BY count DESC
            `;

        try {
            const results = await allAsync(query, [guildName]);

            // No players online
            if (results.length === 0) {
                return new ButtonedMessage('Nobody online', [], '', [`Nobody online in ${guildName}`]);
            }

            let activeWorlds = [];
            let maxCount = 0;

            // Sort through the worlds and only keep the ones with the most players on
            results.forEach((row) => {
                const { onlineWorld, count } = row;
                if (count > maxCount) {
                    activeWorlds = [onlineWorld];
                    maxCount = count;
                } else if (count === maxCount) {
                    activeWorlds.push(onlineWorld);
                }
            });

            let message;

            // Get return message to be displayed, displaying / between multiple worlds
            if (maxCount > 1) {
                message = `${guildName} is most active on world ${activeWorlds.join('/')} with ${maxCount} players`;
            } else {
                message = `${guildName} is most active on world ${activeWorlds.join('/')} with ${maxCount} player`;
            }

            return new ButtonedMessage('', [], '', [message]);
        } catch (err) {
            console.error('Error executing the query: ', err);
            return new ButtonedMessage('', [], '', [`Error occurred while searching for world activity of ${guildName}`]);
        }
    } else {
        // Unable to find guild
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

module.exports = worldActivity;
