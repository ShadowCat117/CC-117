const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const addAlly = require('../../functions/add_ally');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addally')
        .setDescription('Adds an ally Guild.')
        .addStringOption((option) =>
            option
                .setName('guild_name')
                .setDescription(
                    'The name of the guild you want to add as an ally.',
                )
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                `Adding ally ${interaction.options.getString('guild_name')}.`,
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

        let config = {};

        try {
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
                .setDescription('Failed to add ally.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const response = await addAlly(interaction);

        const row = new ActionRowBuilder();

        if (response.guildUuids !== undefined) {
            // Multiselector
            const responseEmbed = new EmbedBuilder()
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
                    .setCustomId(`add_ally:${response.guildUuids[i]}`)
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
            // Error occurred whilst adding
            const responseEmbed = new EmbedBuilder()
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
                    .setDescription(
                        `Unable to find a guild using the name/prefix '${interaction.options.getString('guild_name')}', try again using the exact guild name.`,
                    )
                    .setColor(0xff0000);
            } else {
                // Valid guild
                responseEmbed
                    .setTitle('Successfully added ally')
                    .setDescription(
                        `${response.guildName} is now an allied guild.`,
                    )
                    .setColor(0x00ffff);
            }

            await interaction.editReply({ embeds: [responseEmbed] });

            if (response.guildName === '') return;

            if (config.logMessages && config.logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`${response.guildName} has been added as an ally`)
                    .setColor(0x00ffff)
                    .addFields({
                        name: 'Added by',
                        value: `${interaction.member}`,
                    });

                const channel = interaction.guild.channels.cache.get(
                    config.logChannel,
                );

                if (channel) {
                    try {
                        await channel.send({ embeds: [logEmbed] });
                    } catch (error) {
                        console.error(
                            `Failed to send added ally message to channel ${config.logChannel} in guild ${interaction.guild.id}`,
                        );
                    }
                } else {
                    console.log(
                        `${config.logChannel} not found for guild ${interaction.guild.id}`,
                    );
                }
            }
        }
    },
};
