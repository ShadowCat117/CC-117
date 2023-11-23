const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Events,
} = require('discord.js');
const MessageManager = require('../message_type/MessageManager');
const MessageType = require('../message_type/MessageType');
const lastLogins = require('../functions/last_logins');
const guildStats = require('../functions/guild_stats');
const addAlly = require('../functions/add_ally');
const removeAlly = require('../functions/remove_ally');
const trackGuild = require('../functions/track_guild');
const untrackGuild = require('../functions/untrack_guild');
const setGuild = require('../functions/set_guild');
const sus = require('../functions/sus');
const activeHours = require('../functions/active_hours');
const applyRoles = require('../functions/apply_roles');
const updateGuild = require('../functions/update_guild');
const worldActivity = require('../functions/world_activity');
const fs = require('fs');
const path = require('path');
const sendMessage = require('../functions/send_message');

const warriorArchetypes = ['fallen', 'battleMonk', 'paladin'];
const mageArchetypes = ['riftwalker', 'lightBender', 'arcanist'];
const archerArchetypes = ['sharpshooter', 'trapper', 'boltslinger'];
const shamanArchetypes = ['ritualist', 'summoner', 'acolyte'];
const assassinArchetypes = ['acrobat', 'shadestepper', 'trickster'];
const archetypes = warriorArchetypes.concat(mageArchetypes, archerArchetypes, shamanArchetypes, assassinArchetypes);

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        try {
            if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
                return;
            }

            const guildId = interaction.guild.id;
            const directoryPath = path.join(__dirname, '..', 'configs');
            const filePath = path.join(directoryPath, `${guildId}.json`);

            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            if (interaction.isButton()) {
                const message = MessageManager.getMessage(interaction.message.id);

                if (interaction.customId === 'nextPage') {
                    if (!message) {
                        interaction.update({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    const nextPage = message.getNextPage();

                    interaction.update({
                        content: nextPage,
                    });
                } else if (interaction.customId === 'previousPage') {
                    if (!message) {
                        interaction.update({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    const previousPage = message.getPreviousPage();

                    interaction.update({
                        content: previousPage,
                    });
                } else if (interaction.customId === 'war') {
                    const memberOfRole = interaction.guild.roles.cache.get(config['memberOfRole']);
                    const warRole = interaction.guild.roles.cache.get(config['warRole']);
                    const levelRequirement = config['warLevelRequirement'];

                    const memberRoles = await interaction.member.roles.cache;

                    let foundLevelRoles = false;

                    const validLevelRoles = [];

                    if (config['levelRoleOneLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleOne']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleTwoLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleTwo']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleThreeLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleThree']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleFourLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleFour']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleFiveLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleFive']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleSixLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleSix']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleSevenLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleSeven']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleEightLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleEight']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleNineLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleNine']));
                    } else {
                        foundLevelRoles = true;
                    }

                    if (!foundLevelRoles && config['levelRoleTenLevel'] >= levelRequirement) {
                        validLevelRoles.push(interaction.guild.roles.cache.get(config['levelRoleTen']));
                    } else {
                        foundLevelRoles = true;
                    }

                    let validLevel = false;

                    for (const levelRole of validLevelRoles) {
                        if (memberRoles.has(levelRole.id)) {
                            validLevel = true;
                            break;
                        }
                    }

                    if (memberRoles.has(memberOfRole.id) && validLevel) {
                        if (!memberRoles.has(warRole.id)) {
                            await interaction.member.roles.add(warRole)
                                .then(() => {
                                    console.log(`Added war role to ${interaction.member.user.username}`);
                                })
                                .catch(() => {
                                    sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                                });
                        }
        
                        const tankButton = new ButtonBuilder()
                            .setCustomId('tank')
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('TANK');
            
                        const healerButton = new ButtonBuilder()
                            .setCustomId('healer')
                            .setStyle(ButtonStyle.Success)
                            .setLabel('HEALER');
            
                        const damageButton = new ButtonBuilder()
                            .setCustomId('damage')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('DAMAGE');
            
                        const soloButton = new ButtonBuilder()
                            .setCustomId('solo')
                            .setStyle(ButtonStyle.Primary)
                            .setLabel('SOLO');
        
                        const removeButton = new ButtonBuilder()
                            .setCustomId('removewar')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('REMOVE');
        
                        const row = new ActionRowBuilder().addComponents(tankButton, healerButton, damageButton, soloButton, removeButton);
        
                        const warMessage = config['warClassMessage'].replace(/\\n/g, '\n');
        
                        await interaction.reply({
                            content: warMessage,
                            ephemeral: true,
                            components: [row],
                        });
                    } else {
                        await interaction.reply({
                            content: `Sorry, you need to be a member of ${config['guildName']} to use this and be at least level ${levelRequirement}.`,
                            ephemeral: true,
                        });
                    }
                } else if (interaction.customId === 'tank') {
                    const tankRole = interaction.guild.roles.cache.get(config['tankRole']);

                    const memberRoles = interaction.member.roles.cache;

                    const warRole = interaction.guild.roles.cache.get(config['warRole']);

                    if (!memberRoles.has(warRole.id)) {
                        await interaction.member.roles.add(warRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    if (memberRoles.has(tankRole.id)) {
                        await interaction.member.roles.remove(tankRole)
                            .then(() => {
                                console.log(`Removed tank role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove tank role from ${interaction.member.user.username}`);
                            });

                        replyMessage = `You no longer have the ${tankRole} role`;
                    } else {
                        await interaction.member.roles.add(tankRole)
                            .then(() => {
                                console.log(`Added tank role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add tank role to ${interaction.member.user.username}`);
                            });

                        replyMessage = `You now have the ${tankRole} role`;
                    }

                    await interaction.reply({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'healer') {
                    const healerRole = interaction.guild.roles.cache.get(config['healerRole']);

                    const memberRoles = interaction.member.roles.cache;

                    const warRole = interaction.guild.roles.cache.get(config['warRole']);

                    if (!memberRoles.has(warRole.id)) {
                        await interaction.member.roles.add(warRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    if (memberRoles.has(healerRole.id)) {
                        await interaction.member.roles.remove(healerRole)
                            .then(() => {
                                console.log(`Removed healer role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove healer role from ${interaction.member.user.username}`);
                            });

                        replyMessage = `You no longer have the ${healerRole} role`;
                    } else {
                        await interaction.member.roles.add(healerRole)
                            .then(() => {
                                console.log(`Added healer role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add healer role to ${interaction.member.user.username}`);
                            });

                        replyMessage = `You now have the ${healerRole} role`;
                    }

                    await interaction.reply({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'damage') {
                    const damageRole = interaction.guild.roles.cache.get(config['damageRole']);

                    const memberRoles = interaction.member.roles.cache;

                    const warRole = interaction.guild.roles.cache.get(config['warRole']);

                    if (!memberRoles.has(warRole.id)) {
                        await interaction.member.roles.add(warRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    if (memberRoles.has(damageRole.id)) {
                        await interaction.member.roles.remove(damageRole)
                            .then(() => {
                                console.log(`Removed damage role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove damage role from ${interaction.member.user.username}`);
                            });

                        replyMessage = `You no longer have the ${damageRole} role`;
                    } else {
                        await interaction.member.roles.add(damageRole)
                            .then(() => {
                                console.log(`Added damage role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add damage role to ${interaction.member.user.username}`);
                            });

                        replyMessage = `You now have the ${damageRole} role`;
                    }

                    await interaction.reply({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'solo') {
                    const soloRole = interaction.guild.roles.cache.get(config['soloRole']);

                    const memberRoles = interaction.member.roles.cache;

                    const warRole = interaction.guild.roles.cache.get(config['warRole']);

                    if (!memberRoles.has(warRole.id)) {
                        await interaction.member.roles.add(warRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    if (memberRoles.has(soloRole.id)) {
                        await interaction.member.roles.remove(soloRole)
                            .then(() => {
                                console.log(`Removed solo role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove solo role from ${interaction.member.user.username}`);
                            });

                        replyMessage = `You no longer have the ${soloRole} role`;
                    } else {
                        await interaction.member.roles.add(soloRole)
                            .then(() => {
                                console.log(`Added solo role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add solo role to ${interaction.member.user.username}`);
                            });

                        replyMessage = `You now have the ${soloRole} role`;
                    }

                    await interaction.reply({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'removewar') {
                    const memberRoles = await interaction.member.roles.cache;

                    const warRole = interaction.guild.roles.cache.get(config['warRole']);

                    if (memberRoles.has(warRole.id)) {
                        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
                        const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
                        const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
                        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);

                        const warRoles = [warRole, tankRole, healerRole, damageRole, soloRole];

                        for (const role of memberRoles.values()) {
                            if (warRoles.includes(role)) {
                                await interaction.member.roles.remove(role)
                                    .then(() => {
                                        console.log(`Removed war role ${role.name} from ${interaction.member.user.username}`);
                                    })
                                    .catch(() => {
                                        sendMessage(interaction.guild, interaction.channel.id, `Failed to remove war role ${role} from ${interaction.member.user.username}`);
                                    });
                            }
                        }

                        await interaction.reply({
                            content: `You no longer have the ${warRole} role and any war class roles.`,
                            ephemeral: true,
                        });
                    }
                } else if (interaction.customId === 'warrior') {
                    const fallenButton = new ButtonBuilder()
                        .setCustomId('fallen')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('FALLEN');
        
                    const battleMonkButton = new ButtonBuilder()
                        .setCustomId('battleMonk')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('BATTLE MONK');
        
                    const paladinButton = new ButtonBuilder()
                        .setCustomId('paladin')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('PALADIN');

                    const row = new ActionRowBuilder().addComponents(fallenButton, battleMonkButton, paladinButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.reply({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'mage') {
                    const riftwalkerButton = new ButtonBuilder()
                        .setCustomId('riftwalker')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('RIFTWALKER');
        
                    const lightBenderButton = new ButtonBuilder()
                        .setCustomId('lightBender')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('LIGHT BENDER');
        
                    const arcanistButton = new ButtonBuilder()
                        .setCustomId('arcanist')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('ARCANIST');

                    const row = new ActionRowBuilder().addComponents(riftwalkerButton, lightBenderButton, arcanistButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.reply({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'archer') {
                    const sharpshooterButton = new ButtonBuilder()
                        .setCustomId('sharpshooter')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('SHARPSHOOTER');
        
                    const trapperButton = new ButtonBuilder()
                        .setCustomId('trapper')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('TRAPPER');
        
                    const boltslingerButton = new ButtonBuilder()
                        .setCustomId('boltslinger')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('BOLTSLINGER');

                    const row = new ActionRowBuilder().addComponents(sharpshooterButton, trapperButton, boltslingerButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.reply({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'shaman') {
                    const ritualistButton = new ButtonBuilder()
                        .setCustomId('ritualist')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('RITUALIST');
        
                    const summonerButton = new ButtonBuilder()
                        .setCustomId('summoner')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('SUMMONER');
        
                    const acolyteButton = new ButtonBuilder()
                        .setCustomId('acolyte')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('ACOLYTE');

                    const row = new ActionRowBuilder().addComponents(ritualistButton, summonerButton, acolyteButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.reply({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'assassin') {
                    const acrobatButton = new ButtonBuilder()
                        .setCustomId('acrobat')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('ACROBAT');
        
                    const shadestepperButton = new ButtonBuilder()
                        .setCustomId('shadestepper')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('SHADERSTEPPER');
        
                    const tricksterButton = new ButtonBuilder()
                        .setCustomId('trickster')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('TRICKSTER');

                    const row = new ActionRowBuilder().addComponents(acrobatButton, shadestepperButton, tricksterButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.reply({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (archetypes.includes(interaction.customId)) {
                    const memberRoles = await interaction.member.roles.cache;

                    const warriorRole = interaction.guild.roles.cache.get(config['warriorRole']);
                    const mageRole = interaction.guild.roles.cache.get(config['mageRole']);
                    const archerRole = interaction.guild.roles.cache.get(config['archerRole']);
                    const shamanRole = interaction.guild.roles.cache.get(config['shamanRole']);
                    const assassinRole = interaction.guild.roles.cache.get(config['assassinRole']);

                    const classRoles = [warriorRole, mageRole, archerRole, shamanRole, assassinRole];

                    for (const archetype of archetypes) {
                        classRoles.push(interaction.guild.roles.cache.get(config[`${archetype}Role`]));
                    }

                    let classRole;

                    if (warriorArchetypes.includes(interaction.customId)) {
                        classRole = warriorRole;
                    } else if (mageArchetypes.includes(interaction.customId)) {
                        classRole = mageRole;
                    } else if (archerArchetypes.includes(interaction.customId)) {
                        classRole = archerRole;
                    } else if (shamanArchetypes.includes(interaction.customId)) {
                        classRole = shamanRole;
                    } else if (assassinArchetypes.includes(interaction.customId)) {
                        classRole = assassinRole;
                    }

                    const archetypeRole = interaction.guild.roles.cache.get(config[`${interaction.customId}Role`]);

                    for (const role of memberRoles.values()) {
                        if (classRoles.includes(role) && role !== classRole && role !== archetypeRole) {
                            await interaction.member.roles.remove(role)
                                .then(() => {
                                    console.log(`Removed class role ${role.name} from ${interaction.member.user.username}`);
                                })
                                .catch(() => {
                                    sendMessage(interaction.guild, interaction.channel.id, `Failed to remove class role ${role} from ${interaction.member.user.username}`);
                                });
                        }
                    }

                    await interaction.member.roles.add(classRole)
                            .then(() => {
                                console.log(`Added class role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add class role to ${interaction.member.user.username}`);
                            });

                    await interaction.member.roles.add(archetypeRole)
                            .then(() => {
                                console.log(`Added archetype role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add archetype role to ${interaction.member.user.username}`);
                            });

                    const replyMessage = `You now have the ${classRole} class role with archetype ${archetypeRole}!`;

                    await interaction.reply({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else {
                    if (!message) {
                        interaction.update({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    let result;

                    switch (message.messageType) {
                        case MessageType.ACTIVE_HOURS:
                            result = await activeHours(interaction, true);

                            if (result.pages[0] === 'No data') {
                                interaction.update({
                                    content: `No activity data found for ${interaction.customId}`,
                                    components: [],
                                });
                            } else {
                                const row = new ActionRowBuilder();

                                const timezoneSelection = new StringSelectMenuBuilder()
                                    .setCustomId('timezone')
                                    .setPlaceholder('Select timezone!')
                                    .addOptions(
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PST')
                                            .setDescription('UTC-8')
                                            .setValue('-8'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('PDT')
                                            .setDescription('UTC-7')
                                            .setValue('-7'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MDT')
                                            .setDescription('UTC-6')
                                            .setValue('-6'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CDT')
                                            .setDescription('UTC-5')
                                            .setValue('-5'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('EDT')
                                            .setDescription('UTC-4')
                                            .setValue('-4'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BRT')
                                            .setDescription('UTC-3')
                                            .setValue('-3'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('UTC')
                                            .setDescription('UTC+0')
                                            .setValue('0'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('BST')
                                            .setDescription('UTC+1')
                                            .setValue('1'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CEST')
                                            .setDescription('UTC+2')
                                            .setValue('2'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('MSK')
                                            .setDescription('UTC+3')
                                            .setValue('3'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('GST')
                                            .setDescription('UTC+4')
                                            .setValue('4'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('IST')
                                            .setDescription('UTC+5:30')
                                            .setValue('5.5'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('CST/SNST')
                                            .setDescription('UTC+8')
                                            .setValue('8'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('JST')
                                            .setDescription('UTC+9')
                                            .setValue('9'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('AEST')
                                            .setDescription('UTC+10')
                                            .setValue('10'),
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('NZST')
                                            .setDescription('UTC+12')
                                            .setValue('12'),
                                    );

                                row.addComponents(timezoneSelection);
                                await interaction.update({
                                    content: result.pages[0],
                                    components: [row],
                                });
                            }

                            break;
                        case MessageType.ADD_ALLY:
                            result = await addAlly(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.GUILD_STATS:
                            result = await guildStats(interaction, true);

                            if (result.pageCount > 1) {
                                const row = new ActionRowBuilder();

                                const previousPage = new ButtonBuilder()
                                    .setCustomId('previousPage')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⬅️');

                                const nextPage = new ButtonBuilder()
                                    .setCustomId('nextPage')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('➡️');

                                row.addComponents(previousPage, nextPage);

                                interaction.update({
                                    content: result.pages[0],
                                    components: [row],
                                });

                                MessageManager.setMessagePages(message, result.pages);
                            } else {
                                if (result.pages[0] === '```\n```') {
                                    interaction.update({
                                        content: `No players found in the guild ${interaction.customId}`,
                                        components: [],
                                    });
                                } else {
                                    interaction.update({
                                        content: result.pages[0],
                                        components: [],
                                    });
                                }
                            }

                            break;
                        case MessageType.LAST_LOGINS:
                            result = await lastLogins(interaction, true);

                            if (result.pageCount > 1) {
                                const row = new ActionRowBuilder();

                                const previousPage = new ButtonBuilder()
                                    .setCustomId('previousPage')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('⬅️');

                                const nextPage = new ButtonBuilder()
                                    .setCustomId('nextPage')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('➡️');

                                row.addComponents(previousPage, nextPage);

                                interaction.update({
                                    content: result.pages[0],
                                    components: [row],
                                });

                                MessageManager.setMessagePages(message, result.pages);
                            } else {
                                if (result.pages[0] === '```\n```') {
                                    interaction.update({
                                        content: `No players found in the guild ${interaction.customId}`,
                                        components: [],
                                    });
                                } else {
                                    interaction.update({
                                        content: result.pages[0],
                                        components: [],
                                    });
                                }
                            }

                            break;
                        case MessageType.REMOVE_ALLY:
                            result = await removeAlly(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.SET_GUILD:
                            result = await setGuild(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.SUS:
                            result = await sus(interaction.customId);

                            interaction.update({
                                content: result,
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.TRACK_GUILD:
                            result = await trackGuild(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.UNTRACK_GUILD:
                            result = await untrackGuild(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.UPDATE_GUILD:
                            result = await updateGuild(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.VERIFY:
                            result = await applyRoles(interaction.guild, interaction.customId, interaction.member);

                            switch (result) {
                                case 1:
                                    interaction.update({
                                        content: 'Successfully verified',
                                        components: [],
                                    });
                                    break;
                                case 2:
                                    interaction.update({
                                        content: 'Successfully verified as ally',
                                        components: [],
                                    });
                                    break;
                                default:
                                    interaction.update({
                                        content: 'Failed to verify',
                                        components: [],
                                    });
                                    break;
                            }

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.WORLD_ACTIVITY:
                            result = await worldActivity(interaction, true);

                            interaction.update({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                    }
                }
            } else if (interaction.isStringSelectMenu()) {
                const message = MessageManager.getMessage(interaction.message.id);

                if (!message) {
                    interaction.update({
                        content: 'Data expired.',
                        components: [],
                    });
                    return;
                }

                const timezoneFile = 'timezones.json';

                try {
                    let timezones = {};
        
                    if (fs.existsSync(timezoneFile)) {
                        const fileData = fs.readFileSync(timezoneFile, 'utf-8');
                        timezones = JSON.parse(fileData);
                    } else {
                        await new Promise((resolve, reject) => {
                            fs.writeFile(timezoneFile, JSON.stringify(timezones, null, 2), (err) => {
                                if (err) {
                                    console.log(err);
                                    console.log('Error creating timezones file');
                                    reject(err);
                                } else {
                                    console.log('Created timezones file');
                                    resolve();
                                }
                            });
                        });
                    }

                    timezones[interaction.member.id] = interaction.values;

                    fs.writeFileSync(timezoneFile, JSON.stringify(timezones, null, 2), 'utf-8');
        
                } catch (error) {
                    console.log(error);
                    await interaction.update('Error changing timezone');
                    return;
                }

                const result = await activeHours(interaction, true, interaction.values);

                const row = new ActionRowBuilder();

                const timezoneSelection = new StringSelectMenuBuilder()
                    .setCustomId('timezone')
                    .setPlaceholder('Select timezone!')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('PST')
                            .setDescription('UTC-8')
                            .setValue('-8'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('PDT')
                            .setDescription('UTC-7')
                            .setValue('-7'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('MDT')
                            .setDescription('UTC-6')
                            .setValue('-6'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('CDT')
                            .setDescription('UTC-5')
                            .setValue('-5'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('EDT')
                            .setDescription('UTC-4')
                            .setValue('-4'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('BRT')
                            .setDescription('UTC-3')
                            .setValue('-3'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('UTC')
                            .setDescription('UTC+0')
                            .setValue('0'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('BST')
                            .setDescription('UTC+1')
                            .setValue('1'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('CEST')
                            .setDescription('UTC+2')
                            .setValue('2'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('MSK')
                            .setDescription('UTC+3')
                            .setValue('3'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('GST')
                            .setDescription('UTC+4')
                            .setValue('4'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('IST')
                            .setDescription('UTC+5:30')
                            .setValue('5.5'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('CST/SNST')
                            .setDescription('UTC+8')
                            .setValue('8'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('JST')
                            .setDescription('UTC+9')
                            .setValue('9'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('AEST')
                            .setDescription('UTC+10')
                            .setValue('10'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('NZST')
                            .setDescription('UTC+12')
                            .setValue('12'),
                    );

                row.addComponents(timezoneSelection);

                interaction.update({
                    content: result.pages[0],
                    components: [row],
                });
            }
        } catch (err) {
            const guildId = interaction.guild.id;
            const directoryPath = path.join(__dirname, '..', 'configs');
            const filePath = path.join(directoryPath, `${guildId}.json`);

            let config = {};

            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            sendMessage(interaction.guild, config.logChannel, 'Bad interaction, <@237296939245240330> fix me :)');
        }
    },
};
