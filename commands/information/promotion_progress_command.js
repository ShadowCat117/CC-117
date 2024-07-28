const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const promotionProgress = require('../../functions/promotion_progress');
const database = require('../../database/database');
const createConfig = require('../../functions/create_config');
const PromotionValue = require('../../values/PromotionValue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotionprogress')
        .setDescription(
            'Check how many requirements a player meets for their next guild rank.',
        )
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription(
                    'The name of the player you want to check promotion progress for.',
                )
                .setRequired(true),
        ),
    ephemeral: false,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

        const username = interaction.options
            .getString('username')
            .replaceAll('_', '\\_');

        const loadingEmbed = new EmbedBuilder()
            .setDescription(`Finding promotion progress for ${username}.`)
            .setColor(0x00ff00);

        await interaction.editReply({ embeds: [loadingEmbed] });

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

            const guildUuid = config.guild;

            if (!guildUuid) {
                const errorEmbed = new EmbedBuilder()
                    .setDescription(
                        'You have not set a guild, do so using /setguild',
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
            }

            const memberRoles = interaction.member.roles.cache;
            const memberOfRole = config.memberOfRole;

            const guildName = (await database.findGuild(guildUuid, true)).name;

            if (
                memberOfRole &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRole)
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(
                        `You must be a member of ${guildName} to run this command.`,
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const response = await promotionProgress(interaction);

            const responseEmbed = new EmbedBuilder();

            if (response.playerUuids !== undefined) {
                // Multiselector
                responseEmbed
                    .setTitle('Multiple players found')
                    .setDescription(
                        `More than 1 player has the identifier ${username}. Pick the intended player from the following.`,
                    )
                    .setColor(0x999999);

                const row = new ActionRowBuilder();

                for (let i = 0; i < response.playerUuids.length; i++) {
                    let responseValue = '';

                    const uuid = response.playerUuids[i];
                    const playerUsername = response.playerUsernames[
                        i
                    ].replaceAll('_', '\\_');
                    const rank = response.playerRanks[i];
                    const guildRank = response.playerGuildRanks[i];
                    const playerGuildName = response.playerGuildNames[i];

                    if (!rank && !playerGuildName) {
                        responseValue += `${i + 1}. ${playerUsername}.`;
                    } else if (!rank) {
                        responseValue += `${i + 1}. ${playerUsername}, ${guildRank} of ${playerGuildName}.`;
                    } else if (!playerGuildName) {
                        responseValue += `${i + 1}. ${playerUsername}, ${rank}.`;
                    } else {
                        responseValue += `${i + 1}. ${playerUsername}, ${rank} and ${guildRank} of ${playerGuildName}.`;
                    }

                    responseEmbed.addFields({
                        name: `Option ${i + 1}`,
                        value: `${responseValue} [View Profile](https://wynncraft.com/stats/player/${uuid})`,
                    });

                    const button = new ButtonBuilder()
                        .setCustomId(`promotion_progress:${uuid}`)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel((i + 1).toString());

                    row.addComponents(button);
                }

                await interaction.editReply({
                    components: [row],
                    embeds: [responseEmbed],
                });

                return;
            } else {
                if (response.username === '') {
                    // Unknown player
                    responseEmbed
                        .setTitle('Invalid username')
                        .setDescription(
                            `Unable to find a player using the name '${username}', try again using the exact player name.`,
                        )
                        .setColor(0xff0000);
                } else {
                    // Valid player
                    if (response.uuid) {
                        responseEmbed.setThumbnail(
                            `https://vzge.me/bust/512/${response.uuid}.png`,
                        );
                    }

                    if (response.unableToPromote) {
                        const reason = response.unableToPromote;

                        switch (reason) {
                            case 'error': // Some kind of error
                                responseEmbed.setDescription(
                                    'An error occured whilst checking for promotion progress.',
                                );
                                break;
                            case 'missing': // Not enough requirements given for the required count
                                responseEmbed.setDescription(
                                    'Missing values for promotions. Configuration has not been set up fully.',
                                );
                                break;
                            case 'guild': // Not in the set guild
                                responseEmbed.setDescription(
                                    `${response.username.replaceAll('_', '\\_')} is not a member of ${guildName}.`,
                                );
                                break;
                            case 'owner': // Owner can't be promoted
                                responseEmbed.setDescription(
                                    `${response.username.replaceAll('_', '\\_')} is the Owner of ${guildName}. They are unable to be promoted.`,
                                );
                                break;
                            case 'chief': // Chief can't be promoted by anyone other than owner
                                responseEmbed.setDescription(
                                    `${response.username.replaceAll('_', '\\_')} is a Chief of ${guildName}. Only the Owner can decide if they should be promoted.`,
                                );
                                break;
                            default: // Exempt from promotion
                                if (response.unableToPromote === -1) {
                                    responseEmbed.setDescription(
                                        `${response.username.replaceAll('_', '\\_')} is exempt from promotions forever.`,
                                    );
                                } else if (response.unableToPromote >= 0) {
                                    responseEmbed.setDescription(
                                        `${response.username.replaceAll('_', '\\_')} is exempt from promotion for ${response.unableToPromote} day${response.unableToPromote !== 1 ? 's' : ''}.`,
                                    );
                                }
                                break;
                        }

                        responseEmbed
                            .setTitle(response.username.replaceAll('_', '\\_'))
                            .setColor(0xff0000);
                    } else {
                        // Able to promote
                        responseEmbed
                            .setTitle(
                                `${response.guildRank} ${response.username.replaceAll('_', '\\_')} has ${response.metRequirements}/${response.requirementsCount} requirements for ${response.nextGuildRank}`,
                            )
                            .setDescription(
                                'First Days in Guild is required, anything else is optional as long as you meet the requirement.',
                            )
                            .setColor(0x00ffff);

                        const daysInGuildColour =
                            response.daysInGuild >= response.timeRequirement
                                ? '🟢'
                                : '🔴';

                        responseEmbed.addFields({
                            name: `${daysInGuildColour} Days in Guild`,
                            value: `${response.daysInGuild}/${response.timeRequirement}`,
                        });

                        for (const requirement of response.requirements) {
                            let requirementColour =
                                requirement.current >= requirement.required
                                    ? '🟢'
                                    : '🔴';

                            switch (requirement.promotionType) {
                                case PromotionValue.XP:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} XP Contributed`,
                                        value: `${requirement.current.toLocaleString()}/${requirement.required.toLocaleString()}`,
                                    });
                                    break;
                                case PromotionValue.LEVEL:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Highest Character Level`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                                case PromotionValue.TOP:
                                    requirementColour =
                                        requirement.current <=
                                        requirement.required
                                            ? '🟢'
                                            : '🔴';
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Contribution Position`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                                case PromotionValue.TIME:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Days in Guild`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                                case PromotionValue.WARS:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Wars Completed (Total)`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                                case PromotionValue.BUILD:
                                    requirementColour =
                                        requirement.current === 1 ? '🟢' : '🔴';
                                    responseEmbed.addFields({
                                        name: `${requirementColour} War Build`,
                                        value: `${requirement.current === 1 ? 'Has a war build' : 'Does not have a war build'}`,
                                    });
                                    break;
                                case PromotionValue.PLAYTIME:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Average Playtime per Week (hours)`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                                case PromotionValue.ECO:
                                    requirementColour =
                                        requirement.current === 1 ? '🟢' : '🔴';
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Eco`,
                                        value: `${requirement.current === 1 ? 'Knows/is learning eco' : 'Does not know/is not not learning eco'}`,
                                    });
                                    break;
                                default:
                                    responseEmbed.addFields({
                                        name: `${requirementColour} Unexpected promotion type ${requirement.promotionType}`,
                                        value: `${requirement.current}/${requirement.required}`,
                                    });
                                    break;
                            }
                        }
                    }
                }
            }

            await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error(error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Unable to view promotion progress')
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
