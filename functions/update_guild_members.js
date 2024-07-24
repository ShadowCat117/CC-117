const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');
const UpdateGuildMember = require('../message_objects/UpdateGuildMember');

async function updateGuild(interaction, force = false) {
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

    let guildJson;

    await utilities.waitForRateLimit();

    // If a guild was found, look for UUID to get guaranteed results, otherwise look for the name input
    if (guild) {
        const response = await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${guild.uuid}`);
        utilities.updateRateLimit(response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);
        guildJson = response.data;
    } else {
        const response = await axios.get(`https://api.wynncraft.com/v3/guild/${nameToSearch}`);
        utilities.updateRateLimit(response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);
        guildJson = response.data;
    }

    // FIXME: Handle errors better
    if (!guildJson || !guildJson.name) {
        return ({ guildName: '', guildPrefix: '' });
    }

    const guildMembers = [];

    for (const rank in guildJson.members) {
        if (rank === 'total') continue;

        const rankMembers = guildJson.members[rank];

        for (const member in rankMembers) {
            const guildMember = rankMembers[member];
            
            guildMembers.push(new UpdateGuildMember(guildMember.uuid, member, rank, guildMember.contributed, guildMember.joined));
        }
    }

    database.updateGuildMembers(guildJson.uuid, guildMembers);

    return ({ guildName: guildJson.name, guildPrefix: guildJson.prefix });
}

module.exports = updateGuild;
