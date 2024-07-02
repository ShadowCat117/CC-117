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

module.exports = {
    getTimeSince,
    findDiscordUser,
};