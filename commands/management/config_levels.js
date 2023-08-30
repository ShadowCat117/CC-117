const {
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config_levels')
        .setDescription('Update configuration options for level roles')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The configuration option to update')
                .setRequired(true)
                .addChoices({
                    name: 'Level One Level',
                    value: 'levelRoleOneLevel',
                }, {
                    name: 'Level Two Level',
                    value: 'levelRoleTwoLevel',
                }, {
                    name: 'Level Three Level',
                    value: 'levelRoleThreeLevel',
                }, {
                    name: 'Level Four Level',
                    value: 'levelRoleFourLevel',
                }, {
                    name: 'Level Five Level',
                    value: 'levelRoleFiveLevel',
                }, {
                    name: 'Level Six Level',
                    value: 'levelRoleSixLevel',
                }, {
                    name: 'Level Seven Level',
                    value: 'levelRoleSevenLevel',
                }, {
                    name: 'Level Eight Level',
                    value: 'levelRoleEightLevel',
                }, {
                    name: 'Level Nine Level',
                    value: 'levelRoleNineLevel',
                }, {
                    name: 'Level Ten Level',
                    value: 'levelRoleTenLevel',
                }))                
        .addStringOption((option) =>
            option.setName('value')
                .setDescription('The value to set for the configuration option'),
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
                await interaction.reply('You do not have the required permissions to run this command.');
                return;
            }

        } catch (error) {
            console.log(error);
            await interaction.reply('Error changing config.');
            return;
        }

        const option = interaction.options.getString('option');
        const valueStr = interaction.options.getString('value');
        let number;

        switch (option) {
            case 'levelRoleOneLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level One Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level One Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleTwoLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Two Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Two Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleThreeLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Three Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Three Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleFourLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Four Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Four Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleFiveLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Five Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Five Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'levelRoleSixLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Six Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Six Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleSevenLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Seven Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Seven Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleEightLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Eight Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Eight Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseFloat(valueStr);
                }

                break;
            case 'levelRoleNineLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Nine Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Nine Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
                }

                break;
            case 'levelRoleTenLevel':
                if (!valueStr) {
                    await interaction.reply({
                        content: 'Level Ten Level requires a <value> input.',
                        ephemeral: true,
                    });
                    return;
                } else if (isNaN(valueStr)) {
                    await interaction.reply({
                        content: 'Level Ten Level requires <value> to be a number input.',
                        ephemeral: true,
                    });
                    return;
                } else {
                    number = parseInt(valueStr);
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

            switch (option) {
                case 'levelRoleOneLevel':
                case 'levelRoleTwoLevel':
                case 'levelRoleThreeLevel':
                case 'levelRoleFourLevel':
                case 'levelRoleFiveLevel':
                case 'levelRoleSixLevel':
                case 'levelRoleSevenLevel':
                case 'levelRoleEightLevel':
                case 'levelRoleNineLevel':
                case 'levelRoleTenLevel':
                    config[option] = number;
                    break;
            }

            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

            if (valueStr) {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${valueStr}.`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `Configuration option \`${option}\` updated successfully to ${number}.`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.log(`Error updating configuration option: ${error}`);
            await interaction.reply({
                content: 'An error occurred while updating the configuration option.',
                ephemeral: true,
            });
        }
    },
};
