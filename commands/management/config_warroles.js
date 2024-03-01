const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_warroles')
        .setDescription('Update war role configurations')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'War Role',
                    value: 'warRole',
                }, {
                    name: 'Tank Role',
                    value: 'tankRole',
                }, {
                    name: 'Healer Role',
                    value: 'healerRole',
                }, {
                    name: 'Damage Role',
                    value: 'damageRole',
                }, {
                    name: 'Solo Role',
                    value: 'soloRole',
                }, {
                    name: 'Eco Role',
                    value: 'ecoRole',
                }, {
                    name: 'Warrer Role',
                    value: 'warrerRole',
                }))
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('The role value to set for the configuration option')
                .setRequired(true),
        ),
    ephemeral: true,
    async execute(interaction) {
        try {
            let config = {};

            const guildId = interaction.guild.id;
            const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

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

            // A guild must be set to run this command
            if (!guildName) {
                await interaction.editReply('The server you are in does not have a guild set.');
                return;
            }

            // If the member of role is used, it is required
            if (addMemberOfRole) {
                if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(memberOfRole))) {
                    await interaction.editReply(`You must be a member of ${guildName} to use this command.`);
                    return;
                }
            }

            // Can only be ran by the owner or an admin
            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.editReply('You do not have the required permissions to run this command.');
                return;
            }
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        // Validate the options
        switch (option) {
            case 'warRole':
                if (role == null) {
                    await interaction.editReply('War Role requires a <role> input.');
                    return;
                }

                break;
            case 'tankRole':
                if (role == null) {
                    await interaction.editReply('Tank Role requires a <role> input.');
                    return;
                }

                break;
            case 'healerRole':
                if (role == null) {
                    await interaction.editReply('Healer Role requires a <role> input.');
                    return;
                }

                break;
            case 'damageRole':
                if (role == null) {
                    await interaction.editReply('Damage Role requires a <role> input.');
                    return;
                }

                break;
            case 'soloRole':
                if (role == null) {
                    await interaction.editReply('Solo Role requires a <role> input.');
                    return;
                }

                break;
            case 'ecoRole':
                if (role == null) {
                    await interaction.editReply('Eco Role requires a <role> input.');
                    return;
                }

                break;
            case 'warrerRole':
                if (role == null) {
                    await interaction.editReply('Warrer Role requires a <role> input.');
                    return;
                }

                break;
            default:
                await interaction.editReply('Invalid configuration option.');
                return;
        }

        const guildId = interaction.guild.id;
        const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

        try {
            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const guild = interaction.guild;
            const botRole = guild.roles.cache.find(roleSearch => roleSearch.managed && roleSearch.members.has(interaction.client.user.id));

            let message;

            // If the bot does not have permission to give the role, let the user know
            if (botRole) {
                if (role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to members, please change this so I can add the role correctly!`;
                } else {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option \`${option}\` updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

            // Save the option to the config
            switch (option) {
                case 'warRole':
                case 'tankRole':
                case 'healerRole':
                case 'damageRole':
                case 'soloRole':
                case 'ecoRole':
                case 'warrerRole':
                    config[option] = role.id;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            await interaction.editReply(message);
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.editReply('An error occurred while updating the configuration option.');
        }
    },
};
