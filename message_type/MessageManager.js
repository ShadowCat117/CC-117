let messages = [];

function addMessage(message) {
    messages.push(message);
}

function removeMessage(message) {
    const index = messages.indexOf(message);

    if (index !== -1) {
        messages.splice(index, 1);
    }
}

function getMessage(messageId) {
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].message.id === messageId) {
            return messages[i];
        }
    }

    return null;
}

function setMessagePages(message, pages) {
    const index = messages.indexOf(message);

    if (index !== -1) {
        messages[index].setPages(pages);
    }
}

function getMessages() {
    return messages;
}

async function removeOldMessages() {
    for (const message of messages) {
        try {
            await message.message.edit({
                components: [],
            });
        } catch (error) {
            console.error('Error removing components from message:', error);
        }
    }

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
