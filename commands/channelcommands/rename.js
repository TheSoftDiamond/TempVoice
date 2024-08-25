const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const { channelOwners } = require("../../methods/channelowner");

module.exports = {
  category: "channelcommands",
  data: new SlashCommandBuilder()
    .setName("rename")
    .setDescription("Rename the channel.")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The input to echo back")
        // Ensure the text will fit in an embed description, if the user chooses that option
        .setMaxLength(100)
        .setMinLength(1)
        .setRequired(true),
    ),
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

    //Rename the channel
    try {
      // Set the channel name
      targetChannel.setName(interaction.options.getString("input"));

      return interaction.reply({
        content: `The channel was renamed to ${interaction.options.getString("input")}`,
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
