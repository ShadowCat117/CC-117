const {
    SlashCommandBuilder,
} = require('discord.js');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/database.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addinactivityexception')
        .setDescription('Adds a custom inactivity threshold for a player. Default length is forever.')
        .addStringOption(option =>
            option.setName('username')
            .setDescription('The name of the player you want to be have a custom inactivity threshold.')
            .setRequired(true))
        .addIntegerOption((option) =>
        option.setName('inactivity_threshold')
            .setDescription('What should their custom inactivity threshold be?')),
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

            const username = interaction.options.getString('username');
            let inactivityThreshold = interaction.options.getInteger('inactivity_threshold') ?? -1;

            if (inactivityThreshold < -1) {
                inactivityThreshold = -1;
            }

            return new Promise((resolve, reject) => {
                db.all(
                    'SELECT username FROM players WHERE username = ? AND guildName = ?', [username, guildName],
                    async (err, row) => {
                        if (err) {
                            console.error('Error retrieving player data:', err);
                            reject(err);
                            return;
                        }

                        if (row.length > 0) {
                            if (!config['inactivityExceptions']) {
                                config['inactivityExceptions'] = {};
                            }

                            if (config['inactivityExceptions'][username] === inactivityThreshold) {
                                if (inactivityThreshold === -1) {
                                    await interaction.editReply(`${username} is already exempt from inactivity`);
                                } else {
                                    await interaction.editReply(`${username}'s inactivity threshold is already ${inactivityThreshold}`);
                                }
                                
                                return;
                            }

                            config['inactivityExceptions'][username] = inactivityThreshold;

                            fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

                            if (inactivityThreshold === -1) {
                                await interaction.editReply(`${username} is now exempt from inactivity`);
                            } else {
                                await interaction.editReply(`${username}'s inactivity threshold is now ${inactivityThreshold}`);
                            }
                            return;
                        } else {
                            await interaction.editReply(`${username} is not a member of ${guildName}`);
                            return;
                        }
                    },
                );
            });
        } catch (error) {
            console.log(error);
            await interaction.editReply('Error adding inactivity exception.');
            return;
        }
    },
};
