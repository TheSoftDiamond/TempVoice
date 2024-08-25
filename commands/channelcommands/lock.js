const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");
const { toggleLock } = require("../../methods/locks");

module.exports = {
  category: "channelcommands",
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Toggle the channel between being locked/unlocked."),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentChannel = member.voice.channel.id;
    const targetChannel = guild.channels.cache.get(currentChannel);

    //Check if the user is in a voice channel
    if (!channelOwners.has(currentChannel)) {
      return interaction.reply({
        content: "You must be in a temporary channel.",
        ephemeral: true,
      });
    }

    //Check if the user is the owner of the channel
    if (channelOwners.get(currentChannel) !== member.id) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    //Public to private
    if (toggleLock.get(currentChannel) === 0) {
      try {
        // Set the channel permissions for @everyone
        targetChannel.permissionOverwrites.edit(guild.roles.everyone, {
          Connect: false,
        });

        // Add the User to the channel
        targetChannel.permissionOverwrites.edit(member, { Connect: true });

        // Add the Bot to the channel
        targetChannel.permissionOverwrites.edit(interaction.client.user, {
          Connect: true,
          ViewChannel: true,
        });

        toggleLock.set(currentChannel, 1);
        return interaction.reply({
          content: "The channel was locked",
          ephemeral: true,
        });
      } catch (error) {
        await interaction.reply({
          content: `There was an error while using the command.`,
          ephemeral: true,
        });
        console.log(error);
      }
    }

    //Private to public
    if (toggleLock.get(currentChannel) === 1) {
      try {
        // Remove the channel permissions for @everyone
        targetChannel.permissionOverwrites.delete(guild.roles.everyone);

        // Add the User to the channel
        targetChannel.permissionOverwrites.edit(member, { ViewChannel: true });

        // Add the Bot to the channel
        targetChannel.permissionOverwrites.edit(interaction.client.user, {
          Connect: true,
          ViewChannel: true,
          Speak: true,
        });

        toggleLock.set(currentChannel, 0);
        return interaction.reply({
          content: "The channel was unlocked",
          ephemeral: true,
        });
      } catch (error) {
        await interaction.reply({
          content: `There was an error while using the command.`,
          ephemeral: true,
        });
        console.log(error);
      }
    }
  },
};
