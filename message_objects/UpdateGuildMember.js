class UpdateGuildMember {
    // Creates an UpdatGuildMember object containing all the information used for updating a guild member in the database from the API
    // uuid: The UUID of the guild member
    // username: The username of the guild member
    // rank: The guild rank of the guild member
    constructor(uuid, username, rank) {
        this.uuid = uuid;
        this.username = username;
        this.rank = rank;
    }
}

module.exports = UpdateGuildMember;
