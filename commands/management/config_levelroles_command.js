const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_levelroles')
        .setDescription('Update configuration options for level roles')
        .addIntegerOption((option) =>
            option
                .setName('level')
                .setDescription('The level for this role to represent')
                .setRequired(true),
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription(
                    'The role for the given level to be associated with.',
                )
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting level ${level} role to ${role}.`)
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

        const responseEmbed = new EmbedBuilder();

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
            const memberOfRole = config.memberOfRole;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                responseEmbed
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                responseEmbed
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to change config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Limit the level to the current level cap
        if (level < 1 || level > 106) {
            responseEmbed
                .setTitle('Invalid level')
                .setDescription('Level must be in the range 1-106.')
                .setFooter({
                    text: 'If level cap has increased this will be changed soon.',
                })
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        try {
            config['levelRoles'][level] = role.id;

            fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8',
            );

            responseEmbed
                .setDescription(`Level ${level} role set to ${role}.`)
                .setColor(0x00ffff);
        } catch (error) {
            console.error(`Error updating configuration option: ${error}`);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to update config file.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
