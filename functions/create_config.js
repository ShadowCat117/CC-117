const fs = require('fs').promises;
const path = require('path');

async function createConfig(client, guildId) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    try {
        await fs.access(filePath);

    } catch (error) {
        if (error.code === 'ENOENT') {
            const guild = client.guilds.cache.get(guildId);

            const highestRole = guild.roles.cache.reduce((prev, role) => (role.position > prev.position ? role : prev));

            const defaultData = {
                adminRole: highestRole.id,
                updateRanks: false,
                changeNicknames: false,
                checkDuplicateNicknames: false,
                logChannel: null,
                logMessages: false,
                joinLeaveChannel: null,
                sendJoinLeaveMessages: false,
                joinMessage: 'Welcome to the server $user$!',
                leaveMessage: '$user$ has left the server.',
                ownerRole: null,
                chiefRole: null,
                strategistRole: null,
                captainRole: null,
                recruiterRole: null,
                recruitRole: null,
                allyOwnerRole: null,
                allyRole: null,
                championRole: null,
                heroRole: null,
                vipPlusRole: null,
                vipRole: null,
                vetRole: null,
                veteranRole: false,
                verifyMembers: false,
                unverifiedRole: null,
                memberOf: false,
                memberOfRole: null,
                chiefThreshold: 365,
                strategistThreshold: 80,
                captainThreshold: 40,
                recruiterThreshold: 25,
                recruitThreshold: 25,
                levelRequirement: 100,
                inactiveMultiplier: 1,
                guildName: null,
                allies: [],
                trackedGuilds: [],
                chiefPromotionRequirement: ['NONE'],
                strategistPromotionRequirement: ['NONE'],
                captainPromotionRequirement: ['NONE'],
                recruiterPromotionRequirement: ['NONE'],
                chiefXPRequirement: 0,
                chiefLevelRequirement: 0,
                chiefContributorRequirement: 0,
                strategistXPRequirement: 0,
                strategistLevelRequirement: 0,
                strategistContributorRequirement: 0,
                captainXPRequirement: 0,
                captainLevelRequirement: 0,
                captainContributorRequirement: 0,
                recruiterXPRequirement: 0,
                recruiterLevelRequirement: 0,
                recruiterContributorRequirement: 0,
                levelRoles: false,
                levelRoleOne: null,
                levelRoleOneLevel: 106,
                levelRoleTwo: null,
                levelRoleTwoLevel: 105,
                levelRoleThree: null,
                levelRoleThreeLevel: 100,
                levelRoleFour: null,
                levelRoleFourLevel: 95,
                levelRoleFive: null,
                levelRoleFiveLevel: 90,
                levelRoleSix: null,
                levelRoleSixLevel: 80,
                levelRoleSeven: null,
                levelRoleSevenLevel: 70,
                levelRoleEight: null,
                levelRoleEightLevel: 60,
                levelRoleNine: null,
                levelRoleNineLevel: 50,
                levelRoleTen: null,
                levelRoleTenLevel: 40,
                warRole: null,
                tankRole: null,
                healerRole: null,
                damageRole: null,
                soloRole: null,
                warMessage: '',
                warClassMessage: '',
                promotionExceptions: [],
                demotionExceptions: [],
                warriorRole: null,
                fallenRole: null,
                battleMonkRole: null,
                paladinRole: null,
                mageRole: null,
                riftwalkerRole: null,
                lightBenderRole: null,
                arcanistRole: null,
                archerRole: null,
                sharpshooterRole: null,
                trapperRole: null,
                boltslingerRole: null,
                shamanRole: null,
                ritualistRole: null,
                summonerRole: null,
                acolyteRole: null,
                assassinRole: null,
                acrobatRole: null,
                shadestepperRole: null,
                tricksterRole: null,
                classMessage: '',
                classArchetypeMessage: '',
            };

            try {
                await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                console.log(`Created config file for guild ${guildId}`);
            } catch (err) {
                console.log(`Error creating config file for guild ${guildId}: ${err}`);
            }
        } else {
            console.log(`Error accessing config file for guild ${guildId}: ${error}`);
        }
    }
}

module.exports = createConfig;
