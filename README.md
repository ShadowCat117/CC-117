# CC-117

This is a Discord bot for role management and displaying information about guilds for the minecraft server Wynncraft. It uses the public Wynncraft API to build a database of information on every guild on the server and all the players too, whether they are a member of a guild or not.

This information is then used for features such as applying roles based on in-game status and finding the least active time period for a guild so you know the perfect time to attack them!

I am working on improving core features of the bot to better support a larger number of servers before an invite link will be made available.

## Commands

The bot currently features 49 commands.

A temporary manual on what the commands do and how to use the bot is available here: https://docs.google.com/document/d/1anSFPfBuMPzKJ7JwejBnpB7KMsiw-Lrk50LMfNRJt6Q/edit?usp=sharing

## Database

The database used for the bot contains 2 tables by default, guilds and players. However "primary" guilds also have their own table, these are guilds that a server has chosen to represent.

The guilds table contains various information about every guild in the game such as name, prefix, level, xp, current season rating and activity for regular players and those at or above the rank of captain.

The players table contains a lot of information about players, including what guild they are in, their support and server rank, current online status among other stats.

A table for a primary guild currently only contains information for tracking the weekly playtime of the members of that guild.

## Wynncraft Public API

The bot reads the data from the Wynncraft Public API, the docs for which are located here: https://docs.wynncraft.com/

It reads data relating to guilds, and their members, including their guild rank, personal rank and last login date.
