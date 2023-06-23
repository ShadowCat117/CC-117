const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const createConfig = require('../../functions/create_config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config_channels')
    .setDescription('Update configuration options')
    .addStringOption((option) =>
      option.setName('option')
        .setDescription('The configuration option to update')
        .setRequired(true)
        .addChoices({ name: 'Log Channel', value: 'logChannel' },
        { name: 'Join/Leave Channel', value: 'joinLeaveChannel' }))
    .addChannelOption((option) =>
      option.setName('channel')
        .setDescription('The channel value to set for the configuration option'),
    ),
  async execute(interaction) {
    try {
			let config = {};

      const guildId = interaction.guild.id;
      const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

			if (fs.existsSync(filePath)) {
				const fileData = fs.readFileSync(filePath, 'utf-8');
				config = JSON.parse(fileData);
			} else {
				await createConfig(interaction.client, guildId);

				const fileData = fs.readFileSync(filePath, 'utf-8');
				config = JSON.parse(fileData);
			}

			const adminRoleId = config.adminRole;
			const memberRoles = interaction.member.roles.cache;

			if ((interaction.member.id !== interaction.member.guild.ownerId) && (!memberRoles.has(adminRoleId) && interaction.member.roles.highest.position < interaction.guild.roles.cache.get(adminRoleId).position)) {
				await interaction.reply('You do not have the required permissions to run this command.');
				return;
			}

		} catch (error) {
			console.log(error);
			await interaction.reply('Error changing config.');
			return;
		}
    
    const option = interaction.options.getString('option');
    const channel = interaction.options.getChannel('channel');

    switch (option) {
      case 'logChannel':
        if (channel == null) {
          await interaction.reply({ content: 'Log Channel requires a <channel> input.', ephemeral: true });
          return;
        }
        
        break;
      case 'joinLeaveChannel':
        if (channel == null) {
          await interaction.reply('Join/Leave Channel requires a <channel> input.');
          return;
        }
        
        break;
      default:
        await interaction.reply({ content: 'Invalid configuration option.', ephemeral: true });
        return;
    }

    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', '..', 'configs', `${guildId}.json`);

    try {
      let config = {};
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        config = JSON.parse(fileData);
      }

      switch (option) {
        case 'logChannel':
        case 'joinLeaveChannel':
          config[option] = channel.id;
          break;
      }

      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

      const botPermissions = channel.permissionsFor(interaction.client.user);

      if (!botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
        await interaction.reply({ content: `Configuration option \`${option}\` updated successfully to ${channel}.\n\nI currently do not have permission to send messages to that channel so please allow me to. I need View Channel & Send Messages.`, ephemeral: true });
      } else {
        await interaction.reply({ content: `Configuration option \`${option}\` updated successfully to ${channel}.`, ephemeral: true });
      }
    } catch (error) {
      console.log(`Error updating configuration option: ${error}`);
      await interaction.reply({ content: 'An error occurred while updating the configuration option.', ephemeral: true });
    }
  },
};
