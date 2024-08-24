const { Client, SlashCommandBuilder, PermissionsBitField , ChannelType, GuildChannel } = require('discord.js');
require('dotenv').config();
const { channelOwners } = require('../../methods/channelowner');
const { toggleLock } = require('../../methods/locks');

module.exports = {
  category: 'limir',
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('Change the user limit.')
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('The user limit for the channel.')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(99)),
  async execute(interaction) {
    const guild = interaction.guild
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentChannel = member.voice.channel.id;
    const targetChannel = guild.channels.cache.get(currentChannel);
    const limit = interaction.options.getInteger('limit');

    //Check if the user is in a voice channel
    if (!channelOwners.has(currentChannel)) {
        return interaction.reply({ content: 'You must be in a temporary channel.', ephemeral: true });
    }

    //Check if the user is the owner of the channel
    if (channelOwners.get(currentChannel) !== member.id) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    //Public to private
        try {

            // Remove the channel permissions for @everyone
            targetChannel.setUserLimit(limit)
            return interaction.reply({ content: `the limit was adjusted to ${limit}`, ephemeral: true });
            
        } catch (error) {
          await interaction.reply({ content:`There was an error while using the command.`, ephemeral: true });
          console.log(error);
        }
    
  },
};