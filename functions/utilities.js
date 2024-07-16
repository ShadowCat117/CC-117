function getTimeSince(timestamp) {
    const now = new Date();
    const lastLoginTime = new Date(timestamp);

    const timeDifference = now - lastLoginTime;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
}

async function findDiscordUser(serverMembers, username) {
    for (const serverMember of serverMembers) {
        if (serverMember.user.bot) {
            continue;
        }

        if (username === serverMember.user.username || username === serverMember.user.globalName || username === serverMember.nickname) {
            return serverMember;
        }
    }

    return null;
}

async function checkValidUsername(memberToCheck, guild, nameToCheck) {
    // Temporary, remove if Wynn ever fixes the name changing guild bug
    if (nameToCheck.toLowerCase() === 'owen_rocks_3' && memberToCheck.id !== '753700961364738158') return false;
    
    // Loop through all server members
    for (const member of guild.members.cache) {
        // Ignore if member is the current member trying to verify
        if (member[0] === memberToCheck.id) {
            continue;
        }

        let nicknameToCheck = member[1].nickname;
        const usernameToCheck = member[1].user.username;

        // If nickname given, remove guild prefix if there is one
        if (nicknameToCheck) {
            nicknameToCheck = nicknameToCheck.split(' [')[0];
        }

        // If the nickname matches then return false for invalid username
        if (nameToCheck && (nameToCheck.toLowerCase() === (nicknameToCheck || '').toLowerCase() || nameToCheck.toLowerCase() === usernameToCheck.toLowerCase())) {
            return false;
        }
    }

    // All members checked, no conflicting username found
    return true;
}

module.exports = {
    getTimeSince,
    findDiscordUser,
    checkValidUsername,
};