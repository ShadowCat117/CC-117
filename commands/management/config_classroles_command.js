const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_classroles')
        .setDescription('Update class role configurations')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Warrior Role',
                    value: 'warriorRole',
                }, {
                    name: 'Fallen Role',
                    value: 'fallenRole',
                }, {
                    name: 'Battle Monk Role',
                    value: 'battleMonkRole',
                }, {
                    name: 'Paladin Role',
                    value: 'paladinRole',
                }, {
                    name: 'Mage Role',
                    value: 'mageRole',
                }, {
                    name: 'Riftwalker Role',
                    value: 'riftwalkerRole',
                }, {
                    name: 'Light Bender Role',
                    value: 'lightBenderRole',
                }, {
                    name: 'Arcanist Role',
                    value: 'arcanistRole',
                }, {
                    name: 'Archer Role',
                    value: 'archerRole',
                }, {
                    name: 'Sharpshooter Role',
                    value: 'sharpshooterRole',
                }, {
                    name: 'Trapper Role',
                    value: 'trapperRole',
                }, {
                    name: 'Boltslinger Role',
                    value: 'boltslingerRole',
                }, {
                    name: 'Shaman Role',
                    value: 'shamanRole',
                }, {
                    name: 'Ritualist Role',
                    value: 'ritualistRole',
                }, {
                    name: 'Summoner Role',
                    value: 'summonerRole',
                }, {
                    name: 'Acolyte Role',
                    value: 'acolyteRole',
                }, {
                    name: 'Assassin Role',
                    value: 'assassinRole',
                }, {
                    name: 'Acrobat Role',
                    value: 'acrobatRole',
                }, {
                    name: 'Shadestepper Role',
                    value: 'shadestepperRole',
                }, {
                    name: 'Trickster Role',
                    value: 'tricksterRole',
                }))
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('The role value to set for the configuration option')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Setting ${option} to ${role}.`)
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

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            // If the member of role is used, it is required
            if (memberOfRole && (interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            // Can only be ran by the owner or an admin
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                responseEmbed
                    .setDescription('You do not have the required permissions to run this command.')
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

        try {
            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(roleSearch => roleSearch.managed && roleSearch.members.has(interaction.client.user.id));

            let message;

            // If the bot does not have permission to give the role, let the user know
            if (botRole) {
                if (role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option ${option} updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to members, please change this so I can add the role correctly!`;
                } else {
                    message = `Configuration option ${option} updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option ${option} updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

            // Save the option to the config
            switch (option) {
                case 'warriorRole':
                case 'fallenRole':
                case 'battleMonkRole':
                case 'paladinRole':
                case 'mageRole':
                case 'riftwalkerRole':
                case 'lightBenderRole':
                case 'arcanistRole':
                case 'archerRole':
                case 'sharpshooterRole':
                case 'trapperRole':
                case 'boltslingerRole':
                case 'shamanRole':
                case 'ritualistRole':
                case 'summonerRole':
                case 'acolyteRole':
                case 'assassinRole':
                case 'acrobatRole':
                case 'shadestepperRole':
                case 'tricksterRole':
                    config[option] = role.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            responseEmbed
                .setDescription(`${message}`)
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
