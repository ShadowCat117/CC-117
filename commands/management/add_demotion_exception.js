const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const addDemotionException = require('../../functions/add_demotion_exception');
const MessageManager = require('../../message_type/MessageManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adddemotionexception')
        .setDescription('Adds a player to be excluded from demotion checks. Default length is forever.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to be exemept from demotion checks.')
                .setRequired(true))
        .addIntegerOption((option) =>
        option.setName('exemption_period')
            .setDescription('How long should they be exempt from demotion?')),
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
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            let exemptionPeriod = interaction.options.getInteger('exemption_period') ?? -1;

            if (exemptionPeriod < -1) {
                exemptionPeriod = -1;
            }

            const response = await addDemotionException(interaction, false, exemptionPeriod);

            if (response.componentIds.length > 0) {
                const row = new ActionRowBuilder();
    
                for (let i = 0; i < response.componentIds.length; i++) {
                    const button = new ButtonBuilder()
                        .setCustomId(response.componentIds[i])
                        .setStyle(ButtonStyle.Primary)
                        .setLabel((i + 1).toString());
                    row.addComponents(button);
                }
    
                const editedReply = await interaction.editReply({
                    content: response.text,
                    components: [row],
                });
    
                response.setMessage(editedReply);
    
                MessageManager.addMessage(response);
            } else {
                await interaction.editReply(response.pages[0]);
            }
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error adding demotion exception.');
            return;
        }
    },
};
