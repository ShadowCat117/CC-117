const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const axios = require('axios');
const createConfig = require('../../functions/create_config');
const fs = require('fs');
const path = require('path');
const database = require('../../database/database');
const messages = require('../../functions/messages');
const utilities = require('../../functions/utilities');
const GuildMemberPromotion = require('../../message_objects/GuildMemberPromotion');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkforpromotions')
        .setDescription(
            'Check your guild members to see who should be a higher rank.',
        ),
    ephemeral: false,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription(
                'Checking players that are eligible for promotions.',
            )
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
                await createConfig(interaction.client, guildId);

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
                .setDescription('Failed to check for promotions')
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

        const promotionExceptions = config['promotionExceptions'];

        const exemptUuids = Object.keys(promotionExceptions);

        let ignoreStrategists = false;
        let ignoreCaptains = false;
        let ignoreRecruiters = false;
        let ignoreRecruits = false;

        // If rank above has no promotion requirements then that rank can be skipped
        if (Object.keys(chiefPromotionRequirement).length === 0) {
            ignoreStrategists = true;
        }

        if (Object.keys(strategistPromotionRequirement).length === 0) {
            ignoreCaptains = true;
        }

        if (Object.keys(captainPromotionRequirement).length === 0) {
            ignoreRecruiters = true;
        }

        if (Object.keys(recruiterPromotionRequirement).length === 0) {
            ignoreRecruits = true;
        }

        const memberInfo = await database.getPromotionInfo(config.guild);

        let eligibleMembers = [];

        await utilities.waitForRateLimit();
        const response = await axios.get(
            `https://api.wynncraft.com/v3/guild/uuid/${config.guild}`,
        );

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

        // Owner and chiefs can't be demoted.
        // If there were no promotion requirements for a rank then skip that rank too.
        for (const rank in guildJson.members) {
            if (rank === 'total' || rank === 'owner' || rank === 'chief')
                continue;
            if (rank === 'strategist' && ignoreStrategists) continue;
            if (rank === 'captain' && ignoreCaptains) continue;
            if (rank === 'recruiter' && ignoreRecruiters) continue;
            if (rank === 'recruit' && ignoreRecruits) continue;

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
                        new GuildMemberPromotion(
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
                            promotionRequirements,
                            timeRequirements,
                            requirementsCount,
                        ),
                    );
                }
            }
        }

        eligibleMembers = eligibleMembers.filter((player) => player.promote);

        // Paginate if more than 10 players eligible for promotion
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
                        `${eligibleMembers.length} Players eligible for promotion`,
                    )
                    .setColor(0x00ffff);

                for (const player in page) {
                    const playerPromotion = page[player];

                    let reasons = '';

                    for (const reason of playerPromotion.reasons) {
                        reasons += `${reason}\n`;
                    }

                    pageEmbed.addFields({
                        name: `${playerPromotion.username} to ${playerPromotion.rankToPromote}`,
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
                    `${eligibleMembers.length} Players eligible for promotion`,
                )
                .setColor(0x00ffff);

            for (const player in eligibleMembers) {
                const playerPromotion = eligibleMembers[player];

                let reasons = '';

                for (const reason of playerPromotion.reasons) {
                    reasons += `${reason}\n`;
                }

                responseEmbed.addFields({
                    name: `${playerPromotion.username} to ${playerPromotion.rankToPromote}`,
                    value: `${reasons}`,
                });
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } else {
            responseEmbed
                .setTitle(
                    'No players in your guild are eligible for promotion.',
                )
                .setColor(0x999999);

            await interaction.editReply({ embeds: [responseEmbed] });
        }
    },
};
