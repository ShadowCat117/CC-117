class GuildActiveHours {
    constructor(hour, averageOnline, averageCaptains, hourOffset) {
        this.averageOnline = typeof averageOnline === 'number' ? averageOnline.toFixed(2) : averageOnline;
        this.averageCaptains = typeof averageCaptains === 'number' ? averageCaptains.toFixed(2) : averageCaptains;

        // Handle this better in case other timezones added that have .5
        if (parseFloat(hourOffset) === 5.5) {
            this.halfTimezone = true;
        }

        this.hour = parseInt(hour) + parseInt(hourOffset);

        if (this.hour > 23) {
            this.hour -= 24;
        } else if (this.hour < 0) {
            this.hour += 24;
        }
    }

    toString() {
        let hour = this.hour.toString().padStart(2, '0');

        if (this.halfTimezone) {
            hour += ':30';
        } else {
            hour += ':00';
        }
        
        hour = hour.padEnd(12, ' ');
        
        const averageOnline = this.averageOnline.toString().padEnd(16, ' ');

        return `${hour}${averageOnline}${this.averageCaptains}`;
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
                return 0;
            }
        }
    }
}

module.exports = GuildActiveHours;