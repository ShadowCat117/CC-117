const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_messages')
        .setDescription('Update message configuration options')
        .addStringOption((option) =>
            option
                .setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Join Message',
                        value: 'joinMessage',
                    },
                    {
                        name: 'Leave Message',
                        value: 'leaveMessage',
                    },
                    {
                        name: 'War Message',
                        value: 'warMessage',
                    },
                    {
                        name: 'War Class Message',
                        value: 'warClassMessage',
                    },
                    {
                        name: 'Class Message',
                        value: 'classMessage',
                    },
                    {
                        name: 'Class Archetype Message',
                        value: 'classArchetypeMessage',
                    },
                    {
                        name: 'Guild Events Message',
                        value: 'guildEventsMessage',
                    },
                ),
        )
        .addStringOption((option) =>
            option
                .setName('message')
                .setDescription(
                    'The message to set for the configuration option',
                )
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const message = interaction.options.getString('message');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting message ${option}.`)
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

        // Cap the message at 1000 characters
        if (message.length > 1000) {
            responseEmbed
                .setTitle('Message exceeds length')
                .setDescription(
                    `Messages cannot exceed 1,000 characters, yours is ${message.length}.`,
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        try {
            switch (option) {
                case 'joinMessage':
                case 'leaveMessage':
                case 'warMessage':
                case 'warClassMessage':
                case 'classMessage':
                case 'classArchetypeMessage':
                case 'guildEventsMessage':
                    config[option] = message;
                    break;
            }

            fs.writeFileSync(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8',
            );

            responseEmbed
                .setDescription(
                    `Configuration option ${option} updated successfully.`,
                )
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
