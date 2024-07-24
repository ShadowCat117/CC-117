const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const updatePlayer = require('../../functions/update_player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateplayer')
        .setDescription('Updates the known information about a player in the database.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to be updated.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        const username = interaction.options.getString('username').replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Updating known info about ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Call updatePlayer
        const response = await updatePlayer(interaction);

        const responseEmbed = new EmbedBuilder();

        if (response.playerUuids !== undefined) {
            // Multiselector
            responseEmbed
                .setTitle('Multiple players found')
                .setDescription(`More than 1 player has the identifier ${username}. Pick the intended player from the following.`)
                .setColor(0x999999);

            const row = new ActionRowBuilder();

            for (let i = 0; i < response.playerUuids.length; i++) {
                let responseValue = '';

                const uuid = response.playerUuids[i];
                const playerUsername = response.playerUsernames[i].replaceAll('_', '\\_');
                const rank = response.playerRanks[i];
                const guildRank = response.playerGuildRanks[i];
                const playerGuildName = response.playerGuildNames[i];
    
                if (!rank && !playerGuildName) {
                    responseValue += `${i + 1}. ${playerUsername}.`;
                } else if (!rank) {
                    responseValue += `${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}.`;
                } else if (!playerGuildName) {
                    responseValue += `${i + 1}. ${playerUsername}, ${rank}.`;
                } else {
                    responseValue += `${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}.`;
                }

                responseEmbed
                    .addFields({ name: `Option ${i + 1}`, value: `${responseValue} [View Profile](https://wynncraft.com/stats/player/${uuid})` });

                const button = new ButtonBuilder()
                    .setCustomId(`update_player:${uuid}`)
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
            if (response.username === '') {
                // Unknown player
                responseEmbed
                    .setTitle('Invalid username')
                    .setDescription(`Unable to find a player using the name '${username}', try again using the exact player name.`)
                    .setColor(0xff0000);
            } else if (response.error) {
                responseEmbed
                    .setTitle(`Error updating ${username}`)
                    .setDescription(`Unable to find a player using the name '${username}', try again using the exact player name.`)
                    .setColor(0xff0000);
            } else {
                responseEmbed
                    .setTitle(`Updated ${response.username}`)
                    .setDescription('Updated all known information about player, guild wide promotion/demotion check and role applying should now be accurate for this player.')
                    .setColor(0x00ffff);
            }
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
