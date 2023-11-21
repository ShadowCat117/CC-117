// All messages that have components such as selection menus or buttons for multiple pages
let messages = [];

// Add a new message to the list of known messages
function addMessage(message) {
    messages.push(message);
}

// Remove a message from the list of known messages
function removeMessage(message) {
    const index = messages.indexOf(message);

    if (index !== -1) {
        messages.splice(index, 1);
    }
}

// Get a message by the ID
function getMessage(messageId) {
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].message.id === messageId) {
            return messages[i];
        }
    }

    return null;
}

// Sets the pages for a multi paged message
function setMessagePages(message, pages) {
    const index = messages.indexOf(message);

    if (index !== -1) {
        messages[index].setPages(pages);
    }
}

// Gets all of the known messages
function getMessages() {
    return messages;
}

// Removes the components from all known messages
async function removeOldMessages() {
    for (const message of messages) {
        try {
            await message.message.edit({
                components: [],
            });
        } catch (error) {
            // Happens to any ephemeral message, sometimes others
            console.error('Error removing components from message: ', message);
        }
    }

    // Clears the list of known messages
    messages = [];
}

module.exports = {
    addMessage,
    removeMessage,
    getMessage,
    setMessagePages,
    getMessages,
    removeOldMessages,
};
