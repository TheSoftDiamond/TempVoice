const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user from the voice channel")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to ban.")
        .setRequired(true),
    ),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentChannel = member.voice.channel.id;
    const target = interaction.options.getUser("target").id;
    const targetnew = guild.members.cache.get(target);

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

    //Prevent the user from kicking themselves
    if (member.id === target) {
      return interaction.reply({
        content: "You cannot kick yourself.",
        ephemeral: true,
      });
    }

    //Prevent the use r from kicking this bot from the channel
    if (target === interaction.client.user.id) {
      return interaction.reply({
        content: "You cannot ban me from the channel.",
        ephemeral: true,
      });
    }

    try {
      //Set the target users PermissionsBitField for the channel
      const targetChannel = guild.channels.cache.get(currentChannel);
      // edits overwrites to allow a user to not connect to the channel
      targetChannel.permissionOverwrites.edit(target, { Connect: false });

      //Check if the target user is in the same voice channel
      if (
        targetnew.voice.channel &&
        targetnew.voice.channel.id === member.voice.channel.id
      ) {
        targetnew.voice.disconnect();
        await interaction.reply({
          content: `<@${target}> has been kicked from the channel.`,
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: `<@${target}> has been banned from the channel.`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: `There was an error while using the command.`,
        ephemeral: true,
      });
      console.log(error);
    }
  },
};
