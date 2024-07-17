class UpdatGuildMember {
    // Creates an object containing all the information used for updating a guild member in the database from the API
    // uuid: The UUID of the guild member
    // username: The username of the guild member
    // rank: The guild rank of the guild member
    // contributed: How much XP the guild member has contributed
    // joined: Timestamp of when the guild member joined the guild
    constructor(uuid, username, rank, contributed, joined) {
        this.uuid = uuid;
        this.username = username;
        this.contributed = contributed;
        this.rank = rank;
        this.joined = joined;
    }
}

module.exports = UpdatGuildMember;
