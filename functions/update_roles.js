const applyRoles = require('./apply_roles');
const database = require('../database/database');
const UpdatedUser = require('../message_objects/UpdatedUser');

async function updateRoles(guild) {
    const playerInfo = await database.getAllPlayerInfo();

    const updates = [];

    for (const serverMember of guild.members.cache.values()) {
        // Ignore bots
        if (serverMember.user.bot) continue;

        const username = serverMember.user.username;
        const globalName = serverMember.user.username;
        let nickname = undefined;

        // If they have a nickname, remove the guild tag suffix
        if (serverMember.nickname) {
            nickname = serverMember.nickname.split(' [')[0];
        }

        let hasUpdated = false;

        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (serverMember.user.id === '753700961364738158') {
            for (let i = 0; i < playerInfo.length; i++) {
                const player = playerInfo[i];

                if (player.username === 'Owen_Rocks_3') {
                    player.username = 'Amber_Rocks_3';

                    playerInfo.splice(i, 1);

                    const response = await applyRoles(
                        guild,
                        serverMember,
                        player,
                    );

                    if (
                        response.updates.length > 0 ||
                        response.errors.length > 0
                    ) {
                        updates.push(
                            new UpdatedUser(
                                response.username,
                                serverMember,
                                response.updates,
                                response.errors,
                            ),
                        );
                    }

                    hasUpdated = true;

                    break;
                }
            }

            continue;
        }

        for (let i = 0; i < playerInfo.length; i++) {
            const player = playerInfo[i];

            if (
                (nickname && player.username === nickname) ||
                (globalName && player.username === globalName) ||
                player.username === username
            ) {
                const response = await applyRoles(guild, serverMember, player);

                if (response.updates.length > 0 || response.errors.length > 0) {
                    updates.push(
                        new UpdatedUser(
                            response.username,
                            serverMember,
                            response.updates,
                            response.errors,
                        ),
                    );
                }

                hasUpdated = true;

                playerInfo.splice(i, 1);
                break;
            }
        }

        if (!hasUpdated) {
            const response = await applyRoles(guild, serverMember, null);

            if (response.updates.length > 0 || response.errors.length > 0) {
                updates.push(
                    new UpdatedUser(
                        response.username,
                        serverMember,
                        response.updates,
                        response.errors,
                    ),
                );
            }
        }
    }

    return updates;
}

module.exports = updateRoles;
