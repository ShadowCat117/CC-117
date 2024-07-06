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
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demotionexceptions')
        .setDescription('Check who in your guild is exempt from demotion.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading demotion exceptions.')
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
            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;

            const guildName = config.guildName;

            // Command can only be ran if the server has a guild set
            if (!guildName) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // If the member of role is used, check the user has it to let them run the command
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    responseEmbed
                        .setTitle('Error')
                        .setDescription(`You must be a member of ${guildName} to run this command.`)
                        .setColor(0xff0000);
                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                }
            }

            // No players areexempt from demotion
            if (!config['demotionExceptions'] || Object.keys(config['demotionExceptions']).length === 0) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription('No players are currently exempt from being demoted.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (Object.keys(config['demotionExceptions']).length > 25) {
                const embeds = [];
                const row = new ActionRowBuilder();

                const pages = [];
                for (let i = 0; i < Object.keys(config['demotionExceptions']).length; i += 25) {
                    pages.push(Object.keys(config['demotionExceptions']).slice(i, i + 25));
                }

                for (const page of pages) {
                    const pageEmbed = new EmbedBuilder();

                    pageEmbed
                        .setTitle(`${guildName} Demotion Exceptions`)
                        .setDescription('These players are exempt from being demoted.')
                        .setColor(0x00ffff);

                    for (const player in page) {
                        let duration;

                        if (config['demotionExceptions'][page[player]] === -1) {
                            duration = 'Exempt from demotions forever';
                        } else {
                            duration = `Exempt from demotions for ${config['demotionExceptions'][page[player]]} day${config['demotionExceptions'][page[player]] > 1 ? 's' : ''}`;
                        }

                        pageEmbed.addFields({ name: page[player], value: duration });
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
                    .setTitle(`${guildName} Demotion Exceptions`)
                    .setDescription('These players are exempt from being demoted.')
                    .setColor(0x00ffff);

                for (const player in config['demotionExceptions']) {
                    let duration;

                    if (config['demotionExceptions'][player] === -1) {
                        duration = 'Exempt from demotions forever';
                    } else {
                        duration = `Exempt from demotions for ${config['demotionExceptions'][player]} day${config['demotionExceptions'][player] > 1 ? 's' : ''}`;
                    }
                    
                    responseEmbed.addFields({ name: player, value: duration });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error) {
            console.log(error);
            responseEmbed
                    .setTitle('Error')
                    .setDescription('Error viewing demotion exceptions.')
                    .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }
    },
};
