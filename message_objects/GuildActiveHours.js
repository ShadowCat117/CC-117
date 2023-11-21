class GuildActiveHours {
    // Creates a guild active hours object
    // hour: The hour for current activity
    // averageOnline: Average number of players online at this hour
    // averageCaptains: Average number of captains online at this hour
    // hourOffset: The offset selected to display in the users timezone
    constructor(hour, averageOnline, averageCaptains, hourOffset) {
        this.averageOnline = typeof averageOnline === 'number' ? averageOnline.toFixed(2) : averageOnline;
        this.averageCaptains = typeof averageCaptains === 'number' ? averageCaptains.toFixed(2) : averageCaptains;

        // Some timezones are +/- x:30 from UTC
        if (parseFloat(hourOffset) % 1 === 0.5) {
            this.halfTimezone = true;
        }
        
        // Set the hour adjusted for offset
        this.hour = parseInt(hour) + parseInt(hourOffset);

        // Loop hour if above 23 or under 0
        if (this.hour > 23) {
            this.hour -= 24;
        } else if (this.hour < 0) {
            this.hour += 24;
        }
    }

    // Format the object to be displayed
    toString() {
        let hour = this.hour.toString().padStart(2, '0');

        // If the timezone has a x:30 offset from UTC, display minutes as :30, otherwise :00
        if (this.halfTimezone) {
            hour += ':30';
        } else {
            hour += ':00';
        }

        hour = hour.padEnd(12, ' ');

        const averageOnline = this.averageOnline.toString().padEnd(16, ' ');

        return `${hour}${averageOnline}${this.averageCaptains}`;
    }

    // Sort active hours by average online, then by average captains
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
