const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ignoreme')
        .setDescription(
            'Toggle if you want mass role updates to apply to you or not.',
        ),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Toggling ignored status.')
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

            if (!config.ignoredUsers) {
                config.ignoredUsers = [];
            }

            let added = false;

            if (config.ignoredUsers.includes(interaction.user.id)) {
                config.ignoredUsers = config.ignoredUsers.filter(
                    (item) => item !== interaction.user.id,
                );
            } else {
                config.ignoredUsers.push(interaction.user.id);
                added = true;
            }

            fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8',
            );

            const responseEmbed = new EmbedBuilder()
                .setTitle(
                    added
                        ? 'Added to the ignored list.'
                        : 'Removed from ignored list.',
                )
                .setDescription(
                    added
                        ? 'Your roles will no longer be updated with mass role updates.'
                        : 'Your roles will now be updated with mass role updates.',
                )
                .setColor(0x00ffff);
            await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(
                    'Failed to add to/remove from the ignored list.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
