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

module.exports = sendMessage;
