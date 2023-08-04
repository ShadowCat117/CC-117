const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const applyRoles = require('../../functions/apply_roles');
const sendMessage = require('../../functions/send_message');
const ButtonedMessage = require('../../message_type/ButtonedMessage');
const MessageType = require('../../message_type/MessageType');
const MessageManager = require('../../message_type/MessageManager');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Updates your rank based on the given username.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to verify as.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);
        const username = interaction.options.getString('username');

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

            const guildName = config.guildName;

            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            if (config.checkDuplicateNicknames) {
                const alreadyVerified = await validUsername(interaction.member, interaction.guild, username);

                if (!alreadyVerified) {
                    await interaction.editReply(`Someone in this server is already named ${username}.`);
                    return;
                }
            }

            return new Promise((resolve, reject) => {
                db.all(
                    'SELECT UUID, guildRank, rank FROM players WHERE username = ? AND guildName = ?', [username, guildName],
                    async (err, foundRows) => {
                        if (err) {
                            console.error('Error retrieving player data:', err);
                            reject(err);
                            return;
                        }

                        let checkForAlly = false;

                        if (foundRows.length === 0) {
                            checkForAlly = true;
                        } else if (foundRows.length > 1) {
                            let message = `Multiple ${username}'s found.\n`;
                            let counter = 1;

                            const row = new ActionRowBuilder();

                            for (const possibility of foundRows) {
                                message += `${counter}. ${username}, ${possibility.rank} and ${possibility.guildRank} of ${guildName}. (UUID: ${possibility.UUID})\n`;

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

                            const response = new ButtonedMessage(message, [], MessageType.VERIFY, []);

                            response.setMessage(editedReply);

                            MessageManager.addMessage(response);

                            resolve();
                            return;
                        } else {
                            const response = await applyRoles(interaction.guild, foundRows[0].UUID, interaction.member);

                            if (response >= 0) {
                                await interaction.editReply(`Verified as ${username}`);

                                if (config.logMessages && config.logChannel) {
                                    sendMessage(interaction.guild, config.logChannel, `${interaction.user} has verified as ${username}`);
                                }
                            } else {
                                await interaction.editReply(`Unable to verify as ${username}`);
                            }

                            resolve();
                            return;
                        }

                        if (checkForAlly) {
                            let notFound = false;

                            for (const ally of config.allies) {
                                const allyRows = await new Promise((allyResolve, allyReject) => {
                                    db.all(
                                        'SELECT uuid, guildRank, rank FROM players WHERE username = ? AND guildName = ?', [username, ally],
                                        async (allyErr, rows) => {
                                            if (allyErr) {
                                                console.error('Error retrieving player data:', allyErr);
                                                allyReject(allyErr);
                                                return;
                                            }

                                            allyResolve(rows);
                                        },
                                    );
                                });

                                if (allyRows.length === 0) {
                                    notFound = true;
                                } else if (allyRows.length > 1) {
                                    let message = `Multiple ${username}'s found.\n`;
                                    let counter = 1;

                                    const row = new ActionRowBuilder();

                                    for (const possibility of allyRows) {
                                        message += `${counter}. ${username}, ${possibility.rank} and ${possibility.guildRank} of ${ally}. (UUID: ${possibility.UUID})\n`;

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

                                    const response = new ButtonedMessage(message, [], MessageType.VERIFY, []);

                                    response.setMessage(editedReply);

                                    MessageManager.addMessage(response);

                                    resolve();
                                    return;
                                } else {
                                    const response = await applyRoles(interaction.guild, allyRows[0].UUID, interaction.member);

                                    if (response >= 0) {
                                        await interaction.editReply(`Verified as ally ${username}`);

                                        if (config.logMessages && config.logChannel) {
                                            sendMessage(interaction.guild, config.logChannel, `${interaction.user} has verified as ally ${username}`);
                                        }
                                    } else {
                                        await interaction.editReply(`Unable to verify as ally ${username}`);
                                    }

                                    resolve();
                                    return;
                                }

                                if (notFound) {
                                    await interaction.editReply(`Unable to verify you as ${username}.\n\nYou may not be updated as a guild member in the database, run /updateguild <guild_name> to update the members of your guild, it may still take a few minutes to update.`);
                                    await applyRoles(interaction.guild, undefined, interaction.member);
                                    resolve();
                                    return;
                                }
                            }
                        }
                    },
                );
            });
        } catch (error) {
            await interaction.editReply(`Unable to verify as ${username}`);
        }
    },
};

async function validUsername(verifyingMember, guild, nameToCheck) {
    for (const member of guild.members.cache) {
        if (member[0] === verifyingMember.id) {
            continue;
        }

        let nicknameToCheck = member[1].nickname;
        const usernameToCheck = member[1].user.username;

        if (nicknameToCheck) {
            nicknameToCheck = nicknameToCheck.split(' [')[0];
        }

        if (nameToCheck && (nameToCheck.toLowerCase() === (nicknameToCheck || '').toLowerCase() || nameToCheck.toLowerCase() === usernameToCheck.toLowerCase())) {
            return false;
        }
    }

    return true;
}
