const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const configUtils = require('../../functions/config_utils');
const messages = require('../../functions/messages');
const database = require('../../database/database');
const PagedMessage = require('../../message_objects/PagedMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewconfig')
        .setDescription('View the config in a user friendly format.'),
    ephemeral: true,
    async execute(interaction) {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('Loading config')
            .setColor(0x00ff00);

        const message = await interaction.editReply({ embeds: [loadingEmbed] });

        const title = `${interaction.guild.toString().replaceAll('_', '\\_')}'s Config\n\n`;
        const embeds = [];

        const guildId = interaction.guild.id;
        const filePath = path.join(
            __dirname,
            '..',
            '..',
            'configs',
            `${guildId}.json`,
        );

        try {
            let config = {};

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
            const memberOfRoleId = config.memberOfRole;

            const guildUuid = config.guild;

            if (!guildUuid) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('No Guild Set')
                    .setDescription(
                        'The server you are in does not have a guild set.',
                    )
                    .setColor(0xff0000);

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            let guildName;

            if (guildUuid) {
                guildName = (await database.findGuild(guildUuid, true)).name;
            }

            if (
                guildName &&
                memberOfRoleId &&
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(memberOfRoleId)
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

            if (
                interaction.member.id !== interaction.member.guild.ownerId &&
                !memberRoles.has(adminRoleId) &&
                interaction.member.roles.highest.position <
                    interaction.guild.roles.cache.get(adminRoleId).position
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setDescription(
                        'You do not have the required permissions to run this command.',
                    )
                    .setColor(0xff0000);
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const logChannel = interaction.guild.channels.cache.get(
                config['logChannel'],
            );
            const joinLeaveChannel = interaction.guild.channels.cache.get(
                config['joinLeaveChannel'],
            );

            let pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Guild: ${config['guild']} (${guildName})
                    Update roles hourly: ${config['updateRoles']}
                    Log messages: ${config['logMessages']}
                    Send join/leave messages: ${config['sendJoinLeaveMessages']}
                    Add guild prefixes: ${config['addGuildPrefixes']}
                    Check for banned players in guild: ${config['checkBannedPlayers']}
                    Log Channel: ${logChannel}
                    Join/Leave Channel: ${joinLeaveChannel}
                    `,
                );

            embeds.push(pageEmbed);

            const adminRole = interaction.guild.roles.cache.get(adminRoleId);
            const ownerRole = interaction.guild.roles.cache.get(
                config['ownerRole'],
            );
            const chiefRole = interaction.guild.roles.cache.get(
                config['chiefRole'],
            );
            const strategistRole = interaction.guild.roles.cache.get(
                config['strategistRole'],
            );
            const captainRole = interaction.guild.roles.cache.get(
                config['captainRole'],
            );
            const recruiterRole = interaction.guild.roles.cache.get(
                config['recruiterRole'],
            );
            const recruitRole = interaction.guild.roles.cache.get(
                config['recruitRole'],
            );
            const memberOfRole = interaction.guild.roles.cache.get(
                config['memberOfRole'],
            );
            const allyOwnerRole = interaction.guild.roles.cache.get(
                config['allyOwnerRole'],
            );
            const allyRole = interaction.guild.roles.cache.get(
                config['allyRole'],
            );
            const championRole = interaction.guild.roles.cache.get(
                config['championRole'],
            );
            const heroRole = interaction.guild.roles.cache.get(
                config['heroRole'],
            );
            const vipPlusRole = interaction.guild.roles.cache.get(
                config['vipPlusRole'],
            );
            const vipRole = interaction.guild.roles.cache.get(
                config['vipRole'],
            );
            const veteranRole = interaction.guild.roles.cache.get(
                config['veteranRole'],
            );
            const administratorRole = interaction.guild.roles.cache.get(
                config['administratorRole'],
            );
            const moderatorRole = interaction.guild.roles.cache.get(
                config['moderatorRole'],
            );
            const contentTeamRole = interaction.guild.roles.cache.get(
                config['contentTeamRole'],
            );
            const verifiedRole = interaction.guild.roles.cache.get(
                config['verifiedRole'],
            );
            const unverifiedRole = interaction.guild.roles.cache.get(
                config['unverifiedRole'],
            );
            const giveawayRole = interaction.guild.roles.cache.get(
                config['giveawayRole'],
            );
            const eventsRole = interaction.guild.roles.cache.get(
                config['eventsRole'],
            );
            const bombBellRole = interaction.guild.roles.cache.get(
                config['bombBellRole'],
            );
            const guildRaidRole = interaction.guild.roles.cache.get(
                config['guildRaidRole'],
            );
            const annihilationRole = interaction.guild.roles.cache.get(
                config['annihilationRole'],
            );

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Admin Role: ${adminRole}
                    Owner Role: ${ownerRole}
                    Chief Role: ${chiefRole}
                    Strategist Role: ${strategistRole}
                    Captain Role: ${captainRole}
                    Recruiter Role: ${recruiterRole}
                    Recruit Role: ${recruitRole}
                    Member of Guild Role: ${memberOfRole}
                    Ally Owner Role: ${allyOwnerRole}
                    Ally Role: ${allyRole}
                    Champion Role: ${championRole}
                    Hero Role: ${heroRole}
                    VIP+ Role: ${vipPlusRole}
                    VIP Role: ${vipRole}
                    Veteran Role: ${veteranRole}
                    Wynn Admin Role: ${administratorRole}
                    Wynn Mod Role: ${moderatorRole}
                    Wynn CT Role: ${contentTeamRole}
                    Verified Role: ${verifiedRole}
                    Unverified Role: ${unverifiedRole}
                    Giveaway Role: ${giveawayRole}
                    Events Role: ${eventsRole}
                    Bomb Bell Role: ${bombBellRole}
                    Guild Raid Role: ${guildRaidRole}
                    Annihilation Role: ${annihilationRole}
                    `,
                );

            embeds.push(pageEmbed);

            const warRole = interaction.guild.roles.cache.get(
                config['warRole'],
            );
            const tankRole = interaction.guild.roles.cache.get(
                config['tankRole'],
            );
            const healerRole = interaction.guild.roles.cache.get(
                config['healerRole'],
            );
            const damageRole = interaction.guild.roles.cache.get(
                config['damageRole'],
            );
            const soloRole = interaction.guild.roles.cache.get(
                config['soloRole'],
            );
            const ecoRole = interaction.guild.roles.cache.get(
                config['ecoRole'],
            );
            const warPingRole = interaction.guild.roles.cache.get(
                config['warPingRole'],
            );

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    War Role: ${warRole}
                    Tank Role: ${tankRole}
                    Healer Role: ${healerRole}
                    Damage Role: ${damageRole}
                    Solo Role: ${soloRole}
                    Eco Role: ${ecoRole}
                    War Ping Role: ${warPingRole}
                    War Level Requirement: ${config['warLevelRequirement']}
                    `,
                );

            embeds.push(pageEmbed);

            const archerRole = interaction.guild.roles.cache.get(
                config['archerRole'],
            );
            const boltslingerRole = interaction.guild.roles.cache.get(
                config['boltslingerRole'],
            );
            const sharpshooterRole = interaction.guild.roles.cache.get(
                config['sharpshooterRole'],
            );
            const trapperRole = interaction.guild.roles.cache.get(
                config['trapperRole'],
            );
            const warriorRole = interaction.guild.roles.cache.get(
                config['warriorRole'],
            );
            const fallenRole = interaction.guild.roles.cache.get(
                config['fallenRole'],
            );
            const battleMonkRole = interaction.guild.roles.cache.get(
                config['battleMonkRole'],
            );
            const paladinRole = interaction.guild.roles.cache.get(
                config['paladinRole'],
            );
            const assassinRole = interaction.guild.roles.cache.get(
                config['assassinRole'],
            );
            const shadestepperRole = interaction.guild.roles.cache.get(
                config['shadestepperRole'],
            );
            const tricksterRole = interaction.guild.roles.cache.get(
                config['tricksterRole'],
            );
            const acrobatRole = interaction.guild.roles.cache.get(
                config['acrobatRole'],
            );
            const mageRole = interaction.guild.roles.cache.get(
                config['mageRole'],
            );
            const riftwalkerRole = interaction.guild.roles.cache.get(
                config['riftwalkerRole'],
            );
            const lightBenderRole = interaction.guild.roles.cache.get(
                config['lightBenderRole'],
            );
            const arcanistRole = interaction.guild.roles.cache.get(
                config['arcanistRole'],
            );
            const shamanRole = interaction.guild.roles.cache.get(
                config['shamanRole'],
            );
            const summonerRole = interaction.guild.roles.cache.get(
                config['summonerRole'],
            );
            const ritualistRole = interaction.guild.roles.cache.get(
                config['ritualistRole'],
            );
            const acolyteRole = interaction.guild.roles.cache.get(
                config['acolyteRole'],
            );

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Archer Role: ${archerRole}
                    Boltslinger Role: ${boltslingerRole}
                    Sharpshooter Role: ${sharpshooterRole}
                    Trapper Role: ${trapperRole}
                    Warrior Role: ${warriorRole}
                    Fallen Role: ${fallenRole}
                    Battle Monk Role: ${battleMonkRole}
                    Paladin Role: ${paladinRole}
                    Assassin Role: ${assassinRole}
                    Shadestepper Role: ${shadestepperRole}
                    Trickster Role: ${tricksterRole}
                    Acrobat Role: ${acrobatRole}
                    Mage Role: ${mageRole}
                    Riftwalker Role: ${riftwalkerRole}
                    Light Bender Role: ${lightBenderRole}
                    Arcanist Role: ${arcanistRole}
                    Shaman Role: ${shamanRole}
                    Summoner Role: ${summonerRole}
                    Ritualist Role: ${ritualistRole}
                    Acolyte Role: ${acolyteRole}
                    `,
                );

            embeds.push(pageEmbed);

            if (Object.keys(config['levelRoles']).length > 20) {
                const pages = [];
                for (
                    let i = 0;
                    i < Object.keys(config['levelRoles']).length;
                    i += 20
                ) {
                    pages.push(
                        Object.keys(config['levelRoles']).slice(i, i + 20),
                    );
                }

                for (const page of pages) {
                    pageEmbed = new EmbedBuilder()
                        .setTitle(`${title}`)
                        .setColor(0x00ffff);

                    let description = '';

                    for (const level of page) {
                        const levelRole = interaction.guild.roles.cache.get(
                            config['levelRoles'][level],
                        );
                        description += `Level ${level} role: ${levelRole}\n`;
                    }

                    pageEmbed.setDescription(`${description}`);

                    embeds.push(pageEmbed);
                }
            } else {
                pageEmbed = new EmbedBuilder()
                    .setTitle(`${title}`)
                    .setColor(0x00ffff);

                let description = '';

                for (const level of Object.keys(config['levelRoles'])) {
                    const levelRole = interaction.guild.roles.cache.get(
                        config['levelRoles'][level],
                    );
                    description += `Level ${level} role: ${levelRole}\n`;
                }

                pageEmbed.setDescription(`${description}`);

                embeds.push(pageEmbed);
            }

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Join Message:
                    ${config['joinMessage'].replace(/\\n/g, '\n').replace('$user$', interaction.member.user)}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Leave Message:
                    ${config['leaveMessage'].replace(/\\n/g, '\n').replace('$user$', interaction.member.user.username)}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    War Message:
                    ${config['warMessage'].replace(/\\n/g, '\n')}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    War Class Message:
                    ${config['warClassMessage'].replace(/\\n/g, '\n')}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Class Message:
                    ${config['classMessage'].replace(/\\n/g, '\n')}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Class Archetype Message:
                    ${config['classArchetypeMessage'].replace(/\\n/g, '\n')}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Guild Events Message:
                    ${config['roleMessage'].replace(/\\n/g, '\n')}
                    `,
                );

            embeds.push(pageEmbed);

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    Chief Inactivity Upper Threshold: ${config['chiefUpperThreshold']}
                    Chief Inactivity Lower Threshold: ${config['chiefLowerThreshold']}
                    Strategist Inactivity Upper Threshold: ${config['strategistUpperThreshold']}
                    Strategist Inactivity Lower Threshold: ${config['strategistLowerThreshold']}
                    Captain Inactivity Upper Threshold: ${config['captainUpperThreshold']}
                    Captain Inactivity Lower Threshold: ${config['captainLowerThreshold']}
                    Recruiter Inactivity Upper Threshold: ${config['recruiterUpperThreshold']}
                    Recruiter Inactivity Lower Threshold: ${config['recruiterLowerThreshold']}
                    Recruit Inactivity Upper Threshold: ${config['recruitUpperThreshold']}
                    Recruit Inactivity Lower Threshold: ${config['recruitLowerThreshold']}
                    Average Online Requirement: ${config['averageRequirement']}
                    Member Slots % Filled Threshold: ${config['memberThreshold']}
                    Extra Time Level Requirement: ${config['levelRequirement']}
                    Extra Time % Increase: ${config['extraTimeIncrease']}
                    New Player Qualification: ${config['newPlayerMinimumTime']}
                    New Player Threshold: ${config['newPlayerThreshold']}
                    Average Activity Requirement: ${config['averageActivityRequirement']}
                    Member Activity Threshold: ${config['memberActivityThreshold']}
                    `,
                );

            embeds.push(pageEmbed);

            let chiefPromotionRequirements = 'Chief Promotion Requirements:';

            for (const requirement of Object.keys(
                config['chiefPromotionRequirement'],
            )) {
                switch (requirement) {
                    case 'XP': {
                        chiefPromotionRequirements += `\nContributed XP: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'LEVEL': {
                        chiefPromotionRequirements += `\nHighest Character Level: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TOP': {
                        chiefPromotionRequirements += `\nContribution Pos: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TIME': {
                        chiefPromotionRequirements += `\nTime in Guild: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'WARS': {
                        chiefPromotionRequirements += `\nWars Participated: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'BUILD': {
                        chiefPromotionRequirements += '\nHas war build';
                        break;
                    }
                    case 'PLAYTIME': {
                        chiefPromotionRequirements += `\nAverage Weekly Playtime: ${config['chiefPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'ECO': {
                        chiefPromotionRequirements += '\nKnows eco';
                        break;
                    }
                    case 'VERIFIED': {
                        chiefPromotionRequirements += '\nIs verified';
                        break;
                    }
                }
            }

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    ${chiefPromotionRequirements}
                    Chief Time in Guild Requirement: ${config['chiefTimeRequirement']}
                    Chief Met Requirements Required: ${config['chiefRequirementsCount']}
                    `,
                );

            embeds.push(pageEmbed);

            let strategistPromotionRequirements =
                'Strategist Promotion Requirements:';

            for (const requirement of Object.keys(
                config['strategistPromotionRequirement'],
            )) {
                switch (requirement) {
                    case 'XP': {
                        strategistPromotionRequirements += `\nContributed XP: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'LEVEL': {
                        strategistPromotionRequirements += `\nHighest Character Level: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TOP': {
                        strategistPromotionRequirements += `\nContribution Pos: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TIME': {
                        strategistPromotionRequirements += `\nTime in Guild: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'WARS': {
                        strategistPromotionRequirements += `\nWars Participated: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'BUILD': {
                        strategistPromotionRequirements += '\nHas war build';
                        break;
                    }
                    case 'PLAYTIME': {
                        strategistPromotionRequirements += `\nAverage Weekly Playtime: ${config['strategistPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'ECO': {
                        strategistPromotionRequirements += '\nKnows eco';
                        break;
                    }
                    case 'VERIFIED': {
                        strategistPromotionRequirements += '\nIs verified';
                        break;
                    }
                }
            }

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    ${strategistPromotionRequirements}
                    Strategist Time in Guild Requirement: ${config['strategistTimeRequirement']}
                    Strategist Met Requirements Required: ${config['strategistRequirementsCount']}
                    `,
                );

            embeds.push(pageEmbed);

            let captainPromotionRequirements =
                'Captain Promotion Requirements:';

            for (const requirement of Object.keys(
                config['captainPromotionRequirement'],
            )) {
                switch (requirement) {
                    case 'XP': {
                        captainPromotionRequirements += `\nContributed XP: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'LEVEL': {
                        captainPromotionRequirements += `\nHighest Character Level: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TOP': {
                        captainPromotionRequirements += `\nContribution Pos: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TIME': {
                        captainPromotionRequirements += `\nTime in Guild: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'WARS': {
                        captainPromotionRequirements += `\nWars Participated: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'BUILD': {
                        captainPromotionRequirements += '\nHas war build';
                        break;
                    }
                    case 'PLAYTIME': {
                        captainPromotionRequirements += `\nAverage Weekly Playtime: ${config['captainPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'ECO': {
                        captainPromotionRequirements += '\nKnows eco';
                        break;
                    }
                    case 'VERIFIED': {
                        captainPromotionRequirements += '\nIs verified';
                        break;
                    }
                }
            }

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    ${captainPromotionRequirements}
                    Captain Time in Guild Requirement: ${config['captainTimeRequirement']}
                    Captain Met Requirements Required: ${config['captainRequirementsCount']}
                    `,
                );

            embeds.push(pageEmbed);

            let recruiterPromotionRequirements =
                'Recruiter Promotion Requirements:';

            for (const requirement of Object.keys(
                config['recruiterPromotionRequirement'],
            )) {
                switch (requirement) {
                    case 'XP': {
                        recruiterPromotionRequirements += `\nContributed XP: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'LEVEL': {
                        recruiterPromotionRequirements += `\nHighest Character Level: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TOP': {
                        recruiterPromotionRequirements += `\nContribution Pos: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'TIME': {
                        recruiterPromotionRequirements += `\nTime in Guild: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'WARS': {
                        recruiterPromotionRequirements += `\nWars Participated: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'BUILD': {
                        recruiterPromotionRequirements += '\nHas war build';
                        break;
                    }
                    case 'PLAYTIME': {
                        recruiterPromotionRequirements += `\nAverage Weekly Playtime: ${config['recruiterPromotionRequirement'][requirement]}`;
                        break;
                    }
                    case 'ECO': {
                        recruiterPromotionRequirements += '\nKnows eco';
                        break;
                    }
                    case 'VERIFIED': {
                        recruiterPromotionRequirements += '\nIs verified';
                        break;
                    }
                }
            }

            pageEmbed = new EmbedBuilder()
                .setTitle(`${title}`)
                .setColor(0x00ffff)
                .setDescription(
                    `
                    ${recruiterPromotionRequirements}
                    Recruiter Time in Guild Requirement: ${config['recruiterTimeRequirement']}
                    Recruiter Met Requirements Required: ${config['recruiterRequirementsCount']}
                    `,
                );

            embeds.push(pageEmbed);

            messages.addMessage(message.id, new PagedMessage(message, embeds));

            // We know it will be multiple pages so add buttons
            const previousPage = new ButtonBuilder()
                .setCustomId('previous')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬅️');

            const nextPage = new ButtonBuilder()
                .setCustomId('next')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️');

            const row = new ActionRowBuilder().addComponents(
                previousPage,
                nextPage,
            );

            await interaction.editReply({
                embeds: [embeds[0]],
                components: [row],
            });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setDescription('Error viewing config')
                .setColor(0xff0000);

            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }
    },
};
