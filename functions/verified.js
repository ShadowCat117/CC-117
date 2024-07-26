const axios = require('axios');
const utilities = require('./utilities');
const VerifiedMember = require('../message_objects/VerifiedMember');

async function verified(guildUuid, interaction) {
    await utilities.waitForRateLimit();
    const response = await axios.get(
        `https://api.wynncraft.com/v3/guild/uuid/${guildUuid}`,
    );

    utilities.updateRateLimit(
        response.headers['ratelimit-remaining'],
        response.headers['ratelimit-reset'],
    );
    const guildJson = response.data;

    if (!guildJson || !guildJson.name) {
        return { guildName: '', guildPrefix: '', verifiedMembers: [] };
    }

    const verifiedMembers = [];

    for (const rank in guildJson.members) {
        if (rank === 'total') continue;

        const rankMembers = guildJson.members[rank];

        for (const member in rankMembers) {
            // Need to parse the cache in here instead of parsing it into this function from the command as for some reason
            // it doesn't work after the 1st VerifiedMember
            verifiedMembers.push(
                new VerifiedMember(
                    member,
                    interaction.guild.members.cache.values(),
                ),
            );
        }
    }

    return {
        guildName: guildJson.name,
        guildPrefix: guildJson.prefix,
        verifiedMembers: verifiedMembers,
    };
}

module.exports = verified;
