class TrackedGuild {
    // Create a TrackedGuild object
    // name: Name of the guild
    // prefix: Prefix of the guild
    // averageOnline: Average number of players online
    // averageCaptains: Average number of captains+ online
    // currentOnline: Current number of online players
    // currentCaptains: Current number of captains+ online
    constructor(name, prefix, averageOnline, averageCaptains, currentOnline, currentCaptains) {
        this.name = name;
        this.prefix = prefix;
        this.averageOnline = averageOnline.toFixed(2);
        this.averageCaptains = averageCaptains.toFixed(2);
        this.currentOnline = currentOnline;
        this.currentCaptains = currentCaptains;
    }

    // Sort tracked guilds by average online, then average captains+ online
    // then current online players and then current online captains+
    compareTo(other) {
        if (parseFloat(this.averageOnline) > parseFloat(other.averageOnline)) {
            return -1;
        } else if (parseFloat(this.averageOnline) < parseFloat(other.averageOnline)) {
            return 1;
        } else {
            if (parseFloat(this.averageCaptains) > parseFloat(other.averageCaptains)) {
                return -1;
            } else if (parseFloat(this.averageCaptains) < parseFloat(other.averageCaptains)) {
                return 1;
            } else {
                if (parseFloat(this.currentOnline) > parseFloat(other.currentOnline)) {
                    return -1;
                } else if (parseFloat(this.currentOnline) < parseFloat(other.currentOnline)) {
                    return 1;
                } else {
                    if (parseFloat(this.currentCaptains) > parseFloat(other.currentCaptains)) {
                        return -1;
                    } else if (parseFloat(this.currentCaptains) < parseFloat(other.currentCaptains)) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }
        }
    }
}

module.exports = TrackedGuild;
