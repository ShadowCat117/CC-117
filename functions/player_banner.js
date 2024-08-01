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

    const avatar = await axios.get(
        `https://vzge.me/bust/200/${playerJson.uuid}.png?`,
        { headers, responseType: 'arraybuffer' },
    );

    if (avatar) {
        const avatarImage = await loadImage(avatar.data);
        context.drawImage(avatarImage, 100, 2, 200, 200);
    }

    const fontPath = path.join(__dirname, '..', 'resources', 'wynn.ttf');
    GlobalFonts.registerFromPath(fontPath, 'Wynn');

    context.font = '42px Wynn';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';

    // Temporary, remove if Wynn ever fixes the name changing guild bug
    let username = playerJson.username;

    if (username === 'Owen_Rocks_3') {
        username = 'Amber_Rocks_3';
    }

    context.fillText(`${username}`, 200, 250);

    let guildText = 'Guildless';

    if (playerJson.guild) {
        guildText = `${playerJson.guild.rank.charAt(0).toUpperCase()}${playerJson.guild.rank.slice(1).toLowerCase()} of ${playerJson.guild.name}`;
    }

    context.font = '24px Wynn';
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
    context.fillStyle = '#000000';
    context.textAlign = 'start';
    context.fillText('Rank', 30, 340);

    context.fillStyle = supportRankColor;
    context.fillText(supportRank, 30, 370);

    context.fillStyle = '#000000';
    context.fillText('Total Level', 30, 430);

    context.fillStyle = '#ffffff';
    context.fillText(`${playerJson.globalData.totalLevel.toLocaleString()}`, 30, 460);

    context.fillStyle = '#000000';
    context.textAlign = 'end';
    context.fillText('Wars', 370, 340);

    context.fillStyle = '#ffffff';
    context.fillText(`${playerJson.globalData.wars}`, 370, 370);

    context.fillStyle = '#000000';
    context.fillText('Playtime', 370, 430);

    context.fillStyle = '#ffffff';
    context.fillText(`${playerJson.playtime} hrs`, 370, 460);

    const banner = new AttachmentBuilder(await canvas.encode('png'), {
        name: 'banner.png',
    });

    return {
        username: playerJson.username.replaceAll('_', '\\_'),
        banner: banner,
    };
}

module.exports = playerBanner;
