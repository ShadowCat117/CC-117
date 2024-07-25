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
const classRoles = ['warrior', 'mage', 'archer', 'shaman', 'assassin', 'fallen', 'battleMonk', 'paladin', 'riftwalker', 'lightBender', 'arcanist', 'sharpshooter', 'trapper', 'boltslinger', 'ritualist', 'summoner', 'acolyte', 'acrobat', 'shadestepper', 'trickster'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createclassmessage')
        .setDescription('Sends a class message with buttons to get class-related roles.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Creating class message.')
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await createConfig(interaction.client, guildId);

                responseEmbed
                    .setTitle('Error')
                    .setDescription('Failed to read config or you have not setup the class message configs. Do so with /config_messages and /config_classroles.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to read config.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const adminRoleId = config.adminRole;
        const memberRoles = interaction.member.roles.cache;

        // Only owners and admins can run command
        if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
            responseEmbed
                .setDescription('You do not have the required permissions to run this command.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const classMessage = config['classMessage'];

        if (!classMessage) {
            // If no class message, tell the user to set one
            responseEmbed
                .setDescription('You have not set a class message with /config_messages classMessage.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        } else if (!config['classArchetypeMessage']) {
            // If no archetype message, tell the user to set one
            responseEmbed
                .setDescription('You have not set a class archetype message with /config_messages classArchetypeMessage.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        // Loop through class roles and if one is not present, tell the user they need to set it
        for (const classRole of classRoles) {
            if (!config[`${classRole}Role`]) {
                responseEmbed
                    .setDescription(`You have not set a role for ${classRole} using /config_classroles.`)
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        }

        // Add class buttons
        const warriorButton = new ButtonBuilder()
            .setCustomId('warrior')
            .setStyle(ButtonStyle.Primary)
            .setLabel('WARRIOR');

        const mageButton = new ButtonBuilder()
            .setCustomId('mage')
            .setStyle(ButtonStyle.Primary)
            .setLabel('MAGE');

        const archerButton = new ButtonBuilder()
            .setCustomId('archer')
            .setStyle(ButtonStyle.Primary)
            .setLabel('ARCHER');

        const shamanButton = new ButtonBuilder()
            .setCustomId('shaman')
            .setStyle(ButtonStyle.Primary)
            .setLabel('SHAMAN');

        const assassinButton = new ButtonBuilder()
            .setCustomId('assassin')
            .setStyle(ButtonStyle.Primary)
            .setLabel('ASSASSIN');

        const row = new ActionRowBuilder().addComponents(warriorButton, mageButton, archerButton, shamanButton, assassinButton);
        const channel = interaction.guild.channels.cache.get(interaction.channelId);
        const formattedMessage = classMessage.replace(/\\n/g, '\n');

        if (channel) {
            try {
                await channel.send({
                    content: formattedMessage,
                    components: [row],
                });

                responseEmbed
                    .setDescription('Class message created successfully.')
                    .setColor(0x00ffff);
            } catch (error) {
                console.error(`Failed to send class message to channel ${interaction.channelId} in guild ${interaction.guild.id}`);
                responseEmbed
                    .setDescription('Failed to send message in current channel.')
                    .setColor(0xff0000);
            }
        } else {
            responseEmbed
                .setTitle('Error')
                .setDescription('Unable to find current channel.')
                .setColor(0xff0000);
        }

        await interaction.editReply({ embeds: [responseEmbed] });
    },
};
