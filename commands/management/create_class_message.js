const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const sendMessage = require('../../functions/send_message');

const classRoles = ['warrior', 'mage', 'archer', 'shaman', 'assassin', 'fallen', 'battleMonk', 'paladin', 'riftwalker', 'lightBender', 'arcanist', 'sharpshooter', 'trapper', 'boltslinger', 'ritualist', 'summoner', 'acolyte', 'acrobat', 'shadestepper', 'trickster'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createclassmessage')
        .setDescription('Sends a class message with buttons to get class-related roles.'),
    async execute(interaction) {
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

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

            const message = config['classMessage'];

            if (!message) {
                await interaction.reply({
                    content: 'You have not set a class message with /config_values classMessage.',
                    ephemeral: true,
                });

                return;
            } else if (!config['classArchetypeMessage']) {
                await interaction.reply({
                    content: 'You have not set a class archetype message with /config_values classArchetypeMessage.',
                    ephemeral: true,
                });

                return;
            }

            for (const classRole of classRoles) {
                if (!config[`${classRole}Role`]) {
                    await interaction.reply({
                        content: `You have not set a role for ${classRole}.`,
                        ephemeral: true,
                    });
    
                    return;
                }
            }

            const classMessage = await sendMessage(interaction.guild, interaction.channel.id, message);

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

            classMessage.edit({
                components: [row],
            });

            if (!classMessage) {
                await interaction.reply({
                    content: 'Error creating class message.',
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: 'Created class message',
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'Error creating class message.',
                ephemeral: true,
            });
        }
    },
};
