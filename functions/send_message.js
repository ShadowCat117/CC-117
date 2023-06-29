async function sendMessage(guild, channelId, message) {
    if (!guild || !channelId || !message) {
        return;
    } else {
        const channel = guild.channels.cache.get(channelId);

        if (channel) {
            try {
                await channel.send(message);
            } catch (error) {
                console.log(`Failed to send ${message} to channel ${channelId} in guild ${guild.id}`);
            }
        } else {
            console.log(`${channelId} not found for guild ${guild.id}`);
        }
    }
}

module.exports = sendMessage;
