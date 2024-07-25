const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const removeAlly = require('../../functions/remove_ally');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeally')
        .setDescription('Removes an ally Guild.')
        .addStringOption(option =>
            option.setName('guild_name')
                .setDescription('The name of the guild you want to remove as an ally.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Removing ally ${interaction.options.getString('guild_name')}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

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

            // Command can only be ran by owners or admins
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('Failed to remove ally.')
                    .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        // Call removeAlly
        const response = await removeAlly(interaction);

        const row = new ActionRowBuilder();

        if (response.guildUuids !== undefined) {
            const responseEmbed = new EmbedBuilder();

            // Multiselector
            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(`More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following.`)
                .setColor(0x999999);

            for (let i = 0; i < response.guildUuids.length; i++) {
                const guildPrefix = response.guildPrefixes[i];
                const guildName = response.guildNames[i];

                responseEmbed
                    .addFields({ name: `Option ${i + 1}`, value: `[[${guildPrefix}] ${guildName}](https://wynncraft.com/stats/guild/${guildName.replaceAll(' ', '%20')})` });

                const button = new ButtonBuilder()
                    .setCustomId(`remove_ally:${response.guildUuids[i]}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel((i + 1).toString());

                row.addComponents(button);
            }

            await interaction.editReply({
                components: [row],
                embeds: [responseEmbed],
            });

            return;
        } else if (response.error) {
            // Error
            const responseEmbed = new EmbedBuilder();

            responseEmbed
                .setTitle('Error')
                .setDescription(`${response.error}`)
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [responseEmbed] });
        } else {
            const responseEmbed = new EmbedBuilder();

            if (response.guildName === '') {
                // Unknown guild
                responseEmbed
                    .setTitle('Invalid guild')
                    .setDescription(`Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`)
                    .setColor(0xff0000);
            } else {
                // Valid guild
                responseEmbed
                    .setTitle('Successfully removed ally')
                    .setDescription(`${response.guildName} is no longer an allied guild.`)
                    .setColor(0x00ffff);
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        }
    },
};
