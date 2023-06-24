# CC-117

This is a Discord bot for role management and displaying information about guilds for the minecraft server Wynncraft. It uses the public Wynncraft API to build a database of information on every guild on the server and all the players too, whether they are a member of a guild or not.

This information is then used for features such as applying roles based on in-game status and finding the least active time period for a guild so you know the perfect time to attack them!

The bot does have support for multiple Discord servers, however I am currently only testing the bot on my guild's server to ensure everything works smoothly before releasing an invite link.

## Commands

The bot currently features 17 commands.

/activehours takes in 1 input which is the name of the guild you want to view the active hours for, this will then send a message containing the average number of players online in that guild at each hour and the same for the average number of players who are at least the captain rank. The message also features a selection menu to change the timezone of the information.

/addally takes in 1 input which is the name of the guild you want to add as an ally, this is used when verifying members as the bot will only verify members that are part of the guild your server represents or any allies you have set.

/allies will return you a list of all guilds you have set as allies.

/config_channels takes in 2 inputs, one for the channel option you want to change and the other for the channel you want to set the option as. The first option could be the channel you want to send join/leave messages in and then the 2nd input will be the channel you want those to be sent in.

/config_features takes in 2 inputs, one for the feature you want to toggle on/off and the other for if you want the feature to be on or off. The first option could be if you want the ranks of everyone in your guild to be checked and updated daily and the 2nd will be if you want it on or off.

/config_roles takes in 2 inputs, one for the role option you want to change and the other for the role you want to set the option as. The first option could be the role you want to be assigned to the owner of the guild and then the 2nd input will be that role you want to be set.

/config_values takes in 2 inputs, one for the value option you want to change and the other for the value you want to set it as. The first option could be the message you want sent when someone joins your server and then the 2nd input will be the actual message to send.

/help takes in 1 input which is for the command you want help with. It gives a similar description to the information available in this README.

/lastlogins takes in 1 input which is the name of the guild you want to view the last logins for, this will then send a message containing the days since last login for every member of the guild. If the guild was the one your server represents, then it will highlight members in green or red depending on if they are over or under the inactivity threshold you set in the config.

/removeally takes in 1 input which is the name of the guild you want to remove as an ally, this will no longer allow players to verify as a player from that guild in your server.

/setguild takes in 1 input which is the name of the guild you want to represent, this is used when verifying as the bot will only verify members from this guild and any allies you have set.

/trackedguilds will return a list of all of the guilds you are tracking, along with their average number of online players, average number of online players who are the rank of captain or above and the same again but for the currently online instead of average.

/trackguild takes in 1 input which is the name of the guild you want to track, this will make them appear in the list when running /trackedguilds.

/untrackguild takes in 1 input which is the name of the guild you no longer want to track, this will make them no longer appear in the list when running /trackedguilds.

/updateranks will update the roles for every member of your server by looking at their username/nickname and seeing if it matches someone in the database who is a part of your guild or any of your allies.

/viewconfig will display a user friendly version of the config. For any roles/channels set it will properly display them and not just their ID so you can clearly see if they work.

/verify takes in 1 input which is the username of the player you want to verify as. It acts as a mini /updateranks, but only for you.

## Database

The database used for the bot contains 2 tables, guilds and players.

The guilds table contains the name and prefix of each guild as well as the running average of players/captains online at each hour.

The players table contains the UUID, username, guild name, guild rank, personal rank, veteran status, last login date and if they are currently online. It also has a date for when the players personal rank was last updated as if that is updated too often the API rate limit will be hit much sooner so it is currently only updated monthly.

## Wynncraft Public API

The bot reads the data from the Wynncraft Public API, the docs for which are located here: https://docs.wynncraft.com/

It reads data relating to guilds, and their members, including their guild rank, personal rank and last login date.
