const {
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeinactivityexception')
        .setDescription('Removes a player\'s custom inactivity threshold.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player who\'s threshold you want to remove.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

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
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            const guildName = config.guildName;

            if (!guildName) {
                await interaction.editReply({
                    content: 'The server you are in does not have a guild set.',
                    ephemeral: true,
                });
                return;
            }

            const username = interaction.options.getString('username');

            if (!config['inactivityExceptions'] || config['inactivityExceptions'][username] === undefined) {
                await interaction.editReply({
                    content: `${username} does not have a custom inactivity threshold.`,
                    ephemeral: true,
                });
                return;
            }
            
            delete config['inactivityExceptions'][username];

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.editReply({
                content: `${username} no longer has a custom inactivity threshold.`,
                ephemeral: true,
            });
            return;
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error removing inactivity exception.');
            return;
        }
    },
};
