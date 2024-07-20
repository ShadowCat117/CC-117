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
const messages = require('../../functions/messages');
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotionexceptions')
        .setDescription('Check who in your guild is exempt from promotion.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading promotion exceptions.')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        const responseEmbed = new EmbedBuilder();

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

            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            const guildUuid = config.guild;

            // Command can only be ran if the server has a guild set
            if (!guildUuid) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            const guildName = (await database.findGuild(guildUuid, true)).name;

            // If the member of role is used, check the user has it to let them run the command
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(`You must be a member of ${guildName} to run this command.`)
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // No players are exempt from promotion
            if (!config['promotionExceptions'] || Object.keys(config['promotionExceptions']).length === 0) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('No players are currently exempt from being promoted.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (Object.keys(config['promotionExceptions']).length > 25) {
                const embeds = [];
                const row = new ActionRowBuilder();

                const pages = [];
                for (let i = 0; i < Object.keys(config['promotionExceptions']).length; i += 25) {
                    pages.push(Object.keys(config['promotionExceptions']).slice(i, i + 25));
                }

                for (const page of pages) {
                    const pageEmbed = new EmbedBuilder();

                    pageEmbed
                        .setTitle(`${guildName} Promotion Exceptions`)
                        .setDescription('These players are exempt from being promoted.')
                        .setColor(0x00ffff);

                    for (const player in page) {
                        let duration;

                        if (config['promotionExceptions'][page[player]] === -1) {
                            duration = 'Exempt from promotions forever';
                        } else {
                            duration = `Exempt from promotions for ${config['promotionExceptions'][page[player]]} day${config['promotionExceptions'][page[player]] > 1 ? 's' : ''}`;
                        }

                        pageEmbed.addFields({ name: page[player].replaceAll('_', '\\_'), value: duration });
                    }

                    embeds.push(pageEmbed);
                }

                messages.addMessage(message.id, new PagedMessage(message, embeds));

                const previousPage = new ButtonBuilder()
                    .setCustomId('previous')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⬅️');

                const nextPage = new ButtonBuilder()
                    .setCustomId('next')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➡️');

                row.addComponents(previousPage, nextPage);

                await interaction.editReply({ 
                    embeds: [embeds[0]],
                    components: [row],
                });
            } else {
                responseEmbed
                    .setTitle(`${guildName} Promotion Exceptions`)
                    .setDescription('These players are exempt from being promoted.')
                    .setColor(0x00ffff);

                for (const player in config['promotionExceptions']) {
                    let duration;

                    if (config['promotionExceptions'][player] === -1) {
                        duration = 'Exempt from promotions forever';
                    } else {
                        duration = `Exempt from promotions for ${config['promotionExceptions'][player]} day${config['promotionExceptions'][player] > 1 ? 's' : ''}`;
                    }
                    
                    responseEmbed.addFields({ name: player.replaceAll('_', '\\_'), value: duration });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error) {
            console.log(error);
            responseEmbed
                    .setTitle('Error')
                    .setDescription('Error viewing promotion exceptions.')
                    .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }
    },
};
