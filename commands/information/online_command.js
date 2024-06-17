const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const online = require('../../functions/online');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('online')
        .setDescription('View who is currently online in a guild.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to see who\'s online for.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Checking online players for ${interaction.options.getString('guild_name')}`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Call online
        const response = await online(interaction);

        const responseEmbed = new EmbedBuilder();

        if (response.length !== undefined) {
            // Multiselector
            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(`More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following`)
                .setColor(0x999999);

            const row = new ActionRowBuilder();

            for (let i = 0; i < response.length; i++) {
                responseEmbed
                    .addFields({ name: `Option ${i + 1}`, value: `[${response[i]}](https://wynncraft.com/stats/guild/${response[i].replaceAll(' ', '%20')})` });

                const button = new ButtonBuilder()
                    .setCustomId(`online-${response[i]}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel((i + 1).toString());

                row.addComponents(button);
            }

            await interaction.editReply({
                components: [row],
                embeds: [responseEmbed],
            });

            return;
        } else {
            if (response.guildName === '') {
                // Unknown guild
                responseEmbed
                    .setTitle('Invalid guild')
                    .setDescription(`Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`)
                    .setColor(0xff0000);
            } else {
                // Valid guild
                responseEmbed
                    .setTitle(`[${response.guildPrefix}] ${response.guildName} Online Members`)
                    .setURL(`https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`)
                    .setDescription(`There are currently ${response.onlineCount}/${response.memberCount} players online`)
                    .setColor(0x00ffff);

                // Display a message about players in /stream if the guild online count does not match
                // the number of online players found
                const playersInStream = response.onlineCount - response.onlinePlayers.length;

                if (playersInStream > 0) {
                    responseEmbed
                        .addFields({ name: 'Streamers', value: `There are ${playersInStream} player(s) in /stream`, inline: false });
                }

                if (response.onlinePlayers.length > 0) {
                    let usernameValue = '';
                    let rankValue = '';
                    let serverValue = '';

                    for (const onlinePlayer of response.onlinePlayers) {
                        usernameValue += onlinePlayer.username + '\n';
                        rankValue += onlinePlayer.guildRank + '\n';
                        serverValue += onlinePlayer.server + '\n';
                    }

                    responseEmbed
                        .addFields(
                            { name: 'Username', value: usernameValue, inline: true },
                            { name: 'Guild Rank', value: rankValue, inline: true },
                            { name: 'Server', value: serverValue, inline: true },
                        );
                }
            }
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
