const sqlite3 = require('sqlite3').verbose();
const findGuild = require('./find_guild');
const GuildMember = require('../message_objects/GuildMember');
const ButtonedMessage = require('../message_type/ButtonedMessage');
const MessageType = require('../message_type/MessageType');
const db = new sqlite3.Database('database/database.db');

async function getAsync(query, params) {
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

async function guildStats(interaction, force = false) {
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

        return new ButtonedMessage(textMessage, guildName.guildNames, MessageType.GUILD_STATS, []);
    }

    if (guildName) {
        const guildRow = await getAsync('SELECT prefix, level, xpPercent, wars, rating FROM guilds WHERE name = ?', [guildName]);
        const memberRows = await allAsync('SELECT username, guildRank, onlineWorld, contributedGuildXP, guildJoinDate, wars FROM players WHERE guildName = ? ORDER BY contributedGuildXP DESC', [guildName]);
        const today = new Date();

        if (guildRow == undefined) {
            return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
        }

        let contributionPosition = 0;

        let averageXpPerDay = 0;

        const guildMembers = memberRows.map(row => {
            contributionPosition++;

            const {
                username,
                guildRank,
                wars,
            } = row;

            let {
                contributedGuildXP,
            } = row;

            let daysInGuild;

            try {
                const [year, month, day] = row.guildJoinDate.split('-');
                
                const joinDate = new Date(year, month - 1, day);
        
                const differenceInMilliseconds = today - joinDate;
                
                daysInGuild = Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24));
            } catch (err) {
                daysInGuild = 1;
            }

            averageXpPerDay += contributedGuildXP / daysInGuild;

            if (contributedGuildXP == null) {
                contributedGuildXP = 0;
            }

            return new GuildMember(username, guildRank, contributedGuildXP, row.onlineWorld, row.guildJoinDate, daysInGuild, contributionPosition, wars);
        });

        let formattedXPPerDay;

        if (averageXpPerDay >= 1000000000) {
            formattedXPPerDay = `${(averageXpPerDay / 1000000000).toFixed(1)}B/day`;
        } else if (averageXpPerDay >= 1000000) {
            formattedXPPerDay = `${(averageXpPerDay / 1000000).toFixed(1)}M/day`;
        } else if (averageXpPerDay >= 1000) {
            formattedXPPerDay = `${(averageXpPerDay / 1000).toFixed(1)}k/day`;
        } else {
            formattedXPPerDay = `${averageXpPerDay.toFixed(2)}/day`;
        }

        const pages = [];
        const guildLevel = guildRow.level ? guildRow.level : '?';
        let guildStatsPage = `\`\`\`${guildName} [${guildRow.prefix}] Level: ${guildLevel} (${guildRow.xpPercent}%)\nWars: ${guildRow.wars} Rating: ${guildRow.rating}\nXP per day: ${formattedXPPerDay}\n\n`;
        let counter = 0;

        guildMembers.forEach((player) => {
            if (counter === 5) {
                guildStatsPage += '```';
                pages.push(guildStatsPage);
                guildStatsPage = `\`\`\`${guildName} [${guildRow.prefix}] Level: ${guildLevel} (${guildRow.xpPercent}%)\nWars: ${guildRow.wars} Rating: ${guildRow.rating}\nXP per day: ${formattedXPPerDay}\n\n` + player.toString();
                counter = 1;
            } else {
                guildStatsPage += player.toString();
                counter++;
            }
        });

        if (counter <= 5) {
            guildStatsPage += '```';
            pages.push(guildStatsPage);
        }

        return new ButtonedMessage('', [], '', pages);
    } else {
        return new ButtonedMessage('', [], '', [`${nameToSearch} not found, try using the full exact guild name.`]);
    }
}

module.exports = guildStats;
