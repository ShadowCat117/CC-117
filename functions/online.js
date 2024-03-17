const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const OnlineGuildMember = require('../message_objects/OnlineGuildMember');
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

async function online(interaction, force = false) {
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

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.ONLINE, []);
    }

    if (guildName) {
        const rows = await allAsync('SELECT username, guildRank, onlineWorld FROM players WHERE guildName = ? AND isOnline = 1', [guildName]);
                
            const onlinePlayers = rows.map(row => {
                const {
                    username,
                    guildRank,
                    onlineWorld,
                } = row;

                return new OnlineGuildMember(username, guildRank, onlineWorld);
            });

            onlinePlayers.sort((a, b) => a.compareTo(b));

            const pages = [];
            let onlinePage = `\`\`\`Current online players in ${guildName} (${onlinePlayers.length})\n`;
            let counter = 0;

            onlinePlayers.forEach((player) => {
                if (counter === 30) {
                    onlinePage += '```';
                    pages.push(onlinePage);
                    onlinePage = `\`\`\`Current online players in ${guildName} (${onlinePlayers.length})\n` + player.toString();
                    counter = 1;
                } else {
                    onlinePage += player.toString();
                    counter++;
                }
            });

            if (counter <= 30) {
                onlinePage += '```';
                pages.push(onlinePage);
            }

            return new ButtonedMessage('', [], '', pages);
    } else {
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

module.exports = online;
