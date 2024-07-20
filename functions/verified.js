const axios = require('axios');
const VerifiedMember = require('../message_objects/VerifiedMember');

async function verified(guildUuid, interaction) {
    const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/uuid/${guildUuid}`)).data;
    
    // FIXME: Handle errors better
    if (!guildJson || !guildJson.name) {
        return ({ guildName: '', guildPrefix: '', verifiedMembers: [] });
    }

    const verifiedMembers = [];

    for (const rank in guildJson.members) {
        if (rank === 'total') continue;

        const rankMembers = guildJson.members[rank];

        for (const member in rankMembers) {
            // Need to parse the cache in here instead of parsing it into this function from the command as for some reason
            // it doesn't work after the 1st VerifiedMember
            verifiedMembers.push(new VerifiedMember(member, interaction.guild.members.cache.values()));
        }
    }

    return ({ guildName: guildJson.name, guildPrefix: guildJson.prefix, verifiedMembers: verifiedMembers });
}

module.exports = verified;
