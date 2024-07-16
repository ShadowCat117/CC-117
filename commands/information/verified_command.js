const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const verified = require('../../functions/verified');
const messages = require('../../functions/messages');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verified')
        .setDescription('Check who in your server is verified.'),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Finding verified members')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await interaction.editReply({ 
                    content: 'You do not have a guild set. Use /setguild to set one.',
                    embeds: [], 
                });
            }

            const guildName = config.guildName;

            if (!guildName || guildName === '') {
                await interaction.editReply({ 
                    content: 'You do not have a guild set. Use /setguild to set one.',
                    embeds: [], 
                });
            }

            // Call verified
            const response = await verified(guildName, interaction);

            const embeds = [];
            const row = new ActionRowBuilder();

            if (response.guildName === '') {
                const responseEmbed = new EmbedBuilder();

                // Unknown guild
                responseEmbed
                    .setTitle('Guild does not exist')
                    .setDescription(`Unable to find ${guildName}, it may have been deleted or the API is down.`)
                    .setColor(0xff0000);

                embeds.push(responseEmbed);
            } else {
                // Found guild, if more than 45 players we need to make pages for the embed, otherwise 1 page will work
                if (response.verifiedMembers.length > 45) {
                    const pages = [];
                    for (let i = 0; i < response.verifiedMembers.length; i += 45) {
                        pages.push(response.verifiedMembers.slice(i, i + 45));
                    }

                    for (const page of pages) {
                        const responseEmbed = new EmbedBuilder();
                        responseEmbed
                            .setTitle(`[${response.guildPrefix}] ${response.guildName} Verified Members`)
                            .setColor(0x00ffff);
                    
                        let usernameValue = '';
                        let verifiedValue = '';
                    
                        for (const player of page) {
                            usernameValue += player.username + '\n';
                    
                            if (player.verifiedMember) {
                                verifiedValue += `<@${player.verifiedMember}>\n`;
                            } else {
                                verifiedValue += 'Not verified\n';
                            }
                        }
                    
                        responseEmbed
                            .addFields(
                                { name: 'Username', value: usernameValue, inline: true },
                                { name: 'Discord User', value: verifiedValue, inline: true },
                            );
                    
                        embeds.push(responseEmbed);
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
                } else {
                    const responseEmbed = new EmbedBuilder();

                    responseEmbed
                        .setTitle(`[${response.guildPrefix}] ${response.guildName} Verified Members`)
                        .setColor(0x00ffff);

                    if (response.verifiedMembers.length > 0) {
                        let usernameValue = '';
                        let verifiedValue = '';

                        for (const player of response.verifiedMembers) {
                            usernameValue += player.username + '\n';
                    
                            if (player.verifiedMember) {
                                verifiedValue += `${player.verifiedMember}\n`;
                            } else {
                                verifiedValue += 'Not verified\n';
                            }
                        }

                        responseEmbed
                            .addFields(
                                { name: 'Username', value: usernameValue, inline: true },
                                { name: 'Discord User', value: verifiedValue, inline: true },
                            );
                    }

                    embeds.push(responseEmbed);
                }
            }

            if (row.components.length > 0) {
                await interaction.editReply({ 
                    embeds: [embeds[0]],
                    components: [row],
                });
            } else {
                await interaction.editReply({ embeds: [embeds[0]] });
            }
        } catch (error) {
            await interaction.editReply({ 
                content: 'Failed to lookup verified members.',
                embeds: [], 
            });
        }
    },
};
