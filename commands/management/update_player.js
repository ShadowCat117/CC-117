const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateplayer')
        .setDescription('Prioritises a player to be updated in the database.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('The name/UUID of the player you want to be updated. UUID is preferred.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        const player = interaction.options.getString('player');

        const filePath = path.join(__dirname, '..', '..', 'updatePlayers.json');

        try {
            let updatePlayersFile = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                updatePlayersFile = JSON.parse(fileData);
            }

            updatePlayersFile.players = updatePlayersFile.players.filter(item => item !== null);

            if (updatePlayersFile.players.includes(player)) {
                await interaction.editReply(`${player} is already queued to be updated.`);
            } else {
                updatePlayersFile.players.unshift(player);

                fs.writeFileSync(filePath, JSON.stringify(updatePlayersFile, null, 2), 'utf-8');

                await interaction.editReply(`${player} will be updated soon.`);
            }
        } catch (error) {
            await interaction.editReply('Unable to update player.');
        }
    },
};
