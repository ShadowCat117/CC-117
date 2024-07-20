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
const updateRoles = require('../../functions/update_roles');
const messages = require('../../functions/messages');
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateroles')
        .setDescription('Updates the roles of every member of the server.'),
    ephemeral: false,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Updating roles for ${interaction.guild}`)
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const embeds = [];
        const row = new ActionRowBuilder();

        let config = {};

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);

                const guildUuid = config.guild;

                // Guild set required
                if (!guildUuid) {
                    const responseEmbed = new EmbedBuilder()
                            .setTitle('No Guild Set')
                            .setDescription('The server you are in does not have a guild set.')
                            .setColor(0xff0000);

                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                }

                const memberRoles = interaction.member.roles.cache;
                const adminRoleId = config.adminRole;
                const memberOfRole = config.memberOfRole;

                if (interaction.member.id !== interaction.member.guild.ownerId && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                    const responseEmbed = new EmbedBuilder()
                            .setTitle('Missing Permissions')
                            .setDescription('You do not have the permissions to run this command.')
                            .setColor(0xff0000);

                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                } else if (interaction.member.id !== interaction.member.guild.ownerId && (memberOfRole && !memberRoles.has(memberOfRole))) {
                    const guildName = await database.findGuild(guildUuid, true);
                    const responseEmbed = new EmbedBuilder()
                            .setTitle('Missing Permissions')
                            .setDescription(`You must be a member of ${guildName} to use this command.`)
                            .setColor(0xff0000);

                    await interaction.editReply({ embeds: [responseEmbed] });
                    return;
                }
            } else {
                await createConfig(interaction.client, guildId);

                const responseEmbed = new EmbedBuilder()
                    .setTitle('Unable to find config')
                    .setDescription('The config file for this server was not found, either an error has occured or verification has not been setup.')
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            const responseEmbed = new EmbedBuilder()
                    .setTitle('Unable to update roles')
                    .setDescription('An error occured whilst trying to update roles, please try again later.')
                    .setColor(0xff0000);

            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Call updateRoles
        const response = await updateRoles(interaction.guild);

        if (response.length === 0) {
            const responseEmbed = new EmbedBuilder()
                .setTitle('No roles updated')
                .setDescription('Everyone is up to date, if you believe this is wrong you can run /updateguildmembers <guildName> or /updateplayer <playerName> to update known guild member/player info and try again later.')
                .setColor(0x999999);

            embeds.push(responseEmbed);
        } else if (response.length > 5) {
            const pages = [];
            for (let i = 0; i < response.length; i += 5) {
                pages.push(response.slice(i, i + 5));
            }

            for (const page of pages) {
                const responseEmbed = new EmbedBuilder();

                responseEmbed
                    .setTitle(`Updated roles for ${response.length} members`)
                    .setColor(0x00ffff);
            
                for (const player of page) {
                    let appliedChanges = 'Applied changes: \n';

                    for (const update of player.updates) {
                        appliedChanges += `${update}\n`;
                    }

                    for (const error of player.errors) {
                        appliedChanges += `${error}\n`;
                    }

                    appliedChanges += `User: ${player.member}`;

                    let name = player.username;

                    if (!name) {
                        name = `${player.member.user.username} Unverified`;
                    }

                    responseEmbed.addFields({ name: `${name}`, value: `${appliedChanges}` });
                }
            
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
                .setTitle(`Updated roles for ${response.length} members`)
                .setColor(0x00ffff);

            for (const player of response) {
                let appliedChanges = 'Applied changes: \n';

                for (const update of player.updates) {
                    appliedChanges += `${update}\n`;
                }

                for (const error of player.errors) {
                    appliedChanges += `${error}\n`;
                }

                appliedChanges += `User: ${player.member}`;

                let name = player.username;

                if (!name) {
                    name = `${player.member.user.username} Unverified`;
                }

                responseEmbed.addFields({ name: `${name}`, value: `${appliedChanges}` });
            }

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
    },
};
