const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const MessageManager = require('../../message_type/MessageManager');
const fs = require('fs');
const path = require('path');
const verify = require('../../functions/verify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Updates your rank based on the given username.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The name of the player you want to verify as.')
                .setRequired(true)),
    ephemeral: true,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const directoryPath = path.join(__dirname, '..', '..', 'configs');
        const filePath = path.join(directoryPath, `${guildId}.json`);
        const username = interaction.options.getString('username');
        const formattedUsername = username.replace(/_/g, '\\_');

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

            const guildName = config.guildName;

            // Guild set required
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the server doesn't want duplicate nicknames then check if the person they are trying to verify as is verified
            if (config.checkDuplicateNicknames) {
                // Check if the username is in use
                const alreadyVerified = await validUsername(interaction.member, interaction.guild, username);

                // If someone already has the nickname they want, let them know
                if (!alreadyVerified) {
                    await interaction.editReply(`Someone in this server is already named ${formattedUsername}.`);
                    return;
                }
            }

            // Call verify
            const response = await verify(interaction, false);

            if (response.componentIds.length > 0) {
                // If multiple matching usernames, present choice
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
                // Successfuly verified
                await interaction.editReply(response.pages[0]);
            }
        } catch (error) {
            await interaction.editReply(`Unable to verify as ${formattedUsername}`);
        }
    },
};

async function validUsername(verifyingMember, guild, nameToCheck) {
    // Temporary fix to stop others verifying as friends old name
    if (nameToCheck.toLowerCase() === 'owen_rocks_3') return false;
    
    // Loop through all server members
    for (const member of guild.members.cache) {
        // Ignore if member is the current member trying to verify
        if (member[0] === verifyingMember.id) {
            continue;
        }

        let nicknameToCheck = member[1].nickname;
        const usernameToCheck = member[1].user.username;

        // If nickname given, remove guild prefix if there is one
        if (nicknameToCheck) {
            nicknameToCheck = nicknameToCheck.split(' [')[0];
        }

        // If the nickname matches then return false for invalid username
        if (nameToCheck && (nameToCheck.toLowerCase() === (nicknameToCheck || '').toLowerCase() || nameToCheck.toLowerCase() === usernameToCheck.toLowerCase())) {
            return false;
        }
    }

    // All members checked, no conflicting username found
    return true;
}
