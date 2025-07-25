const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const axios = require('axios');
const configUtils = require('../../functions/config_utils');
const fs = require('fs');
const path = require('path');
const database = require('../../database/database');
const messages = require('../../functions/messages');
const utilities = require('../../functions/utilities');
const PagedMessage = require('../../message_objects/PagedMessage');
const InactiveMember = require('../../message_objects/InactiveMember');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkforinactivity')
        .setDescription(
            'Check your guild members to see who should be kicked for inactivity.',
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Checking for inactive players.')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );
        let config = {};

        const responseEmbed = new EmbedBuilder();

        try {
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            } else {
                await configUtils.createConfig(interaction.client, guildId);

                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            const adminRoleId = config.adminRole;
            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }

            if (!config.guild) {
                responseEmbed
                    .setTitle('Error')
                    .setDescription(
                        'The server you are in does not have a guild set.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [responseEmbed] });
                return;
            }
        } catch (error) {
            console.error(error);
            responseEmbed
                .setTitle('Error')
                .setDescription('Failed to check for inactivity.')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const chiefUpperThreshold = config.chiefUpperThreshold;
        const chiefLowerThreshold = config.chiefLowerThreshold;
        const strategistUpperThreshold = config.strategistUpperThreshold;
        const strategistLowerThreshold = config.strategistLowerThreshold;
        const captainUpperThreshold = config.captainUpperThreshold;
        const captainLowerThreshold = config.captainLowerThreshold;
        const recruiterUpperThreshold = config.recruiterUpperThreshold;
        const recruiterLowerThreshold = config.recruiterLowerThreshold;
        const recruitUpperThreshold = config.recruitUpperThreshold;
        const recruitLowerThreshold = config.recruitLowerThreshold;
        const levelRequirement = config.levelRequirement;
        const extraTimeIncrease = config.extraTimeIncrease;
        const averageRequirement = config.averageRequirement;
        const newPlayerMinimumTime = config.newPlayerMinimumTime;
        const newPlayerThreshold = config.newPlayerThreshold;
        const memberThreshold = config.memberThreshold;
        const averageActivityRequirement = config.averageActivityRequirement;
        const memberActivityThreshold = config.memberActivityThreshold;
        const inactivityExceptions = config.inactivityExceptions;

        const playerLastLogins = await database.getLastLogins(config.guild, []);

        const exemptUuids = Object.keys(inactivityExceptions);

        await utilities.waitForRateLimit();

        let response;

        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/guild/uuid/${config.guild}`,
            );
        } catch (error) {
            responseEmbed
                .setTitle('Error')
                .setDescription(
                    'Failed to fetch guild information from the API, it may be down.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        utilities.updateRateLimit(
            response.headers['ratelimit-remaining'],
            response.headers['ratelimit-reset'],
        );
        const guildJson = response.data;

        if (!guildJson || !guildJson.name) {
            responseEmbed
                .setTitle('Error')
                .setDescription(
                    'Failed to fetch guild information from the API, it may be down.',
                )
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const memberSlots = utilities.calculateMemberSlots(guildJson.level);

        const averageOnline = await database.getGuildActivity(guildJson.uuid);

        const chiefThreshold =
            averageOnline < averageRequirement ||
            guildJson.members.total < (memberThreshold / 100) * memberSlots
                ? chiefLowerThreshold
                : chiefUpperThreshold;
        const strategistThreshold =
            averageOnline < averageRequirement ||
            guildJson.members.total < (memberThreshold / 100) * memberSlots
                ? strategistLowerThreshold
                : strategistUpperThreshold;
        const captainThreshold =
            averageOnline < averageRequirement ||
            guildJson.members.total < (memberThreshold / 100) * memberSlots
                ? captainLowerThreshold
                : captainUpperThreshold;
        const recruiterThreshold =
            averageOnline < averageRequirement ||
            guildJson.members.total < (memberThreshold / 100) * memberSlots
                ? recruiterLowerThreshold
                : recruiterUpperThreshold;
        const recruitThreshold =
            averageOnline < averageRequirement ||
            guildJson.members.total < (memberThreshold / 100) * memberSlots
                ? recruitLowerThreshold
                : recruitUpperThreshold;

        const inactiveMembers = [];

        for (const rank in guildJson.members) {
            if (rank === 'total' || rank === 'owner') continue; // Ignore owner

            const rankMembers = guildJson.members[rank];

            for (const member in rankMembers) {
                const guildMember = rankMembers[member];

                for (const lastLoginInfo of playerLastLogins) {
                    if (lastLoginInfo.online) continue;

                    if (lastLoginInfo.uuid === guildMember.uuid) {
                        const daysSinceLastLogin = utilities.daysSince(
                            lastLoginInfo.lastLogin,
                        );
                        let inactivityThreshold;

                        if (exemptUuids.includes(guildMember.uuid)) {
                            if (inactivityExceptions[guildMember.uuid] === -1) {
                                // Exempt forever
                                break;
                            } else {
                                // Use custom inactivity
                                inactivityThreshold =
                                    inactivityExceptions[guildMember.uuid];
                            }
                        } else {
                            // Use inactivity based on rank
                            switch (rank) {
                                case 'chief': {
                                    inactivityThreshold = chiefThreshold;
                                    break;
                                }
                                case 'strategist': {
                                    inactivityThreshold = strategistThreshold;
                                    break;
                                }
                                case 'captain': {
                                    inactivityThreshold = captainThreshold;
                                    break;
                                }
                                case 'recruiter': {
                                    inactivityThreshold = recruiterThreshold;
                                    break;
                                }
                                case 'recruit': {
                                    inactivityThreshold = recruitThreshold;
                                    break;
                                }
                            }

                            if (
                                lastLoginInfo.highestClassLevel >=
                                levelRequirement
                            ) {
                                inactivityThreshold *=
                                    1 + extraTimeIncrease / 100;
                            }
                        }

                        const daysInGuild = utilities.daysSince(
                            guildMember.joined,
                        );

                        if (daysInGuild < newPlayerMinimumTime) {
                            inactivityThreshold = newPlayerThreshold;
                        }

                        const averagePlaytime =
                            await database.getAveragePlaytime(guildMember.uuid);
                        const weeklyPlaytime = await database.getWeeklyPlaytime(
                            guildMember.uuid,
                        );

                        if (daysSinceLastLogin > inactivityThreshold) {
                            inactiveMembers.push(
                                new InactiveMember(
                                    member,
                                    rank,
                                    daysSinceLastLogin,
                                    averagePlaytime,
                                    weeklyPlaytime,
                                    inactivityExceptions[guildMember.uuid],
                                ),
                            );
                        } else if (
                            daysInGuild >= memberActivityThreshold &&
                            averagePlaytime < averageActivityRequirement
                        ) {
                            inactiveMembers.push(
                                new InactiveMember(
                                    member,
                                    rank,
                                    daysSinceLastLogin,
                                    averagePlaytime,
                                    weeklyPlaytime,
                                    inactivityExceptions[guildMember.uuid],
                                ),
                            );
                        }

                        break;
                    }
                }
            }
        }

        // Paginate if more than 5 members.
        // More than 5 can be displayed but due to the large description, 5 looks better.
        if (inactiveMembers.length > 5) {
            const embeds = [];
            const row = new ActionRowBuilder();

            const pages = [];
            for (let i = 0; i < inactiveMembers.length; i += 5) {
                pages.push(inactiveMembers.slice(i, i + 5));
            }

            for (const page of pages) {
                const pageEmbed = new EmbedBuilder();

                pageEmbed
                    .setTitle(`${inactiveMembers.length} Inactive Players`)
                    .setDescription(
                        `Chiefs are inactive after ${chiefThreshold} day${chiefThreshold !== 1 ? 's' : ''}.\nStrategists are inactive after ${strategistThreshold} day${strategistThreshold !== 1 ? 's' : ''}.\nCaptains are inactive after ${captainThreshold} day${captainThreshold !== 1 ? 's' : ''}.\nRecruiters are inactive after ${recruiterThreshold} day${recruiterThreshold !== 1 ? 's' : ''}.\nRecruits are inactive after ${recruitThreshold} day${recruitThreshold !== 1 ? 's' : ''}.\n\nPlayers who have been in the guild for more than ${memberActivityThreshold} day${memberActivityThreshold !== 1 ? 's' : ''} must have an average weekly playtime of at least ${averageActivityRequirement} hour${averageActivityRequirement !== 1 ? 's' : ''} to not be marked as inactive.\n\nThese values change based on if the average guild activity is above or below ${averageRequirement} player${averageRequirement !== 1 ? 's' : ''} or if less than ${memberThreshold}% of the member slots are used.\nIndividual players can have their threshold adjusted by having a character over level ${levelRequirement} for a ${extraTimeIncrease}% increase.\n\nPlayers in the guild for less than ${newPlayerMinimumTime} day${newPlayerMinimumTime !== 1 ? 's' : ''} get a threshold of ${newPlayerThreshold} day${newPlayerThreshold !== 1 ? 's' : ''}.`,
                    )
                    .setColor(0x00ffff);

                for (const player in page) {
                    const inactivePlayer = page[player];

                    let username = inactivePlayer.username;

                    if (inactivePlayer.threshold !== -1) {
                        username += ` (${inactivePlayer.threshold} day${inactivePlayer.threshold !== 1 ? 's' : ''})`;
                    }

                    pageEmbed.addFields({
                        name: `${username}`,
                        value: `${inactivePlayer.guildRank}\nInactive for ${inactivePlayer.daysSinceLastLogin} day${inactivePlayer.daysSinceLastLogin !== 1 ? 's' : ''}\nAverage weekly playtime: ${inactivePlayer.averagePlaytime} hour${inactivePlayer.averagePlaytime !== 1 ? 's' : ''}\nCurrent week playtime: ${inactivePlayer.weeklyPlaytime} hour${inactivePlayer.weeklyPlaytime !== 1 ? 's' : ''}`,
                    });
                }

                embeds.push(pageEmbed);
            }

            messages.addMessage(message.id, new PagedMessage(message, embeds));

            const previousPage = new ButtonBuilder()
                .setCustomId('previous')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬅️');

            const nextPage = new ButtonBuilder()
                .setCustomId('next')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️');

            row.addComponents(previousPage, nextPage);

            await interaction.editReply({
                embeds: [embeds[0]],
                components: [row],
            });
        } else if (inactiveMembers.length > 0) {
            responseEmbed
                .setTitle(`${inactiveMembers.length} Inactive players`)
                .setDescription(
                    `Chiefs are inactive after ${chiefThreshold} day${chiefThreshold !== 1 ? 's' : ''}.\nStrategists are inactive after ${strategistThreshold} day${strategistThreshold !== 1 ? 's' : ''}.\nCaptains are inactive after ${captainThreshold} day${captainThreshold !== 1 ? 's' : ''}.\nRecruiters are inactive after ${recruiterThreshold} day${recruiterThreshold !== 1 ? 's' : ''}.\nRecruits are inactive after ${recruitThreshold} day${recruitThreshold !== 1 ? 's' : ''}.\n\nPlayers who have been in the guild for more than ${memberActivityThreshold} day${memberActivityThreshold !== 1 ? 's' : ''} must have an average weekly playtime of at least ${averageActivityRequirement} hour${averageActivityRequirement !== 1 ? 's' : ''} to not be marked as inactive.\n\nThese values change based on if the average guild activity is above or below ${averageRequirement} player${averageRequirement !== 1 ? 's' : ''} or if less than ${memberThreshold}% of the member slots are used.\nIndividual players can have their threshold adjusted by having a character over level ${levelRequirement} for a ${extraTimeIncrease}% increase.\n\nPlayers in the guild for less than ${newPlayerMinimumTime} day${newPlayerMinimumTime !== 1 ? 's' : ''} get a threshold of ${newPlayerThreshold} day${newPlayerThreshold !== 1 ? 's' : ''}.`,
                )
                .setColor(0x00ffff);

            for (const player in inactiveMembers) {
                const inactivePlayer = inactiveMembers[player];

                let username = inactivePlayer.username;

                if (inactivePlayer.threshold !== -1) {
                    username += ` (${inactivePlayer.threshold} day${inactivePlayer.threshold !== 1 ? 's' : ''})`;
                }

                responseEmbed.addFields({
                    name: `${username}`,
                    value: `${inactivePlayer.guildRank}\nInactive for ${inactivePlayer.daysSinceLastLogin} day${inactivePlayer.daysSinceLastLogin !== 1 ? 's' : ''}\nAverage weekly playtime: ${inactivePlayer.averagePlaytime} hour${inactivePlayer.averagePlaytime !== 1 ? 's' : ''}\nCurrent week playtime: ${inactivePlayer.weeklyPlaytime} hour${inactivePlayer.weeklyPlaytime !== 1 ? 's' : ''}`,
                });
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } else {
            responseEmbed
                .setTitle(
                    'No players in your guild have been inactive for too long.',
                )
                .setColor(0x999999);

            await interaction.editReply({ embeds: [responseEmbed] });
        }
    },
};
