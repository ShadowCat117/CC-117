const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const registerUser = require('../../functions/register_user');
const MessageManager = require('../../message_type/MessageManager');
const fs = require('fs');
const path = require('path');
const {
    admins,
} = require('../../config.json');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

async function getAsync(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, function(err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registeruser')
        .setDescription('Admins/guild owners only - Register a guild member\'s Wynncraft account')
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('The user to register')
                .setRequired(true),
        )
        .addStringOption((option) =>
        option.setName('username')
            .setDescription('The username of the member to register')
            .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        // Check if the user has permission to run this command. They must be an admin for the bot or
        // a registered guild owner.
        if (!admins.includes(interaction.member.id)) {
            // Check if they are a registered guild owner
            const guildId = interaction.guild.id;
            const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

            try {
                let config = {};

                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf-8');
                    config = JSON.parse(fileData);
                }

                const guildName = config.guildName;

                if (!guildName) {
                    await interaction.editReply('The server you are in does not have a guild set.');
                    return;
                }

                // Check if the user running the command is registered as the owner of the guild
                const row = await getAsync('SELECT * FROM players WHERE guildRank = \'OWNER\' AND discordId = ?', [interaction.member.user.id]);
            
                if (!row) {
                    await interaction.editReply('You do not have the required permissions to run this command.');
                    return;
                }
            } catch (error) {
                console.log(error);
                await interaction.editReply('An error occured whilst running this command');
                return;
            }
        }

        const user = interaction.options.getUser('user');

        // Call registerUser
        const response = await registerUser(interaction, user.id, false);

        if (response.componentIds.length > 0) {
            // If multiple players found, present choice
            const row = new ActionRowBuilder();

            for (let i = 0; i < response.componentIds.length; i++) {
                const button = new ButtonBuilder()
                    .setCustomId(response.componentIds[i])
                    .setStyle(ButtonStyle.Primary)
                    .setLabel((i + 1).toString());
                row.addComponents(button);
            }

            const editedReply = await interaction.editReply({
                content: response.text,
                components: [row],
            });

            response.setMessage(editedReply);

            MessageManager.addMessage(response);
        } else {
            // Show response
            await interaction.editReply(response.pages[0]);
        }
    },
};
