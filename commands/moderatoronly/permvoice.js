const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");

module.exports = {
  category: "permanentvoice",
  data: new SlashCommandBuilder()
    .setName("permvoice")
    .setDescription("Change the user limit.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The create voice channel id to use.")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const currentChannel = member.voice.channel.id;

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

    //Method to set the channel permanet status toggles
    try {
      await interaction.reply({
        content: `This feature is a work in progress.`,
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
