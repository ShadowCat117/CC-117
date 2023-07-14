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
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId;
    }

    const guildName = await findGuild(nameToSearch, force);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        let textMessage = `Multiple guilds found with the name/prefix: ${nameToSearch}.`;

        for (let i = 0; i < guildName.guildNames.length; i++) {
            const name = guildName.guildNames[i];

            textMessage += `\n${i + 1}. ${name}`;
        }

        textMessage += '\nClick button to choose guild.';

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.WORLD_ACTIVITY, []);
    }

    if (guildName) {
        const query = `
            SELECT onlineWorld, COUNT(*) AS count
            FROM players
            WHERE guildName = ? AND onlineWorld IS NOT NULL
            GROUP BY onlineWorld
            ORDER BY count DESC
            `;

        try {
            const results = await allAsync(query, [guildName]);
        
            let activeWorlds = [];
            let maxCount = 0;

            if (results.length === 0) {
                return new ButtonedMessage('Nobody online', [], '', [`Nobody online in ${guildName}`]);
            }
        
            results.forEach((row) => {
                const { onlineWorld, count } = row;
        
                if (count > maxCount) {
                    activeWorlds = [onlineWorld];
                    maxCount = count;
                } else if (count === maxCount) {
                    activeWorlds.push(onlineWorld);
                }
            });

            activeWorlds.sort((a, b) => a - b);
        
            return new ButtonedMessage('', [], '', [`${guildName} is most active on world ${activeWorlds.join('/')}`]);
        } catch (err) {
            console.error('Error executing the query: ', err);
            return new ButtonedMessage('', [], '', [`Error occurred while searching for world activity of ${guildName}`]);
        }
    } else {
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

module.exports = worldActivity;
