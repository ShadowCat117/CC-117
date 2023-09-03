class TrackedGuild {
    constructor(guildName, averageOnline, averageCaptains, currentOnline, currentCaptains) {
        this.guildName = guildName;
        this.averageOnline = typeof averageOnline === 'number' ? averageOnline.toFixed(2) : averageOnline;
        this.averageCaptains = typeof averageCaptains === 'number' ? averageCaptains.toFixed(2) : averageCaptains;
        this.currentOnline = typeof currentOnline === 'number' ? Math.trunc(currentOnline) : currentOnline;
        this.currentCaptains = typeof currentCaptains === 'number' ? Math.trunc(currentCaptains) : currentCaptains;
    }

    toString() {
        if (this.averageOnline === '-1.00') {
            const guildName = this.guildName.padEnd(24, ' ');
            const averageOnline = '0'.toString().padEnd(17, ' ');
            const averageCaptains = '0'.toString().padEnd(19, ' ');
            const currentOnline = '0'.toString().padEnd(20, ' ');

            return `${guildName}${averageOnline}${averageCaptains}${currentOnline}${'0'}\n`;
        } else {
            const guildName = this.guildName.padEnd(24, ' ');
            const averageOnline = this.averageOnline.toString().padEnd(17, ' ');
            const averageCaptains = this.averageCaptains.toString().padEnd(19, ' ');
            const currentOnline = this.currentOnline.toString().padEnd(20, ' ');

            return `${guildName}${averageOnline}${averageCaptains}${currentOnline}${this.currentCaptains}\n`;
        }
    }

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
