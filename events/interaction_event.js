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
const online = require('../functions/online');
const guildStats = require('../functions/guild_stats');
const addAlly = require('../functions/add_ally');
const removeAlly = require('../functions/remove_ally');
const trackGuild = require('../functions/track_guild');
const untrackGuild = require('../functions/untrack_guild');
const setGuild = require('../functions/set_guild');
const sus = require('../functions/sus');
const activeHours = require('../functions/active_hours');
const updateGuild = require('../functions/update_guild');
const worldActivity = require('../functions/world_activity');
const fs = require('fs');
const path = require('path');
const sendMessage = require('../functions/send_message');
const promotionProgress = require('../functions/promotion_progress');
const verify = require('../functions/verify');
const addDemotionException = require('../functions/add_demotion_exception');
const addInactivityException = require('../functions/add_inactivity_exception');
const addPromotionException = require('../functions/add_promotion_exception');
const removeDemotionException = require('../functions/remove_demotion_exception');
const removeInactivityException = require('../functions/remove_inactivity_exception');
const removePromotionException = require('../functions/remove_promotion_exception');
const updatePlayer = require('../functions/update_player');

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
            // If the interaction was not a button or string select menu
            // we don't need to do anything
            if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
                return;
            }

            await interaction.deferUpdate();

            const guildId = interaction.guild.id;
            const directoryPath = path.join(__dirname, '..', 'configs');
            const filePath = path.join(directoryPath, `${guildId}.json`);

            let config = {};

            // Get the config file for the server
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                config = JSON.parse(fileData);
            }

            // Button interactions
            if (interaction.isButton()) {
                // Get the message we're interacting with so we know how to handle
                // the button press
                const message = MessageManager.getMessage(interaction.message.id);

                if (interaction.customId === 'nextPage') {
                    // No known message, change message to "Data expired."
                    if (!message) {
                        interaction.editReply({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    // Get the next page for the message and change it to that
                    const nextPage = message.getNextPage();

                    interaction.editReply({
                        content: nextPage,
                    });
                } else if (interaction.customId === 'previousPage') {
                    // No known message, change message to "Data expired."
                    if (!message) {
                        interaction.editReply({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    // Get the previous page for the message and change it to that
                    const previousPage = message.getPreviousPage();

                    interaction.editReply({
                        content: previousPage,
                    });
                } else if (interaction.customId === 'war') {
                    // Get the member of guild role and level requirement for getting war roles
                    const memberOfRole = interaction.guild.roles.cache.get(config['memberOfRole']);
                    const levelRequirement = config['warLevelRequirement'];

                    const memberRoles = await interaction.member.roles.cache;

                    let foundLevelRoles = false;

                    const validLevelRoles = [];

                    // Check each level roles set level to see which roles will be valid for war roles.
                    // If the minimum role has been found, ignore checking other roles.
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

                    // Check all roles above minimum requirement and if the member has them
                    // they are the valid level for getting war roles.
                    for (const levelRole of validLevelRoles) {
                        if (memberRoles.has(levelRole.id)) {
                            validLevel = true;
                            break;
                        }
                    }

                    // If the member has both the memer of guild role and is a valid level
                    // allow them to get war roles.
                    if (memberRoles.has(memberOfRole.id) && validLevel) {
                        // Get the warrer role
                        const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                        // Add warrer role if they don't already have it
                        if (!memberRoles.has(warrerRole.id)) {
                            await interaction.member.roles.add(warrerRole)
                                .then(() => {
                                    console.log(`Added warrer role to ${interaction.member.user.username}`);
                                })
                                .catch(() => {
                                    sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                                });
                        }

                        // Create the buttons to be displayed on response button
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

                        const ecoButton = new ButtonBuilder()
                            .setCustomId('eco')
                            .setStyle(ButtonStyle.Success)
                            .setLabel('ECO');

                        const warPingButton = new ButtonBuilder()
                            .setCustomId('warping')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('WAR PING');
        
                        const removeButton = new ButtonBuilder()
                            .setCustomId('removewar')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('REMOVE');
        
                        // Add the buttons to rows
                        const rolesRow = new ActionRowBuilder().addComponents(tankButton, healerButton, damageButton, soloButton, ecoButton);
                        const removeRow = new ActionRowBuilder().addComponents(warPingButton, removeButton);
        
                        // Get the war message
                        const warMessage = config['warClassMessage'].replace(/\\n/g, '\n');
        
                        // Send a followup with the war message and buttons
                        await interaction.followUp({
                            content: warMessage,
                            ephemeral: true,
                            components: [rolesRow, removeRow],
                        });
                    } else {
                        // Tell the user they need to be a guild member and meet a level requirement to gain war roles
                        await interaction.followUp({
                            content: `Sorry, you need to be a member of ${config['guildName']} to use this and be at least level ${levelRequirement}.`,
                            ephemeral: true,
                        });
                    }
                } else if (interaction.customId === 'tank') {
                    // Get tank role
                    const tankRole = interaction.guild.roles.cache.get(config['tankRole']);

                    // Get member roles
                    const memberRoles = interaction.member.roles.cache;

                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // Add warrer role if they don't already have
                    if (!memberRoles.has(warrerRole.id)) {
                        await interaction.member.roles.add(warrerRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    // If they have the tank role, remove it, otherwise add it
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

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'healer') {
                    // Get healer role
                    const healerRole = interaction.guild.roles.cache.get(config['healerRole']);

                    // Get member roles
                    const memberRoles = interaction.member.roles.cache;

                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // Add warrer role if they don't already have it
                    if (!memberRoles.has(warrerRole.id)) {
                        await interaction.member.roles.add(warrerRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    // Add healer role or remove if they already have it
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

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'damage') {
                    // Get damage role
                    const damageRole = interaction.guild.roles.cache.get(config['damageRole']);

                    // Get member roles
                    const memberRoles = interaction.member.roles.cache;

                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // Add warrer role if they don't already have it
                    if (!memberRoles.has(warrerRole.id)) {
                        await interaction.member.roles.add(warrerRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    // Remove damage role if they have it, otherwise add it
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

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'solo') {
                    // Get solo role
                    const soloRole = interaction.guild.roles.cache.get(config['soloRole']);

                    // Get member roles
                    const memberRoles = interaction.member.roles.cache;

                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // Add warrer role if they don't already have it
                    if (!memberRoles.has(warrerRole.id)) {
                        await interaction.member.roles.add(warrerRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                            });
                    }

                    let replyMessage;

                    // Add solo role if they don't have it, otherwise remove it
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

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'eco') {
                    // Get eco role
                    const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);

                    // Get member roles
                    const memberRoles = interaction.member.roles.cache;

                    let replyMessage;

                    // Remove eco role if they have it, otherwise add it
                    if (memberRoles.has(ecoRole.id)) {
                        await interaction.member.roles.remove(ecoRole)
                            .then(() => {
                                console.log(`Removed eco role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove eco role from ${interaction.member.user.username}`);
                            });

                        replyMessage = `You no longer have the ${ecoRole} role`;
                    } else {
                        await interaction.member.roles.add(ecoRole)
                            .then(() => {
                                console.log(`Added eco role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add eco role to ${interaction.member.user.username}`);
                            });

                        replyMessage = `You now have the ${ecoRole} role`;
                    }

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'warping') {
                    // Get member roles
                    const memberRoles = await interaction.member.roles.cache;
                    // Get war role
                    const warRole = interaction.guild.roles.cache.get(config['warRole']);
                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // Add warrer role if they didn't have it
                    if (!memberRoles.has(warrerRole.id)) {
                        await interaction.member.roles.add(warrerRole)
                            .then(() => {
                                console.log(`Added warrer role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add warrer role to ${interaction.member.user.username}`);
                            });
                    }

                    // Add war role if they didn't have, otherwise remove the role
                    if (!memberRoles.has(warRole.id)) {
                        await interaction.member.roles.add(warRole)
                            .then(() => {
                                console.log(`Added war role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add war role to ${interaction.member.user.username}`);
                            });

                            await interaction.followUp({
                                content: `You now have the ${warRole} role.`,
                                ephemeral: true,
                            });
                    } else {
                        await interaction.member.roles.remove(warRole)
                            .then(() => {
                                console.log(`Removed war role from ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to remove war role from ${interaction.member.user.username}`);
                            });

                        await interaction.followUp({
                            content:`You no longer have the ${warRole} role.`,
                            ephemeral: true,
                        });
                    }
                } else if (interaction.customId === 'removewar') {
                    // Get member roles
                    const memberRoles = await interaction.member.roles.cache;

                    // Get warrer role
                    const warrerRole = interaction.guild.roles.cache.get(config['warrerRole']);

                    // If they have the warrer role then remove all war related roles
                    if (memberRoles.has(warrerRole.id)) {
                        const warRole = interaction.guild.roles.cache.get(config['warRole']);
                        const tankRole = interaction.guild.roles.cache.get(config['tankRole']);
                        const healerRole = interaction.guild.roles.cache.get(config['healerRole']);
                        const damageRole = interaction.guild.roles.cache.get(config['damageRole']);
                        const soloRole = interaction.guild.roles.cache.get(config['soloRole']);
                        const ecoRole = interaction.guild.roles.cache.get(config['ecoRole']);

                        const warRoles = [warRole, tankRole, healerRole, damageRole, soloRole, ecoRole, warrerRole];

                        // Remove each role
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

                        await interaction.followUp({
                            content: `You no longer have the ${warrerRole} role and any war class roles.`,
                            ephemeral: true,
                        });
                    } else {
                        // They should have no war roles if they do not have the warrer role
                        // unless it was manually added
                        await interaction.followUp({
                            content: 'You do not have any war roles',
                            ephemeral: true,
                        });
                    }
                } else if (interaction.customId === 'warrior') {
                    // Create buttons for warrior archetypes
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

                    // Add buttons to row
                    const row = new ActionRowBuilder().addComponents(fallenButton, battleMonkButton, paladinButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.followUp({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'mage') {
                    // Create buttons for mage archetypes
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

                    // Add buttons to row
                    const row = new ActionRowBuilder().addComponents(riftwalkerButton, lightBenderButton, arcanistButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.followUp({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'archer') {
                    // Create buttons for archer archetypes
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

                    // Add buttons to row
                    const row = new ActionRowBuilder().addComponents(sharpshooterButton, trapperButton, boltslingerButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.followUp({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'shaman') {
                    // Create buttons for shaman archetypes
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

                    // Add buttons to row
                    const row = new ActionRowBuilder().addComponents(ritualistButton, summonerButton, acolyteButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.followUp({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (interaction.customId === 'assassin') {
                    // Create buttons for assassin archetypes
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

                    // Add buttons to row
                    const row = new ActionRowBuilder().addComponents(acrobatButton, shadestepperButton, tricksterButton);

                    const archetypeMessage = config['classArchetypeMessage'].replace(/\\n/g, '\n');

                    await interaction.followUp({
                        content: archetypeMessage,
                        ephemeral: true,
                        components: [row],
                    });
                } else if (archetypes.includes(interaction.customId)) {
                    // Get member roles
                    const memberRoles = await interaction.member.roles.cache;

                    // Get class roles
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

                    // Determine which class was selected
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

                    // Get the role for the archetype
                    const archetypeRole = interaction.guild.roles.cache.get(config[`${interaction.customId}Role`]);

                    // Remove any previous class roles that aren't the same as the new selected
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

                    // Add class role
                    await interaction.member.roles.add(classRole)
                            .then(() => {
                                console.log(`Added class role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add class role to ${interaction.member.user.username}`);
                            });

                    // Add archetype role
                    await interaction.member.roles.add(archetypeRole)
                            .then(() => {
                                console.log(`Added archetype role to ${interaction.member.user.username}`);
                            })
                            .catch(() => {
                                sendMessage(interaction.guild, interaction.channel.id, `Failed to add archetype role to ${interaction.member.user.username}`);
                            });

                    const replyMessage = `You now have the ${classRole} class role with archetype ${archetypeRole}!`;

                    await interaction.followUp({
                        content: replyMessage,
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'giveaway') {
                    // Get giveaway role
                    const giveawayRole = interaction.guild.roles.cache.get(config['giveawayRole']);
                    // Get member of guild role
                    const memberOfRole = interaction.guild.roles.cache.get(config['memberOfRole']);

                    // Get member roles
                    const memberRoles = await interaction.member.roles.cache;

                    let replyMessage;

                    // If they have the guild member role
                    if (memberRoles.has(memberOfRole.id)) {
                        // Remove giveaway role if they have it already, otherwise add it
                        if (memberRoles.has(giveawayRole.id)) {
                            await interaction.member.roles.remove(giveawayRole)
                                .then(() => {
                                    console.log(`Removed giveaway role from ${interaction.member.user.username}`);
                                })
                                .catch(() => {
                                    sendMessage(interaction.guild, interaction.channel.id, `Failed to remove giveaway role from ${interaction.member.user.username}`);
                                });

                            replyMessage = `You no longer have the ${giveawayRole} role`;
                        } else {
                            await interaction.member.roles.add(giveawayRole)
                                .then(() => {
                                    console.log(`Added giveaway role to ${interaction.member.user.username}`);
                                })
                                .catch(() => {
                                    sendMessage(interaction.guild, interaction.channel.id, `Failed to add giveaway role to ${interaction.member.user.username}`);
                                });

                            replyMessage = `You now have the ${giveawayRole} role`;
                        }

                        await interaction.followUp({
                            content: replyMessage,
                            ephemeral: true,
                        });
                    } else {
                        // Tell user they must be a guild member to get the giveaway role
                        await interaction.followUp({
                            content: `Sorry, you need to be a member of ${config['guildName']} to use this.`,
                            ephemeral: true,
                        });
                    }
                } else {
                    // Unknown message, display "Data expired."
                    if (!message) {
                        interaction.editReply({
                            content: 'Data expired.',
                            components: [],
                        });

                        return;
                    }

                    let result;

                    // Depending on what the original command was, we need to rerun that command but
                    // using the exact guild name and letting the function know we are looking for this
                    // exact name.
                    switch (message.messageType) {
                        case MessageType.ACTIVE_HOURS:
                            // Run active hours
                            result = await activeHours(interaction, true);

                            // Handle response
                            if (result.pages[0] === 'No data') {
                                interaction.editReply({
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
                                await interaction.editReply({
                                    content: result.pages[0],
                                    components: [row],
                                });
                            }

                            break;
                        case MessageType.ADD_ALLY:
                            // Run addAlly
                            result = await addAlly(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.ADD_DEMOTION_EXCEPTION:
                            // Run addDemotionException
                            result = await addDemotionException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.ADD_INACTIVITY_EXCEPTION:
                            // Run addInactivityException
                            result = await addInactivityException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.ADD_PROMOTION_EXCEPTION:
                            // Run addPromotionException
                            result = await addPromotionException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.GUILD_STATS:
                            // Run guildStats
                            result = await guildStats(interaction, true);

                            // Handle response
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

                                interaction.editReply({
                                    content: result.pages[0],
                                    components: [row],
                                });

                                MessageManager.setMessagePages(message, result.pages);
                            } else {
                                if (result.pages[0] === '```\n```') {
                                    interaction.editReply({
                                        content: `No players found in the guild ${interaction.customId}`,
                                        components: [],
                                    });
                                } else {
                                    interaction.editReply({
                                        content: result.pages[0],
                                        components: [],
                                    });
                                }
                            }

                            break;
                        case MessageType.LAST_LOGINS:
                            // Run lastLogins
                            result = await lastLogins(interaction, true);

                            // Handle response
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

                                interaction.editReply({
                                    content: result.pages[0],
                                    components: [row],
                                });

                                MessageManager.setMessagePages(message, result.pages);
                            } else {
                                if (result.pages[0] === '```\n```') {
                                    interaction.editReply({
                                        content: `No players found in the guild ${interaction.customId}`,
                                        components: [],
                                    });
                                } else {
                                    interaction.editReply({
                                        content: result.pages[0],
                                        components: [],
                                    });
                                }
                            }

                            break;
                        case MessageType.ONLINE:
                            // Run online
                            result = await online(interaction, true);

                            // Handle response
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

                                interaction.editReply({
                                    content: result.pages[0],
                                    components: [row],
                                });

                                MessageManager.setMessagePages(message, result.pages);
                            } else {
                                if (result.pages[0] === '```\n```') {
                                    interaction.editReply({
                                        content: `No players online in the guild ${interaction.customId}`,
                                        components: [],
                                    });
                                } else {
                                    interaction.editReply({
                                        content: result.pages[0],
                                        components: [],
                                    });
                                }
                            }

                            break;
                        case MessageType.PROMOTION_PROGRESS:
                            // Run promotionProgress
                            result = await promotionProgress(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.REMOVE_ALLY:
                            // Run removeAlly
                            result = await removeAlly(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.REMOVE_DEMOTION_EXCEPTION:
                            // Run removeDemotionException
                            result = await removeDemotionException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.REMOVE_INACTIVITY_EXCEPTION:
                            // Run removeInactivityException
                            result = await removeInactivityException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.REMOVE_PROMOTION_EXCEPTION:
                            // Run removePromotionException
                            result = await removePromotionException(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.SET_GUILD:
                            // Run setGuild
                            result = await setGuild(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.SUS:
                            // Run sus
                            result = await sus(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.TRACK_GUILD:
                            // Run trackGuild
                            result = await trackGuild(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.UNTRACK_GUILD:
                            // Run untrackGuild
                            result = await untrackGuild(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.UPDATE_GUILD:
                            // Run updateGuild
                            result = await updateGuild(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.UPDATE_PLAYER:
                            // Run updatePlayer
                            result = await updatePlayer(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.VERIFY:
                            // Run applyRoles
                            result = await await verify(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                        case MessageType.WORLD_ACTIVITY:
                            // Run worldActivity
                            result = await worldActivity(interaction, true);

                            interaction.editReply({
                                content: result.pages[0],
                                components: [],
                            });

                            MessageManager.removeMessage(message);

                            break;
                    }
                }
            } else if (interaction.isStringSelectMenu()) {
                // Get message
                const message = MessageManager.getMessage(interaction.message.id);

                // Unknown message, set to "Data expired."
                if (!message) {
                    interaction.editReply({
                        content: 'Data expired.',
                        components: [],
                    });
                    return;
                }

                // Get timezones file
                const timezoneFile = 'timezones.json';

                try {
                    let timezones = {};
        
                    // Get or create timezones file
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

                    // Save new timezone value for member
                    timezones[interaction.member.id] = interaction.values;

                    fs.writeFileSync(timezoneFile, JSON.stringify(timezones, null, 2), 'utf-8');
        
                } catch (error) {
                    console.log(error);
                    await interaction.editReply('Error changing timezone');
                    return;
                }

                // Run activeHours, pass in timezone from file for member
                const result = await activeHours(interaction, true, interaction.values);

                // Create row and string select menu for message
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

                interaction.editReply({
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

            console.error(err);
        }
    },
};
