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
const addAlly = require('../functions/add_ally');
const removeAlly = require('../functions/remove_ally');
const trackGuild = require('../functions/track_guild');
const untrackGuild = require('../functions/untrack_guild');
const setGuild = require('../functions/set_guild');
const activeHours = require('../functions/active_hours');
const applyRoles = require('../functions/apply_roles');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
            return;
        }

        if (interaction.isButton()) {
            const message = MessageManager.getMessage(interaction.message.id);

            if (!message) {
                interaction.update({
                    content: 'Data expired.',
                    components: [],
                });
                return;
            }

            if (interaction.customId === 'nextPage') {
                const nextPage = message.getNextPage();
                interaction.update({
                    content: nextPage,
                });
            } else if (interaction.customId === 'previousPage') {
                const previousPage = message.getPreviousPage();
                interaction.update({
                    content: previousPage,
                });
            } else {
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
                            const editedReply = await interaction.update({
                                content: result.pages[0],
                                components: [row],
                            });

                            message.setMessage(editedReply);

                            MessageManager.addMessage(message);
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

            const result = await activeHours(interaction, true, interaction.values);

            const row = new ActionRowBuilder();

            const timezoneSelection = new StringSelectMenuBuilder()
                .setCustomId('timezone')
                .setPlaceholder('Select timezone!')
                .addOptions(
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

            const editedReply = interaction.update({
                content: result.pages[0],
                components: [row],
            });

            message.setMessage(editedReply);

            MessageManager.addMessage(message);
        }
    },
};
