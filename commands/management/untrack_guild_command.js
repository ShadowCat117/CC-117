const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const configUtils = require('../../functions/config_utils');
const untrackGuild = require('../../functions/untrack_guild');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untrackguild')
        .setDescription("No longer track a guild's online players.")
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild you no longer want to track.',
                )
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Untracking ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Unable to untrack guild.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const response = await untrackGuild(interaction);

        const row = new ActionRowBuilder();
        const responseEmbed = new EmbedBuilder();

        if (response.guildUuids !== undefined) {
            // Multiselector
            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(
                    `More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following.`,
                )
                .setColor(0x999999);

            for (let i = 0; i < response.guildUuids.length; i++) {
                const guildPrefix = response.guildPrefixes[i];
                const guildName = response.guildNames[i];

                responseEmbed.addFields({
                    name: `Option ${i + 1}`,
                    value: `[[${guildPrefix}] ${guildName}](https://wynncraft.com/stats/guild/${guildName.replaceAll(' ', '%20')})`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(`untrack_guild:${response.guildUuids[i]}`)
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
            // Errpr whilst trying to untrack guild
            responseEmbed
                .setTitle('Error')
                .setDescription(`${response.error}`)
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [responseEmbed] });
        } else {
            if (response.guildName === '') {
                // Unknown guild
                responseEmbed
                    .setTitle('Invalid guild')
                    .setDescription(
                        `Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`,
                    )
                    .setColor(0xff0000);
            } else {
                // Valid guild
                responseEmbed
                    .setTitle('Successfully untracked guild')
                    .setDescription(
                        `${response.guildName} is no longer being tracked.`,
                    )
                    .setColor(0x00ffff);
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        }
    },
};
