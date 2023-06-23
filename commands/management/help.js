const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays the help information for the selected command.')
        .addStringOption((option) =>
            option.setName('option')
                .setDescription('The command you want to know more about.')
                .setRequired(true)
                .addChoices({ name: '/activehours', value: 'activeHours' },
                { name: '/addally', value: 'addAlly' },
                { name: '/allies', value: 'allies' },
                { name: '/config_channels', value: 'configChannels' },
                { name: '/config_features', value: 'configFeatures' },
                { name: '/config_roles', value: 'configRoles' },
                { name: '/config_values', value: 'configValues' },
                { name: '/help', value: 'help' },
                { name: '/lastlogins', value: 'lastLogins' },
                { name: '/removeally', value: 'removeAlly' },
                { name: '/setguild', value: 'setGuild' },
                { name: '/trackedguilds', value: 'trackedGuilds' },
                { name: '/trackguild', value: 'trackGuild' },
                { name: '/untrackguild', value: 'untrackGuild' },
                { name: '/updateranks', value: 'updateRanks' },
                { name: '/verify', value: 'verify' },
                { name: '/viewconfig', value: 'viewConfig' })),
	async execute(interaction) {
        const option = interaction.options.getString('option');

        let message = '';

        switch (option) {
            case 'activeHours':
                message = '```/activehours <guild> takes in the name of the guild you want to view the active hours for. It shows the average number of players online at each hour and the average number of players who have the rank of captain or above. the message also includes a timezone selection menu to display the information in different timezones.```';
                break;
            case 'addAlly':
                message = '```/addally <guild> takes in the name of the guild you want to add as an ally. This will allow members to be verified as allies using /verify or when /updateranks is ran.```';
                break;
            case 'allies':
                message = '```/allies will display a list of all guilds you currently have set as allies in your server.```';
                break;
            case 'configChannels':
                message = '```/config_channels <option> <channel> takes in the option you want to set and the channel you want to set that option to. For example, one option is Join/Leave Channel, this is the channel you want custom join/leave messages to be sent too.```';
                break;
            case 'configFeatures':
                message = '```/config_features <option> <enabled> takes in the option you want to set and whether you want that option to be enabled or not. For example, one option is Send Log Messages, this will decide whether certain messages are sent to your set log channel or not.```';
                break;
            case 'configRoles':
                message = '```/config_roles <option> <role> takes in the option you want to set and the role you want to set that option to. For example, one option is Owner Role, this will be the role applied to the member who is the owner of the guild you have chosen to represent.```';
                break;
            case 'configValues':
                message = '```/config_values <option> <valie> takes in the option you want to set and the value you want to set that option to. For example, one option is Chief Inactive Threshold, this will be used for the /lastlogins command so that if the command is ran on your guild, it will highlight Chief\'s in red if they haven\'t logged in to Wynncraft in over that amount of days.```';
                break;
            case 'help':
                message = '```/help <option> takes in the command you want more information about, in this case you wanted to know about the /help command.```';
                break;
            case 'lastLogins':
                message = '```/lastlogins <guild> takes in the name of the guild you want to view the last logins for. It shows each member of that guild, their rank and how long it has been since they last logged in. If the guild is the guild your server represents, then the members will be highlighted green/red based on thresholds set via /config_vales.```';
                break;
            case 'removeAlly':
                message = '```/removeally <guild> takes in the name of the guild you want to remove from your list of allies. Next time /updateranks is ran or someone who was verified as an ally from that guild runs /verify, their roles will be removed.```';
                break;
            case 'setGuild':
                message = '```/setguild <guild> takes in the name of the guild you want your server to represent. This will be used for /updateranks and /verify to determine what ranks people should have and /lastlogins to display colours for inactivity.```';
                break;
            case 'trackedGuilds':
                message = '```/trackedguilds will display a list of the average online players, average online players who are or are above the captain role and the same for the currently online counts for each of the guilds you have chosen to track via /trackguild.```';
                break;
            case 'trackGuild':
                message = '```/trackguild <guild> takes in the name of the guild you want to track. This will be used when running /trackedguilds to populate it with the information on each guild you have chosen to track.```';
                break;
            case 'untrackGuild':
                message = '```/untrackguild <guild> takes in the name of the guild you no longer want to track. Next time someone runs /trackedguilds in your server, this guilld will no longer appear in that list.```';
                break;
            case 'updateRanks':
                message = '```/updateranks will check all of your server members and attempt to find their Wynncraft account based on their username and/or nickname. This is case sensitive so if your username doesn\'t match the casing of your Wynncraft account, better change that. It will apply all relevant roles you have selected with /config_roles and some extra ones too if you enabled them with /config_features. If you have the change nicknames feature enabled, allies will be renamed to have their guild\'s prefix as a suffix to their nickname, for example, "ShadowCat117 [HOC]".```';
                break;
            case 'verify':
                message = '```/verify <username> takes in the name of the Wynncraft account you want to verify as. This will apply all relevant roles that have been set with /config_roles and some extras too if enabled with /config_features. If the changing nicknames features is enabled then your nickname will be changed to match the entered username and if you are an ally of the guild this server represents then your guild\'s prefix will be added as a suffix, for example, "ShadowCat117 [HOC]". If the server has the check duplicate nicknames feature enabled, you will not be able to verify as someone who already has verified as that name in this server.```';
                break;
            case 'viewConfig':
                message = '```/viewconfig will display the config file for your server in a friendly way. It will show what guild you represent. The values set by /config_values. The features you have enabled/disabled by /config_features. The channels you have set by /config_channels and the roles you have set by /config_roles.```';
                break;
            default:
                message = 'Invalid help option.';
                return;
          }

          await interaction.reply({ content: message, ephemeral: true });
	},
};