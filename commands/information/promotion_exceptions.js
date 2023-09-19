const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotionexceptions')
        .setDescription('Check who in your guild is exempt from promotion.'),

    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);

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
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            if (!config['promotionExceptions'] || config['promotionExceptions'].length === 0) {
                await interaction.editReply({
                    content: 'No players are exempt from promotion',
                    ephemeral: true,
                });
                return;
            }

            const exemptPlayers = config['promotionExceptions'].join(', ');

            await interaction.editReply({
                content: `Players who are exempt from promotion: \n${exemptPlayers}`,
                ephemeral: true,
            });
        } catch (error) {
            await interaction.editReply({
                content: 'Unable to show promotion exemptions',
                ephemeral: true,
            });
        }
    },
};