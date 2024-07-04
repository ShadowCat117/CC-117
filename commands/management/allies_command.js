const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const messages = require('../../functions/messages');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allies')
        .setDescription('View the guilds you have set as allies.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading allies.')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

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

            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;
            const memberRoles = interaction.member.roles.cache;

            const guildName = config.guildName;

            const embeds = [];
            const errorEmbed = new EmbedBuilder();

            if (!guildName) {
                // Need a set guild to run this command               
                errorEmbed
                    .setTitle('Error')
                    .setDescription('You do not have a guild set.')
                    .setColor(0xff0000);

                embeds.push(errorEmbed);
            } else if (config.allies.length === 0) {
                // If no allies
                errorEmbed
                        .setTitle('Error')
                        .setDescription('No allies have been set.')
                        .setColor(0x00ffff);

                embeds.push(errorEmbed);
            } else if (addMemberOfRole) {
                // If member of role is used make sure they have the role
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    errorEmbed
                        .setTitle('Error')
                        .setDescription(`You must be a member of ${guildName} to use this command.`)
                        .setColor(0xff0000);

                    embeds.push(errorEmbed);
                }
            }

            const row = new ActionRowBuilder();

            if (config.allies.length > 50) {
                const pages = [];
                for (let i = 0; i < config.alliess.length; i += 50) {
                    pages.push(config.allies.slice(i, i + 50));
                }

                for (const page of pages) {
                    const responseEmbed = new EmbedBuilder();

                    responseEmbed
                        .setTitle(`${guildName} Allies`)
                        .setColor(0x00ffff);

                    let alliesValue = '';

                    for (const ally of page) {
                        alliesValue += `${ally}\n`;
                    }

                    responseEmbed.addFields({ name: 'Allies', value: alliesValue });

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
            } else if (config.allies.length > 0) {
                const responseEmbed = new EmbedBuilder();

                responseEmbed
                    .setTitle(`${guildName} Allies`)
                    .setColor(0x00ffff);

                let alliesValue = '';

                for (const ally of config.allies) {
                    alliesValue += `${ally}\n`;
                }

                responseEmbed.addFields({ name: 'Allies', value: alliesValue });

                embeds.push(responseEmbed);
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
            console.error(error);

            const errorEmbed = new EmbedBuilder()
                .setDescription('Error checking allies.')
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
