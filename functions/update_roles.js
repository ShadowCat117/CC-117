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

        // Temporary, remove if Wynn ever fixes the name changing guild bug
        if (serverMember.user.id === '753700961364738158') {
            const player = playerInfo.get('Owen_Rocks_3');

            if (player) {
                player.username = 'Amber_Rocks_3';

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

                continue;
            }
        }

        if (nickname) {
            const player = playerInfo.get(nickname);

            if (player) {
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

                continue;
            }
        }

        if (globalName) {
            const player = playerInfo.get(globalName);

            if (player) {
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

                continue;
            }
        }

        if (username) {
            const player = playerInfo.get(username);

            if (player) {
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

                continue;
            }
        }

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

    return updates;
}

module.exports = updateRoles;
