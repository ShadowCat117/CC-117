// A map of all active PagedMessages
let messages = {};

// Add a new message to the list of known messages
function addMessage(id, pages) {
    messages[id] = pages;
}

// Get a message by the ID
function getMessage(id) {
    return messages[id] || null;
}

// Removes the components from all known messages
async function removeOldMessages() {
    for (const message in messages) {
        try {
            await messages[message].message.edit({
                components: [],
            });
        } catch (error) {
            // Happens to any ephemeral message, sometimes others
            console.error('Error removing components from message: ', error);
        }
    }

    // Clears the list of known messages
    messages = {};
}

module.exports = {
    addMessage,
    getMessage,
    removeOldMessages,
};
