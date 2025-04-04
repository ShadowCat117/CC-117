const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const database = require('../database/database');
const utilities = require('./utilities');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { userAgent } = require('../config.json');
const headers = {
    'User-Agent': userAgent,
};

async function playerBanner(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('username');
    } else if (interaction.customId) {
        nameToSearch = interaction.customId.split(':')[1];
    }

    const player = await database.findPlayer(nameToSearch, force);

    if (player && player.message === 'Multiple possibilities found') {
        return {
            playerUuids: player.playerUuids,
            playerUsernames: player.playerUsernames,
            playerRanks: player.playerRanks,
            playerGuildRanks: player.playerGuildRanks,
            playerGuildNames: player.playerGuildNames,
        };
    }

    await utilities.waitForRateLimit();

    let response;

    // If a player was found, look for UUID to get guaranteed results, otherwise look for the name input
    if (player) {
        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/player/${player.uuid}?fullResult=True`,
            );
        } catch (error) {
            console.error(error);
            return {
                username: '',
                banner: null,
            };
        }
    } else {
        try {
            response = await axios.get(
                `https://api.wynncraft.com/v3/player/${nameToSearch}?fullResult=True`,
            );
        } catch (error) {
            // 300 indicates a multi selector
            if (error.response.status === 300) {
                return {
                    playerUuids: Object.keys(error.response.data),
                    playerUsernames: Object.values(error.response.data).map(
                        (entry) => entry.storedName,
                    ),
                    playerRanks: [],
                    playerGuildRanks: [],
                    playerGuildNames: [],
                };
            } else {
                console.error(error);
                return {
                    username: '',
                    banner: null,
                };
            }
        }
    }

    const playerJson = response.data;

    if (!playerJson || !playerJson.username) {
        return {
            username: '',
            banner: null,
        };
    }

    let guildUuid = null;
    let guildRank = null;

    if (playerJson.guild) {
        guildUuid = playerJson.guild.uuid;

        guildRank = playerJson.guild.rank.toLowerCase();
    }

    let highestCharcterLevel = 0;

    for (const character in playerJson.characters) {
        const characterJson = playerJson.characters[character];

        // If character level is higher than current tracked highest, set as new highest
        if (characterJson.level > highestCharcterLevel) {
            highestCharcterLevel = characterJson.level;
        }
    }

    const veteran = playerJson.veteran ? playerJson.veteran : false;

    database.updatePlayer({
        uuid: playerJson.uuid,
        username: playerJson.username,
        guildUuid: guildUuid,
        guildRank: guildRank,
        online: playerJson.online,
        lastLogin: playerJson.lastJoin,
        supportRank: playerJson.supportRank,
        veteran: veteran,
        serverRank: playerJson.rank,
        wars: playerJson.globalData.wars,
        highestCharcterLevel: highestCharcterLevel,
    });

    const canvas = createCanvas(400, 500);
    const context = canvas.getContext('2d');

    const imagePath = path.join(__dirname, '..', 'resources', 'banner.png');
    const background = await loadImage(imagePath);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    let avatar;
    let hasAvatar = true;

    try {
        avatar = await axios.get(
            `https://vzge.me/bust/200/${playerJson.uuid}.png?`,
            { headers, responseType: 'arraybuffer' },
        );
    } catch (error) {
        console.error('Failed to get avatar: ', error);
        hasAvatar = false;
    }

    if (avatar) {
        const avatarImage = await loadImage(avatar.data);
        context.drawImage(avatarImage, 100, 2, 200, 200);
    }

    const fontPath = path.join(__dirname, '..', 'resources', 'wynn.ttf');
    GlobalFonts.registerFromPath(fontPath, 'Wynn');

    context.font = '42px Wynn';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.shadowColor = '#000000';
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 1;

    context.fillText(`${playerJson.username}`, 200, 250);

    let guildText = 'Guildless';

    if (playerJson.guild) {
        guildText = `${playerJson.guild.rank.charAt(0).toUpperCase()}${playerJson.guild.rank.slice(1).toLowerCase()} of ${playerJson.guild.name}`;
    }

    let guildFontSize = 24;

    do {
        guildFontSize -= 1;
        context.font = `${guildFontSize}px Wynn`;
    } while (context.measureText(guildText).width > canvas.width - 60);

    context.fillStyle = '#02D8E9';
    context.textAlign = 'center';
    context.fillText(guildText, 200, 290);

    let supportRank = 'None';
    let supportRankColor = '#ffffff';

    if (playerJson.supportRank) {
        if (playerJson.supportRank === 'vip') {
            supportRank = 'VIP';
        } else if (playerJson.supportRank === 'vipplus') {
            supportRank = 'VIP+';
        } else {
            supportRank =
                playerJson.supportRank.charAt(0).toUpperCase() +
                playerJson.supportRank.slice(1);
        }

        supportRankColor = playerJson.legacyRankColour.main;
    }

    context.font = '24px Wynn';
    context.fillStyle = '#aaaaaa';
    context.textAlign = 'center';
    context.fillText('Rank', 109, 340);

    context.fillStyle = supportRankColor;
    context.fillText(supportRank, 109, 370);

    context.fillStyle = '#aaaaaa';
    context.fillText('Total Level', 109, 430);

    context.fillStyle = '#ffffff';
    context.fillText(
        `${playerJson.globalData.totalLevel.toLocaleString()}`,
        109,
        460,
    );

    context.fillStyle = '#aaaaaa';
    context.fillText('Wars', 291, 340);

    context.fillStyle = '#ffffff';
    context.fillText(
        `${playerJson.globalData.wars.toLocaleString()}`,
        291,
        370,
    );

    context.fillStyle = '#aaaaaa';
    context.fillText('Playtime', 291, 430);

    context.fillStyle = '#ffffff';

    const playtimeText = `${playerJson.playtime.toLocaleString()} hrs`;

    let playtimeFontSize = 24;

    do {
        playtimeFontSize -= 1;
        context.font = `${playtimeFontSize}px Wynn`;
    } while (context.measureText(playtimeText).width > 163);

    context.fillText(playtimeText, 291, 460);

    const banner = new AttachmentBuilder(await canvas.encode('png'), {
        name: 'banner.png',
    });

    return {
        username: playerJson.username.replaceAll('_', '\\_'),
        banner: banner,
        hasAvatar: hasAvatar,
    };
}

module.exports = playerBanner;
