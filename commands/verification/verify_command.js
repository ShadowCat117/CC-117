const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const verify = require('../../functions/verify');
const utilities = require('../../functions/utilities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Updates your roles based on the given username.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to verify as.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);
        const username = interaction.options.getString('username').replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Verifying as ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const responseEmbed = new EmbedBuilder();

        let config = {};

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);

                const guildUuid = config.guild;

                // Guild set required
                if (!guildUuid) {
                    responseEmbed
                            .setTitle('No Guild Set')
                            .setDescription('The server you are in does not have a guild set.')
                            .setColor(0xff0000);

                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                }
            } else {
                await createConfig(interaction.client, guildId);

                responseEmbed
                    .setTitle('Unable to find config')
                    .setDescription('The config file for this server was not found, either an error has occured or verification has not been setup.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                    .setTitle('Unable to verify')
                    .setDescription('An error occured whilst trying to verify, please try again later.')
                    .setColor(0xff0000);

            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Check if the username is in use
        const alreadyVerified = await utilities.checkValidUsername(interaction.member, interaction.guild, username);

        // If someone already has the nickname they want, let them know
        if (!alreadyVerified) {
            responseEmbed
                    .setTitle('Invalid username')
                    .setDescription(`Someone is already verified as ${username}.`)
                    .setColor(0xff0000);

            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Call verify
        const response = await verify(interaction);

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
                    .setCustomId(`verify:${uuid}`)
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
            } else if (response.updates.length > 0 || response.errors.length > 0) {
                // Valid player, with changes
                responseEmbed
                    .setTitle(`Verified as ${response.username}`)
                    .setColor(0x00ffff);

                let appliedChanges = 'Applied changes: \n';

                for (const update of response.updates) {
                    appliedChanges += `${update}\n`;
                }

                for (const error of response.errors) {
                    appliedChanges += `${error}\n`;
                }

                responseEmbed.setDescription(appliedChanges);
            } else {
                responseEmbed
                    .setTitle(`Verified as ${response.username}`)
                    .setDescription('No changes.')
                    .setColor(0x999999);
            }
        }

        await interaction.editReply({ embeds: [responseEmbed] });

        if (!response.updates || !response.errors) return;

        if (response.updates.length > 0 || response.errors.length > 0 && config.logMessages && config.logChannel) {
            responseEmbed
                .setTitle(`${interaction.member.user.username} has verified as ${response.username}`)
                .addFields({ name: 'User', value: `${interaction.member}` });

            const channel = interaction.guild.channels.cache.get(config.logChannel);

            if (channel) {
                try {
                    await channel.send({ embeds: [responseEmbed] });
                } catch (error) {
                    console.error(`Failed to send verification message to channel ${config.logChannel} in guild ${interaction.guild.id}`);
                }
            } else {
                console.log(`${config.logChannel} not found for guild ${interaction.guild.id}`);
            }
        }
    },
};
