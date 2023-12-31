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

const warRoles = ['war', 'tank', 'healer', 'damage', 'solo', 'eco'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createwarmessage')
        .setDescription('Sends a war message with buttons to get war-related roles.'),
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
            const addMemberOfRole = config.memberOf;
            const memberOfRole = config.memberOfRole;

            const guildName = config.guildName;

            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

            const message = config['warMessage'];

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
            } else if (!config['warLevelRequirement']) {
                await interaction.reply({
                    content: 'You have not set a war level requirement with /config_values warLevelRequirement.',
                    ephemeral: true,
                });

                return;
            }

            for (const warRole of warRoles) {
                if (!config[`${warRole}Role`]) {
                    await interaction.reply({
                        content: `You have not set a role for ${warRole}.`,
                        ephemeral: true,
                    });
    
                    return;
                }
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
