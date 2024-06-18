const axios = require('axios');
const findGuild = require('./find_guild');
const OnlineGuildMember = require('../message_objects/OnlineGuildMember');

async function online(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('guild_name');
    } else {
        nameToSearch = interaction.customId.split('-')[1];
    }

    const guildName = await findGuild(nameToSearch, force);

    if (guildName && guildName.message === 'Multiple possibilities found') {
        return guildName.guildNames;
    }

    if (guildName) {
        // FIXME: Handle errors better
        const guildJson = (await axios.get(`https://api.wynncraft.com/v3/guild/${guildName}`)).data;

        if (!guildJson || !guildJson.name) {
            return ({ guildName: '', guildPrefix: '', onlinePlayers: [], onlineCount: -1, totalMembers: -1 });
        }

        const onlinePlayers = [];

        for (const rank in guildJson.members) {
            if (rank === 'total') continue;

            const rankMembers = guildJson.members[rank];

            for (const member in rankMembers) {
                const guildMember = rankMembers[member];
                
                if (guildMember.online) {
                    onlinePlayers.push(new OnlineGuildMember(member, rank, guildMember.server));
                }
            }
        }

        onlinePlayers.sort((a, b) => a.compareTo(b));

        return ({ guildName: guildName, guildPrefix: guildJson.prefix, onlinePlayers: onlinePlayers, onlineCount: guildJson.online, memberCount: guildJson.members.total });
    } else {
        return ({ guildName: '', guildPrefix: '', onlinePlayers: [], onlineCount: -1, totalMembers: -1 });
    }
}

module.exports = online;
