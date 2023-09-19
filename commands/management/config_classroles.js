const {
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
                .setDescription('The role value to set for the configuration option'),
        ),
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

            if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
                await interaction.reply({
                    content: 'You do not have the required permissions to run this command.',
                    ephemeral: true,
                });
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.reply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const role = interaction.options.getRole('role');

        switch (option) {
            case 'warriorRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Warrior Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'fallenRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Fallen Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'battleMonkRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Battle Monk Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'paladinRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Paladin Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'mageRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Mage Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'riftwalkerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Riftwalker Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'lightBenderRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Light Bender Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'arcanistRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Arcanist Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'archerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Archer Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'sharpshooterRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Sharpshooter Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'trapperRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Trapper Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'boltslingerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Boltslinger Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'shamanRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Shaman Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'ritualistRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Ritualist Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'summonerRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Summoner Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'acolyteRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Acolyte Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'assassinRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Assassin Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'acrobatRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Acrobat Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'shadestepperRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Shadestepper Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            case 'tricksterRole':
                if (role == null) {
                    await interaction.reply({
                        content: 'Trickster Role requires a <role> input.',
                        ephemeral: true,
                    });
                    return;
                }

                break;
            default:
                await interaction.reply({
                    content: 'Invalid configuration option.',
                    ephemeral: true,
                });
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

            if (botRole) {
                if (role.comparePositionTo(botRole) > 0) {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.\n\nThe ${role} role is currently above the ${botRole} role in your hierarchy, this means that I will not be able to add that role to members, please change this so I can add the role correctly!`;
                } else {
                    message = `Configuration option \`${option}\` updated successfully to ${role}.`;
                }
            } else {
                message = `Configuration option \`${option}\` updated successfully to ${role}.\nFor some reason my role was not found on your server. Please try kicking and inviting me again to try and fix this. Your config options will be saved.`;
            }

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

            await interaction.reply({
                content: message,
                ephemeral: true,
            });
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.reply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
