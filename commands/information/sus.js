const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const sus = require('../../functions/sus');
const ButtonedMessage = require('../../message_type/ButtonedMessage');
const MessageType = require('../../message_type/MessageType');
const MessageManager = require('../../message_type/MessageManager');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sus')
        .setDescription('Determine the sus level of a player.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of who you want to check the sus level of.')
                .setRequired(true)),
    ephemeral: false,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }
        } catch (error) {
            await interaction.editReply('Unable to show sus value');
        }

        const username = interaction.options.getString('username');
        const formattedUsername = username.replace(/_/g, '\\_');

        return new Promise((resolve, reject) => {
            db.all(
                'SELECT UUID, guildName, guildRank, rank FROM players WHERE username = ?', [username],
                async (err, foundRows) => {
                    if (err) {
                        console.error('Error retrieving player data:', err);
                        reject(err);
                        return;
                    }

                    if (foundRows.length === 0) {
                        await interaction.editReply(`Unable to find player: ${formattedUsername}`);
                        resolve();
                        return;
                    } else if (foundRows.length > 1) {
                        let message = `Multiple ${formattedUsername}'s found.\n`;
                        let counter = 1;

                        const row = new ActionRowBuilder();

                        for (const possibility of foundRows) {
                            if (possibility.rank) {
                                if (possibility.guildName) {
                                    message += `${counter}. ${formattedUsername}, ${possibility.rank} and ${possibility.guildRank} of ${possibility.guildName}. (UUID: ${possibility.UUID})\n`;
                                } else {
                                    message += `${counter}. ${formattedUsername}, ${possibility.rank}. (UUID: ${possibility.UUID})\n`;
                                }
                            } else {
                                if (possibility.guildName) {
                                    message += `${counter}. ${formattedUsername}, ${possibility.guildRank} of ${possibility.guildName}. (UUID: ${possibility.UUID})\n`;
                                } else {
                                    message += `${counter}. ${formattedUsername}. (UUID: ${possibility.UUID})\n`;
                                }
                            }

                            const button = new ButtonBuilder()
                                .setCustomId(possibility.UUID)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel(counter.toString());

                            row.addComponents(button);

                            counter++;
                        }

                        message += 'Click button to choose player.';

                        const editedReply = await interaction.editReply({
                            content: message,
                            components: [row],
                        });

                        const response = new ButtonedMessage(message, [], MessageType.SUS, []);

                        response.setMessage(editedReply);

                        MessageManager.addMessage(response);

                        resolve();
                        return;
                    } else {
                        const response = await sus(foundRows[0].UUID);
                        await interaction.editReply(response);
                        
                        resolve();
                        return;
                    }
                },
            );
        });
    },
};
