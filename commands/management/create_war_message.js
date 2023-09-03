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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createwarmessage')
        .setDescription('Sends a war message with buttons to get war-related roles.')
        .addRoleOption((option) =>
            option.setName('warrole')
                .setDescription('The war role')
                .setRequired(true))
        .addRoleOption((option) =>
            option.setName('tankrole')
                .setDescription('The tank role')
                .setRequired(true))
        .addRoleOption((option) =>
            option.setName('healerrole')
                .setDescription('The healer role')
                .setRequired(true))
        .addRoleOption((option) =>
            option.setName('damagerole')
                .setDescription('The damage role')
                .setRequired(true))
        .addRoleOption((option) =>
            option.setName('solorole')
                .setDescription('The solo role')
                .setRequired(true)),
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

            const message = config['warMessage'];
            const warRole = interaction.options.getRole('warrole');
            const tankRole = interaction.options.getRole('tankrole');
            const healerRole = interaction.options.getRole('healerrole');
            const damageRole = interaction.options.getRole('damagerole');
            const soloRole = interaction.options.getRole('solorole');

            if (!message) {
                await interaction.reply({
                    content: 'You have not set a war message with /config_values warMessage.',
                    ephemeral: true,
                });

                return;
            } else if (!config['warClassMessage']) {
                await interaction.reply({
                    content: 'You have not set a war class message with /config_values warClassMessage.',
                    ephemeral: true,
                });

                return;
            }

            const warMessage = await sendMessage(interaction.guild, interaction.channel.id, message);

            const warButton = new ButtonBuilder()
                .setCustomId('war')
                .setStyle(ButtonStyle.Danger)
                .setLabel('WAR');

            const row = new ActionRowBuilder().addComponents(warButton);

            warMessage.edit({
                components: [row],
            });

            if (warMessage) {
                config['warRole'] = warRole.id;
                config['tankRole'] = tankRole.id;
                config['healerRole'] = healerRole.id;
                config['damageRole'] = damageRole.id;
                config['soloRole'] = soloRole.id;

                fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
            } else {
                await interaction.reply({
                    content: 'Error creating war message.',
                    ephemeral: true,
                });
            }

            await interaction.reply({
                content: 'Created war message',
                ephemeral: true,
            });
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'Error creating war message.',
                ephemeral: true,
            });
        }
    },
};
