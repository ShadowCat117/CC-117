const axios = require('axios');
const findPlayer = require('./find_player');

function sigmoid(x) {
    return 100 / (1 + Math.exp(-0.1 * (x - 50)));
}

async function sus(interaction, force = false) {
    let nameToSearch;

    if (interaction.options !== undefined) {
        nameToSearch = interaction.options.getString('username');
    } else if (interaction.customId) {
        nameToSearch = interaction.customId.substring(interaction.customId.indexOf('-') + 1);
    }

    const player = await findPlayer(nameToSearch, '', force);

    if (player && player.message === 'Multiple possibilities found') {
        return {
            playerUuids: player.playerUuids,
            playerUsernames: player.playerUsernames,
            playerRanks: player.playerRanks,
            playerGuildRanks: player.playerGuildRanks,
            playerGuildNames: player.playerGuildNames,
        };
    }

    if (player) {
        // FIXME: Handle errors better
        const playerJson = (await axios.get(`https://api.wynncraft.com/v3/player/${player.uuid}`)).data;

        if (!playerJson || !playerJson.username) {
            return ({
                username: '',
                uuid: '',
                overallSusValue: -1,
                joinSusData: '',
                playtimeSusData: '',
                timeSpentSusData: '',
                totalLevelSusData: '',
                questsSusData: '',
                rankSusData: '',
                publicProfile: false,
            });
        }

        // Calculations based on Valor bot with some tweaks https://github.com/classAndrew/valor/blob/main/commands/sus.py
        const joinSusValue = Math.max(0, (Date.now() / 1000 - new Date(playerJson.firstJoin).getTime() / 1000 - 63072000) * -1) * 100 / 63072000;
        const playtimeSusValue = Math.max(0, (playerJson.playtime - 800) * -1) * 100 / 800;

        const daysSinceJoin = Math.floor((Date.now() - new Date(playerJson.firstJoin).getTime()) / (1000 * 60 * 60 * 24));

        let timeSpentPercentage;
        let timeSpentSusValue;

        if (daysSinceJoin > 0) {
            timeSpentPercentage = ((playerJson.playtime / (daysSinceJoin * 24)) * 100);
            timeSpentSusValue = sigmoid(timeSpentPercentage);
        } else {
            timeSpentPercentage = 100.00;
            timeSpentSusValue = 100;
        }

        const totalLevelSusValue = Math.max(0, (playerJson.globalData.totalLevel - 250) * -1) * 100 / 250;
        const questSusValue = Math.max(0, (playerJson.globalData.completedQuests - 150) * -1) * 100 / 150;
        const rankSusValue = playerJson.supportRank === 'vip' ? 25.0 : (playerJson.supportRank === 'vipplus' || playerJson.supportRank === 'hero' || playerJson.supportRank === 'champion' || playerJson.veteran === true) ? 0.0 : 50.0;

        const overallSus = ((joinSusValue + rankSusValue + totalLevelSusValue + playtimeSusValue + questSusValue + timeSpentSusValue) / 6).toFixed(2);

        const joinSusData = `${playerJson.firstJoin.split('T')[0]}\n${joinSusValue.toFixed(2)}%`;
        const playtimeSusData = `${playerJson.playtime} hours\n${playtimeSusValue.toFixed(2)}%`;
        const timeSpentSusData = `${timeSpentPercentage.toFixed(2)}% of playtime\n${timeSpentSusValue.toFixed(2)}%`;
        const totalLevelSusData = `${playerJson.globalData.totalLevel}\n${totalLevelSusValue.toFixed(2)}%`;
        const questsSusData = `${playerJson.globalData.completedQuests}\n${questSusValue.toFixed(2)}%`;
        let rankSusData;

        const rank = playerJson.supportRank;

        if (rank === null) {
            rankSusData = 'No rank';
        } else if (rank === 'vipplus') {
            rankSusData = 'VIP+';
        } else {
            rankSusData = rank.toUpperCase();
        }

        if (playerJson.veteran === true) {
            rankSusData += ' (VET)';
        }

        rankSusData += `\n${rankSusValue.toFixed(2)}%`;

        return ({
            username: player.username.replaceAll('_', '\\_'),
            uuid: player.uuid,
            overallSusValue: overallSus,
            joinSusData: joinSusData,
            playtimeSusData: playtimeSusData,
            timeSpentSusData: timeSpentSusData,
            totalLevelSusData: totalLevelSusData,
            questsSusData: questsSusData,
            rankSusData: rankSusData,
            publicProfile: playerJson.publicProfile,
        });
    } else {
        return ({
            username: '',
            uuid: '',
            overallSusValue: -1,
            joinSusData: '',
            playtimeSusData: '',
            timeSpentSusData: '',
            totalLevelSusData: '',
            questsSusData: '',
            rankSusData: '',
            publicProfile: false,
        });
    }
}

module.exports = sus;
