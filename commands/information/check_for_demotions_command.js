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
const GuildMemberDemotion = require('../../message_objects/GuildMemberDemotion');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkfordemotions')
        .setDescription(
            'Check your guild members to see who should be a lower rank.',
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Checking players that are eligible for demotion.')
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
                .setDescription('Error checking for promotions')
                .setColor(0xff0000);
            await interaction.editReply({ embeds: [responseEmbed] });
            return;
        }

        const chiefPromotionRequirement = config.chiefPromotionRequirement;
        const chiefTimeRequirement = config.chiefTimeRequirement;
        const chiefRequirementsCount = config.chiefRequirementsCount;
        const strategistPromotionRequirement =
            config.strategistPromotionRequirement;
        const strategistTimeRequirement = config.strategistTimeRequirement;
        const strategistRequirementsCount = config.strategistRequirementsCount;
        const captainPromotionRequirement = config.captainPromotionRequirement;
        const captainTimeRequirement = config.captainTimeRequirement;
        const captainRequirementsCount = config.captainRequirementsCount;
        const recruiterPromotionRequirement =
            config.recruiterPromotionRequirement;
        const recruiterTimeRequirement = config.recruiterTimeRequirement;
        const recruiterRequirementsCount = config.recruiterRequirementsCount;
        const verifiedRole = interaction.guild.roles.cache.get(
            config['verifiedRole'],
        );
        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
        const healerRole = interaction.guild.roles.cache.get(
            config['healerRole'],
        );
        const damageRole = interaction.guild.roles.cache.get(
            config['damageRole'],
        );
        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);

        const promotionRequirements = [
            chiefPromotionRequirement,
            strategistPromotionRequirement,
            captainPromotionRequirement,
            recruiterPromotionRequirement,
        ];
        const timeRequirements = [
            chiefTimeRequirement,
            strategistTimeRequirement,
            captainTimeRequirement,
            recruiterTimeRequirement,
        ];
        const requirementsCount = [
            chiefRequirementsCount,
            strategistRequirementsCount,
            captainRequirementsCount,
            recruiterRequirementsCount,
        ];
        const warBuildRoles = [tankRole, healerRole, damageRole, soloRole];

        const demotionExceptions = config['demotionExceptions'];

        const exemptUuids = Object.keys(demotionExceptions);

        let ignoreChiefs = false;
        let ignoreStrategists = false;
        let ignoreCaptains = false;
        let ignoreRecruiters = false;

        // If any of the ranks do not have promotion requirements set then we can ignore those players
        if (Object.keys(chiefPromotionRequirement).length === 0) {
            ignoreChiefs = true;
        }

        if (Object.keys(strategistPromotionRequirement).length === 0) {
            ignoreStrategists = true;
        }

        if (Object.keys(captainPromotionRequirement).length === 0) {
            ignoreCaptains = true;
        }

        if (Object.keys(recruiterPromotionRequirement).length === 0) {
            ignoreRecruiters = true;
        }

        const memberInfo = await database.getPromotionInfo(config.guild);

        let eligibleMembers = [];

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

        // Owner and recruits can't be demoted.
        // If there were no promotion requirements for a rank then skip that rank too.
        for (const rank in guildJson.members) {
            if (rank === 'total' || rank === 'owner' || rank === 'recruit')
                continue;
            if (rank === 'chief' && ignoreChiefs) continue;
            if (rank === 'strategist' && ignoreStrategists) continue;
            if (rank === 'captain' && ignoreCaptains) continue;
            if (rank === 'recruiter' && ignoreRecruiters) continue;

            const rankMembers = guildJson.members[rank];

            for (const member in rankMembers) {
                const guildMember = rankMembers[member];

                if (!exemptUuids.includes(guildMember.uuid)) {
                    const serverMember = await utilities.findDiscordUser(
                        interaction.guild.members.cache.values(),
                        member,
                    );

                    let hasVerifiedRole = false;
                    let hasBuildRole = false;
                    let hasEcoRole = false;

                    if (serverMember) {
                        const memberRoles = serverMember.roles.cache;

                        for (const role of memberRoles.values()) {
                            if (role === verifiedRole) {
                                hasVerifiedRole = true;
                            } else if (role === ecoRole) {
                                hasEcoRole = true;
                            } else if (warBuildRoles.includes(role)) {
                                hasBuildRole = true;
                            }

                            if (hasVerifiedRole && hasBuildRole && hasEcoRole) {
                                break;
                            }
                        }
                    }

                    let wars = 0;
                    let highestCharacterLevel = 1;
                    let averagePlaytime = 0;

                    for (const info of memberInfo) {
                        if (info.uuid === guildMember.uuid) {
                            wars = info.wars;
                            highestCharacterLevel = info.highestCharacterLevel;

                            if (info.averagePlaytime === -1) {
                                averagePlaytime = info.weeklyPlaytime;

                                // If in an active session, add current sessions playtime
                                if (info.sessionStart) {
                                    const now = new Date();
                                    const sessionStart = new Date(
                                        info.sessionStart,
                                    );
                                    const sessionDurationHours =
                                        (now - sessionStart) / (1000 * 60 * 60);

                                    averagePlaytime += sessionDurationHours;
                                }
                            } else {
                                averagePlaytime = info.averagePlaytime;
                            }

                            break;
                        }
                    }

                    const daysInGuild = utilities.daysSince(guildMember.joined);

                    eligibleMembers.push(
                        new GuildMemberDemotion(
                            member,
                            rank,
                            guildMember.contributed,
                            highestCharacterLevel,
                            guildMember.contributionRank,
                            daysInGuild,
                            wars,
                            hasBuildRole,
                            averagePlaytime,
                            hasEcoRole,
                            hasVerifiedRole,
                            promotionRequirements,
                            timeRequirements,
                            requirementsCount,
                        ),
                    );
                }
            }
        }

        eligibleMembers = eligibleMembers.filter((player) => player.demote);

        // Paginate if more than 10 players are eligible for demotion
        if (eligibleMembers.length > 10) {
            const embeds = [];
            const row = new ActionRowBuilder();

            const pages = [];
            for (let i = 0; i < eligibleMembers.length; i += 10) {
                pages.push(eligibleMembers.slice(i, i + 10));
            }

            for (const page of pages) {
                const pageEmbed = new EmbedBuilder();

                pageEmbed
                    .setTitle(
                        `${eligibleMembers.length} Players eligible for demotion`,
                    )
                    .setDescription(
                        'Met/required requirements shown after rank to be demoted to unless not met hard time requirement. Missing requirements listed below.',
                    )
                    .setColor(0x00ffff);

                for (const player in page) {
                    const playerDemotion = page[player];

                    let reasons = '';

                    for (const reason of playerDemotion.reasons) {
                        reasons += `${reason}\n`;
                    }

                    let progress = '';

                    if (playerDemotion.metRequirements) {
                        progress = ` (${playerDemotion.metRequirements}/${playerDemotion.requirementsCount})`;
                    }

                    pageEmbed.addFields({
                        name: `${playerDemotion.username} to ${playerDemotion.rankToDemote}${progress}`,
                        value: `${reasons}`,
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
        } else if (eligibleMembers.length > 0) {
            responseEmbed
                .setTitle(
                    `${eligibleMembers.length} Players eligible for demotion`,
                )
                .setDescription(
                    'Met/required requirements shown after rank to be demoted to unless not met hard time requirement. Missing requirements listed below.',
                )
                .setColor(0x00ffff);

            for (const player in eligibleMembers) {
                const playerDemotion = eligibleMembers[player];

                let reasons = '';

                for (const reason of playerDemotion.reasons) {
                    reasons += `${reason}\n`;
                }

                let progress = '';

                if (playerDemotion.metRequirements) {
                    progress = ` (${playerDemotion.metRequirements}/${playerDemotion.requirementsCount})`;
                }

                responseEmbed.addFields({
                    name: `${playerDemotion.username} to ${playerDemotion.rankToDemote}${progress}`,
                    value: `${reasons}`,
                });
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } else {
            responseEmbed
                .setTitle('No players in your guild are eligible for demotion.')
                .setColor(0x999999);

            await interaction.editReply({ embeds: [responseEmbed] });
        }
    },
};
