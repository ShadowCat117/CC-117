const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const removePromotionException = require('../../functions/remove_promotion_exception');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepromotionexception')
        .setDescription('Removes a player from the promotion exceptions list.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to be exemept from promotion checks.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        const username = interaction.options.getString('username').replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Removing ${username} from promotion exceptions.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        const errorEmbed = new EmbedBuilder();

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
            const guildUuid = config.guild;

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                errorEmbed
                    .setTitle('Error')
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            if (!guildUuid) {      
                errorEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
        
            const response = await removePromotionException(interaction);

            const responseEmbed = new EmbedBuilder();

            if (response.playerUuids !== undefined) { // Multiselector
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
                            .setCustomId(`remove_promotion_exception:${uuid}`)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel((i + 1).toString());
        
                        row.addComponents(button);
                    }

                await interaction.editReply({
                    components: [row],
                    embeds: [responseEmbed],
                });

                return;
            } else if (response.error) { // Error whilst removing promotion exception
                errorEmbed
                    .setTitle('Error')
                    .setDescription(`Unable to remove promotion exception: ${response.error}`)
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            } else {
                if (response.username === '') { // Unknown player
                    responseEmbed
                        .setTitle('Invalid username')
                        .setDescription(`Unable to find a player using the name '${username}', try again using the exact player name.`)
                        .setColor(0xff0000);
                } else { // Valid player
                    responseEmbed
                        .setTitle(`${response.username} is no longer exempt from promotion.`)
                        .setColor(0x00ffff);
                }
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error(error);
            errorEmbed
                    .setTitle('Error')
                    .setDescription('Unable to remove promotion exception.')
                    .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }
    },
};
