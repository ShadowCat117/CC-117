const {
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removedemotionexception')
        .setDescription('Removes a player to be excluded from demotion checks.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to be exemept from demotion checks.')
                .setRequired(true)),
    ephemeral: true,
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

            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

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

            if (!config['demotionExceptions'] || !config['demotionExceptions'][username]) {
                await interaction.editReply({
                    content: `${username} is not exempt from demotions`,
                    ephemeral: true,
                });
                return;
            }
            
            delete config['demotionExceptions'][username];

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.editReply({
                content: `${username} is no longer exempt from demotions`,
                ephemeral: true,
            });
            return;
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error removing demotion exception.');
            return;
        }
    },
};
