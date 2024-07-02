const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createguildeventsmessage')
        .setDescription('Sends a message with buttons to get the giveaways and events roles.'),
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

            const message = config['guildEventsMessage'];

            // If no events message, tell the user to set one
            if (!message) {
                await interaction.editReply('You have not set a guilds event message with /config_values guildEventsMessage.');

                return;
            }

            // Check if the giveaway role exists and if not tell the user to set it
            if (!config['giveawayRole']) {
                await interaction.editReply('You have not set a giveaway role.');

                return;
            }

            // Same for the events role
            if (!config['eventsRole']) {
                await interaction.editReply('You have not set an events role.');

                return;
            }

            // Send guild events message

            // Add giveaway and events button
            const giveawayButton = new ButtonBuilder()
                .setCustomId('giveaway')
                .setStyle(ButtonStyle.Success)
                .setLabel('GIVEAWAY');

            const eventsButton = new ButtonBuilder()
                .setCustomId('events')
                .setStyle(ButtonStyle.Success)
                .setLabel('EVENTS');

            const row = new ActionRowBuilder().addComponents(giveawayButton, eventsButton);

            guildEventsMessage.edit({
                components: [row],
            });

            await interaction.editReply('Created guild events message');
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error creating guild events message.');
        }
    },
};
