const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");

module.exports = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("transferownership")
    .setDescription(
      "Transfer the ownership of the temp channel to a new owner.",
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to transfer the ownership to.")
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

    //Check if the user is trying to transfer ownership to themselves
    if (interaction.user.id === target) {
      return interaction.reply({
        content: "You cannot transfer ownership to yourself.",
        ephemeral: true,
      });
    }

    // Transfer the ownership of the channel to the target user

    try {
      if (
        !targetnew.voice.channel ||
        targetnew.voice.channel.id !== member.voice.channel.id
      ) {
        return interaction.reply({
          content: `<@${target}> is not in the voice channel.`,
          ephemeral: true,
        });
      } else {
        channelOwners.set(currentChannel, target);
        await interaction.reply({
          content: `Channel ownership has been transferred to <@${target}>.`,
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
