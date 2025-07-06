const applyRoles = require('./apply_roles');
const database = require('../database/database');
const fs = require('fs');
const path = require('path');
const UpdatedUser = require('../message_objects/UpdatedUser');

async function updateRoles(guild) {
    const playerInfo = await database.getAllPlayerInfo();

    const updates = [];
    let ignoredUsers = [];
    let doubleVerification = false;
    let verifiedRole;

    try {
        // Get the config file for the server
        let config = {};

        const directoryPath = path.join(__dirname, '..', 'configs');
        const filePath = path.join(directoryPath, `${guild.id}.json`);

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(fileData);

            // Set the ignored users if there are any
            if (config.ignoredUsers) {
                ignoredUsers = config.ignoredUsers;
            }

            doubleVerification = config.doubleVerification;
            verifiedRole = guild.roles.cache.get(config['verifiedRole']);
        }
    } catch (error) {
        console.log(error);
        return updates;
    }

    for (const serverMember of guild.members.cache.values()) {
        // Ignore bots and ignored users
        if (serverMember.user.bot) continue;
        if (ignoredUsers.includes(serverMember.user.id)) continue;

        // Skip if double verification is enabled and they do not have the verified role
        if (
            doubleVerification &&
            verifiedRole &&
            !serverMember.roles.cache.has(verifiedRole.id)
        ) {
            continue;
        }

        const username = serverMember.user.username;
        const globalName = serverMember.user.globalName;
        let nickname = undefined;

        // If they have a nickname, remove the guild tag suffix
        if (serverMember.nickname) {
            nickname = serverMember.nickname.split(' [')[0];
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
