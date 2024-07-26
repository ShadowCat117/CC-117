const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const updateGuildMembers = require('../../functions/update_guild_members');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateguildmembers')
        .setDescription('Updates all members of a guild in the database.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild whose members you want to be updated.',
                )
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Updating guild members of ${interaction.options.getString('guild_name')}.`,
            )
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const response = await updateGuildMembers(interaction);

        const responseEmbed = new EmbedBuilder();

        if (response.guildUuids !== undefined) {
            // Multiselector
            responseEmbed
                .setTitle('Multiple guilds found')
                .setDescription(
                    `More than 1 guild has the identifier ${interaction.options.getString('guild_name')}. Pick the intended guild from the following.`,
                )
                .setColor(0x999999);

            const row = new ActionRowBuilder();

            for (let i = 0; i < response.guildUuids.length; i++) {
                const guildPrefix = response.guildPrefixes[i];
                const guildName = response.guildNames[i];

                responseEmbed.addFields({
                    name: `Option ${i + 1}`,
                    value: `[[${guildPrefix}] ${guildName}](https://wynncraft.com/stats/guild/${guildName.replaceAll(' ', '%20')})`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(
                        `update_guild_members:${response.guildUuids[i]}`,
                    )
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
                    .setTitle(
                        `[${response.guildPrefix}] ${response.guildName} Members Updated`,
                    )
                    .setURL(
                        `https://wynncraft.com/stats/guild/${response.guildName.replaceAll(' ', '%20')}`,
                    )
                    .setDescription(
                        'Stored stats for guild members (used in updating roles and checking for guild wide promotions/demotions) will be updated soon.',
                    )
                    .setColor(0x00ffff);
            }
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
