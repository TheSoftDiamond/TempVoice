const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
require("dotenv").config();
const ownerId = process.env.OWNERID;

module.exports = {
  category: "utility",
  notglobal: [],
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reloads a command.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload.")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const commandName = interaction.options
      .getString("command", true)
      .toLowerCase();
    const command = interaction.client.commands.get(commandName);

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    if (!command) {
      return interaction.reply({
        content: `There is no command with name \`${commandName}\`!`,
        ephemeral: true,
      });
    }

    delete require.cache[
      require.resolve(`../${command.category}/${command.data.name}.js`)
    ];

    try {
      interaction.client.commands.delete(command.data.name);
      const newCommand = require(
        `../${command.category}/${command.data.name}.js`,
      );
      interaction.client.commands.set(newCommand.data.name, newCommand);
      await interaction.reply({
        content: `Command \`${newCommand.data.name}\` was reloaded!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};
