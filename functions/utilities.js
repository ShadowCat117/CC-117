const GuildMemberSlots = require('../values/GuildMemberSlots');

const RATE_LIMIT = 180;
let remainingRateLimit = RATE_LIMIT;
let rateLimitReset;

function getTimeSince(timestamp) {
    const now = new Date();
    const lastLoginTime = new Date(timestamp);

    const timeDifference = now - lastLoginTime;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days.toLocaleString()} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}

function getFormattedXPPerDay(xp, timestamp) {
    let days = daysSince(timestamp);

    days = days > 0 ? days : 1;

    const xpPerDay = xp / days;

    // Display at billions, millions, thousands per day or below
    if (xpPerDay >= 1000000000) {
        return `${(xpPerDay / 1000000000).toFixed(1)}B/day`;
    } else if (xpPerDay >= 1000000) {
        return `${(xpPerDay / 1000000).toFixed(1)}M/day`;
    } else if (xpPerDay >= 1000) {
        return `${(xpPerDay / 1000).toFixed(1)}k/day`;
    } else {
        return `${xpPerDay.toFixed(2)}/day`;
    }
}

function daysSince(timestamp) {
    const now = new Date();
    const startTime = new Date(timestamp);

    const timeDifference = now - startTime;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return Math.floor(hours / 24);
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
    if ((nameToCheck.toLowerCase() === 'owen_rocks_3' || nameToCheck.toLowerCase() === 'amber_rocks_3') && memberToCheck.id !== '753700961364738158') return false;
    
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

function calculateMemberSlots(guildLevel) {
    // New guilds start with 4 slots
    let slots = 4;

    for (const key in GuildMemberSlots) {
        if (key > guildLevel) {
            break;
        }
        
        slots = GuildMemberSlots[key];
    }

    return slots;
}

async function waitForRateLimit() {
    if (remainingRateLimit == 0) {
        const timeToWait = rateLimitReset * 1000;

        await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
}

function updateRateLimit(remaining, reset) {
    if (!remaining || !reset) return;
    
    remainingRateLimit = remaining;
    rateLimitReset = reset;
}

module.exports = {
    getTimeSince,
    getFormattedXPPerDay,
    daysSince,
    findDiscordUser,
    checkValidUsername,
    calculateMemberSlots,
    waitForRateLimit,
    updateRateLimit,
};