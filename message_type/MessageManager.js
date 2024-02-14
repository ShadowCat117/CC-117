const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

async function sendMessage(guild, channelId, message) {
    if (!guild || !channelId || !message) {
        return;
    } else {
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            try {
                const formattedMessage = message.replace(/\\n/g, '\n');

                const sentMessage = await channel.send(formattedMessage);
                return sentMessage;
            } catch (error) {
                console.log(`Failed to send ${message} to channel ${channelId} in guild ${guild.id}`);
                return null;
            }
        } else {
            console.log(`${channelId} not found for guild ${guild.id}`);
            return null;
        }
    }
}

async function sendButtonedMessage(guild, channelId, buttonedMessage) {
    if (!guild || !channelId || !buttonedMessage) {
        return;
    } else {
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            if (buttonedMessage.componentIds.length > 0) {
                const row = new ActionRowBuilder();

                for (let i = 0; i < buttonedMessage.componentIds.length; i++) {
                    const button = new ButtonBuilder()
                        .setCustomId(buttonedMessage.componentIds[i])
                        .setStyle(ButtonStyle.Primary)
                        .setLabel((i + 1).toString());
                    row.addComponents(button);
                }

                const sentMessage = await channel.send({
                    content: buttonedMessage.text,
                    components: [row],
                });

                buttonedMessage.setMessage(sentMessage);

                addMessage(buttonedMessage);

                return sentMessage;
            } else if (buttonedMessage.pages.length > 1) {
                const previousPage = new ButtonBuilder()
                    .setCustomId('previousPage')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⬅️');

                const nextPage = new ButtonBuilder()
                    .setCustomId('nextPage')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️');

                const row = new ActionRowBuilder().addComponents(previousPage, nextPage);

                const sentMessage = await channel.send({
                    content: buttonedMessage.pages[0],
                    components: [row],
                });

                buttonedMessage.setMessage(sentMessage);

                addMessage(buttonedMessage);

                return sentMessage;
            } else if (buttonedMessage.pages[0] === '```\n```') {
                return null;
            } else {
                const sentMessage = await channel.send(buttonedMessage.pages[0]);

                return sentMessage;
            }
        } else {
            console.log(`${channelId} not found for guild ${guild.id}`);
            return null;
        }
    }
}

module.exports = {
    addMessage,
    removeMessage,
    getMessage,
    setMessagePages,
    getMessages,
    removeOldMessages,
    sendMessage,
    sendButtonedMessage,
};
