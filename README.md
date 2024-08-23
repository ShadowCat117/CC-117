# CC-117

This is a Discord bot primarily focused around guild management for Wynncraft but also displays helpful information such as active hours for other guilds and basic stats about them and their members.

## How to use

The [wiki](https://github.com/ShadowCat117/CC-117/wiki) contains all the information needed to run the bot including a [quick start guide](https://github.com/ShadowCat117/CC-117/wiki/Quick-Start), a [list of features](https://github.com/ShadowCat117/CC-117/wiki/Features), all of the [available commands](https://github.com/ShadowCat117/CC-117/wiki/Available-Commands) and some [extra details on certain configs](https://github.com/ShadowCat117/CC-117/wiki/Configs)

## Database

The database used for the bot contains 2 tables, guilds and players.

The guilds table stores all current guilds with their UUID, name and prefix. It also stores their average online and average captains (or above) for each hour of the day.

The players table stores some information about players that are used when updating roles that would require too many API calls to retrieve. These include guild UUID, guild rank, support rank and highest character level among others. Player average activity is also located here.

## Wynncraft Public API

The bot reads the data from the Wynncraft Public API, the docs for which are located here: https://docs.wynncraft.com/docs/

It reads data relating to guilds, and their members, including their guild rank, personal rank and last login timestamp.
