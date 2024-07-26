const fs = require('fs');
const path = require('path');

async function createConfig(client, guildId) {
    const directoryPath = path.join(__dirname, '..', 'configs');
    const filePath = path.join(directoryPath, `${guildId}.json`);

    if (!fs.existsSync(filePath)) {
        try {
            const guild = client.guilds.cache.get(guildId);

            const highestRole = guild.roles.cache.reduce((prev, role) => (role.position > prev.position ? role : prev));

            const defaultData = {
                adminRole: highestRole.id,
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
                veteranRole: null,
                verifiedRole: null,
                unverifiedRole: null,
                memberOfRole: null,
                warRole: null,
                tankRole: null,
                healerRole: null,
                damageRole: null,
                soloRole: null,
                ecoRole: null,
                warPingRole: null,
                levelRoles: {},
                administratorRole: null,
                moderatorRole: null,
                contentTeamRole: null,
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
                giveawayRole: null,
                eventsRole: null,
                logChannel: null,
                joinLeaveChannel: null,
                guild: null,
                allies: [],
                trackedGuilds: [],
                updateRoles: false,
                logMessages: false,
                sendJoinLeaveMessages: false,
                addGuildPrefixes: true,
                checkBannedPlayers: true,
                joinMessage: 'Welcome to the server $user$!',
                leaveMessage: '$user$ has left the server.',
                warMessage: '',
                warClassMessage: '',
                classMessage: '',
                classArchetypeMessage: '',
                guildEventsMessage: '',
                chiefUpperThreshold: 730,
                chiefLowerThreshold: 365,
                strategistUpperThreshold: 50,
                strategistLowerThreshold: 30,
                captainUpperThreshold: 32,
                captainLowerThreshold: 16,
                recruiterUpperThreshold: 20,
                recruiterLowerThreshold: 10,
                recruitUpperThreshold: 20,
                recruitLowerThreshold: 10,
                levelRequirement: 100,
                extraTimeIncrease: 0,
                averageRequirement: 5,
                newPlayerMinimumTime: 14,
                newPlayerThreshold: 5,
                memberThreshold: 100,
                promotionExceptions: {},
                demotionExceptions: {},
                inactivityExceptions: {},
                bannedPlayers: {},
                chiefPromotionRequirement: {},
                strategistPromotionRequirement: {},
                captainPromotionRequirement: {},
                recruiterPromotionRequirement: {},
                chiefTimeRequirement: 0,
                strategistTimeRequirement: 0,
                captainTimeRequirement: 0,
                recruiterTimeRequirement: 0,
                chiefRequirementsCount: 1,
                strategistRequirementsCount: 1,
                captainRequirementsCount: 1,
                recruiterRequirementsCount: 1,
                warLevelRequirement: 100,
            };

            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
            console.log(`Created config file for guild ${guildId}`);
        } catch (err) {
            console.error(`Error creating config file for guild ${guildId}: ${err}`);
        }
    } else {
        console.error('createConfig called but config exists');
    }
}

module.exports = createConfig;
