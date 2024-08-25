const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from the voice channel")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to kick.")
        .setRequired(true),
    ),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentChannel = member.voice.channel.id;
    const target = interaction.options.getUser("target").id;
    const targetnew = guild.members.cache.get(target);

    //Check if the user is in the voice channel
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

    try {
      //Check if the target user is in the same voice channel
      if (
        !targetnew.voice.channel ||
        targetnew.voice.channel.id !== member.voice.channel.id
      ) {
        return interaction.reply({
          content: `<@${target}> is not in the voice channel.`,
          ephemeral: true,
        });
      } else {
        targetnew.voice.disconnect();
        await interaction.reply({
          content: `<@${target}> has been kicked from the channel.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      await interaction.reply({
        content: `There was an error while using the command.`,
        ephemeral: true,
      });
      console.log(error);
    }
  },
};
