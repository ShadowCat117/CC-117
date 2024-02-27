const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');
const MessageManager = require('../../message_type/MessageManager');

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
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }

            const message = config['guildEventsMessage'];

            if (!message) {
                await interaction.editReply('You have not set a guilds event message with /config_values guildEventsMessage.');

                return;
            }

            if (!config['giveawayRole']) {
                await interaction.editReply('You have not set a giveaway role.');

                return;
            }

            if (!config['eventsRole']) {
                await interaction.editReply('You have not set an events role.');

                return;
            }

            const guildEventsMessage = await MessageManager.sendMessage(interaction.guild, interaction.channel.id, message);

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
