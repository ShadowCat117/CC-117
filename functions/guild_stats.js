const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');
const GuildMember = require('../message_objects/GuildMember');

async function guildStats(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId.split(':')[1];
    }

    const guild = await database.findGuild(nameToSearch, force);

    if (guild && guild.message === 'Multiple possibilities found') {
        return {
            guildUuids: guild.guildUuids,
            guildNames: guild.guildNames,
            guildPrefixes: guild.guildPrefixes,
        };
    }

    let response;

    await utilities.waitForRateLimit();

    // If a guild was found, look for UUID to get guaranteed results, otherwise look for the name input
    if (guild) {
        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/guild/uuid/${guild.uuid}`,
            );
        } catch (error) {
            return { guildName: '', guildPrefix: '', members: [] };
        }
    } else {
        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/guild/${nameToSearch}`,
            );
        } catch (error) {
            return { guildName: '', guildPrefix: '', members: [] };
        }
    }

    utilities.updateRateLimit(
        response.headers['ratelimit-remaining'],
        response.headers['ratelimit-reset'],
    );

    guildJson = response.data;

    if (!guildJson || !guildJson.name) {
        return { guildName: '', guildPrefix: '', members: [] };
    }

    const members = [];
    const name = guildJson.name;
    const prefix = guildJson.prefix;
    const level = guildJson.level;
    const xpPercent = guildJson.xpPercent;
    const territories = guildJson.territories;
    const wars = guildJson.wars.toLocaleString();
    let previousRating = -1;
    let currentRating = -1;

    const seasonRanks = guildJson.seasonRanks;
    const numSeasons = Object.keys(seasonRanks).length;

    if (numSeasons > 2) {
        const seasons = Object.keys(seasonRanks);
        previousRating =
            seasonRanks[seasons[numSeasons - 2]].rating.toLocaleString();
        currentRating =
            seasonRanks[seasons[numSeasons - 1]].rating.toLocaleString();
    } else if (numSeasons === 1) {
        currentRating =
            seasonRanks[Object.keys(seasonRanks)[0]].rating.toLocaleString();
    }

    let averageXpPerDay = 0;
    let totalPlaytime = 0;

    for (const rank in guildJson.members) {
        if (rank === 'total') continue;

        const rankMembers = guildJson.members[rank];

        for (const member in rankMembers) {
            const guildMember = rankMembers[member];

            let lastLogin = null;

            if (!guildMember.online) {
                lastLogin = await database.getLastLogin(guildMember.uuid);
            }

            const playerWars = await database.getWars(guildMember.uuid);
            let averagePlaytime = await database.getAveragePlaytime(
                guildMember.uuid,
            );

            if (averagePlaytime === -1) {
                averagePlaytime = 0;
            }

            let daysInGuild = utilities.daysSince(guildMember.joined);

            daysInGuild = daysInGuild > 0 ? daysInGuild : 1;

            averageXpPerDay += guildMember.contributed / daysInGuild;

            totalPlaytime += averagePlaytime;

            members.push(
                new GuildMember(
                    member,
                    rank,
                    lastLogin,
                    guildMember.contributed,
                    guildMember.contributionRank,
                    guildMember.online,
                    guildMember.server,
                    guildMember.joined,
                    playerWars,
                    averagePlaytime,
                ),
            );
        }
    }

    members.sort((a, b) => a.compareTo(b));

    return {
        guildName: name,
        guildPrefix: prefix,
        level: level,
        xpPercent: xpPercent,
        territories: territories,
        wars: wars,
        previousRating: previousRating,
        currentRating: currentRating,
        averageXpPerDay: averageXpPerDay,
        totalPlaytime: totalPlaytime.toFixed(2),
        members: members,
    };
}

module.exports = guildStats;
