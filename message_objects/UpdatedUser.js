class UpdatedUser {
    // Creates an updated user object for storing updates made to users from /updateroles
    // username: Username of the updated player
    // member: Discord member that was updated
    // updates: The completed updates made to the user
    // errors: Any errors that occured whilst updating the user
    constructor(username, member, updates, errors) {
        this.username = username;
        this.member = member;
        this.updates = updates;
        this.errors = errors;
    }
}

module.exports = UpdatedUser;