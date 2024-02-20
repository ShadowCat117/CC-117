# CC-117

This is a Discord bot for role management and displaying information about guilds for the minecraft server Wynncraft. It uses the public Wynncraft API to build a database of information on every guild on the server and all the players too, whether they are a member of a guild or not.

This information is then used for features such as applying roles based on in-game status and finding the least active time period for a guild so you know the perfect time to attack them!

I am working on improving core features of the bot to better support a larger number of servers before an invite link will be made available.

## Commands

The bot currently features 49 commands.

A temporary manual on what the commands do and how to use the bot is available here: https://docs.google.com/document/d/1anSFPfBuMPzKJ7JwejBnpB7KMsiw-Lrk50LMfNRJt6Q/edit?usp=sharing

## Quick Start
By default, the role that is able to run management related commands is set to the highest role in your server hierarchy. This can be changed via
```bash
/config_roles
```
After selecting this command you will be displayed a list of options for roles you want to select. 
Pick the role you want either by selection or typing the name, this feature works with most commands.

<span style="color: red;"><b>IMPORTANT:</span> THE @CC-117 ROLE MUST BE ABOVE ANY OF THESE ROLES IN YOUR SERVER HIERARCHY IN ORDER FOR THE BOT TO APPLY THEM TO MEMBERS.</b></span>


## Roles
```bash
Admin - Role required to run various config commands. Any role above this will also be able to run. Commands marked with '*' require Admin role to run. 
Owner
Chief
Strategist
Captain
Recruiter
Recruit
Ally Owner
Ally
Champion
Hero
VIP+
VIP
Veteran
Verified
Unverified
Member of 
Administrator - member has an administrator role in Wynncraft
Moderator
Content Team
Giveaway
```


## Config Commands
```bash
/config_levelroles*
```
Works similar to the above command. This command is used for applying roles based on the highest combat level on a players account. You can set up 10. Currently, you will need to order them from highest to lowest and remember the order otherwise it could cause issues for other features.

To use: Run the command and selet the optoins and pick the role. The options are named "Level Role One", "Level Role Two" etc. So make one level 106, two 106, three 100, etc.

```bash
/config_levels*
```
This command is paired with the above. Use this to set what level is required to get that role. Unlike the previous commands, you won't be presented with an option for the value input, after you've selected the "Level One Level" option you simply have to type in the number you want for that level role, say for example 106.


```bash
/config_classroles*
```
Roles for letting users pick their favourite class and archetype. 

```bash
/config_warroles*
```

```bash
/config_channels*
```

```bash
/config_promotions*
```

```bash
/config_<rank>promotions*
```

```bash
/config_features*
```

```bash
/config_values*
```
<b>That's it for the config commands!</b>

## Management Commands
```bash
/setguild*
```
Sets the guild you want to represent. Enter the prefix or full guid name.

```bash
/addally*
```
Add guilds you want to classify as allies, has no effect on Wynncraft.

```bash
/removeally* 
```
Remove guild(s) you have set as allies

```bash
/allies*
```
Shows a list of allied guilds

```bash
/trackguild*
```
Adds a guild to your personal tracked list

```bash
/trackedguilds*
```
Lists tracked guilds
```bash
/untrackguild*
```
Untracks a guild
Displays all the guilds that have been tracked in your server

```bash
/adddemotionexception*
```
```bash
/addinactivityexception*
```

```bash
/addpromotionexception*
```

```bash
/removeddemotoinexception*
```

```bash
/removeinactivityexception*
```

```bash
/removepromotionexception*
```

```bash
/createclassmessage*
```

```bash
/creategiveawaymessage*
```

```bash
/createwarmessage*
```

```bash
/help
```

```bash
/updateguild
```

```bash
/updateplayer
```

```bash
/updateranks*
```

```bash
/viewconfig*
```

## More commands 
Commands for the average user

```bash
/verify
```

```bash
/unverify
```

```bash
/activehours
```

```bash
/checkfordemotions
```

```bash
/checkforpromotions
```

```bash
/demotionexceptions*
```

```bash
/promotionexceptions*
```

```bash
/inactivityexceptions*
```

```bash
/sus*
```

```bash
/verified*
```

```bash
/worldactivity
```

```bash
/trackedguilds
```

```bash
/online
```

```bash
/lastlogins
```

Please refer to the linked google doc for a closer look at command functions
## Database

The database used for the bot contains 2 tables by default, guilds and players. However "primary" guilds also have their own table, these are guilds that a server has chosen to represent.

The guilds table contains various information about every guild in the game such as name, prefix, level, xp, current season rating and activity for regular players and those at or above the rank of captain.

The players table contains a lot of information about players, including what guild they are in, their support and server rank, current online status among other stats.

A table for a primary guild currently only contains information for tracking the weekly playtime of the members of that guild.

## Wynncraft Public API

The bot reads the data from the Wynncraft Public API, the docs for which are located here: https://docs.wynncraft.com/

It reads data relating to guilds, and their members, including their guild rank, personal rank and last login date.
