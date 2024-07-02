const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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

            // Do not run command if no guild set
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If member of role is used, then require it to run command
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Only owners and admins can run command
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            const message = config['classMessage'];

            if (!message) {
                // If no class message, tell the user to set one
                await interaction.editReply('You have not set a class message with /config_values classMessage.');

                return;
            } else if (!config['classArchetypeMessage']) {
                // If no archetype message, tell the user to set one
                await interaction.editReply('You have not set a class archetype message with /config_values classArchetypeMessage.');

                return;
            }

            // Loop through class roles and if one is not present, tell the user they need to set it
            for (const classRole of classRoles) {
                if (!config[`${classRole}Role`]) {
                    await interaction.editReply(`You have not set a role for ${classRole}.`);
    
                    return;
                }
            }

            // Send class message

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

            classMessage.edit({
                components: [row],
            });

            if (!classMessage) {
                await interaction.editReply('Error creating class message.');
            } else {
                await interaction.editReply('Created class message');
            }
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error creating class message.');
        }
    },
};
