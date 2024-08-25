const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  GuildChannel,
} = require("discord.js");
require("dotenv").config();
const fs = require("node:fs");

const FIELD_CATERGORYID_NAME = "CATEGORYID";
const FIELD_VOICECREATECHANNELID_NAME = "VOICECREATECHANNELID";

/* function  getValueFromField(fieldName, line)
 *
 * description: Gets the value assigned to a field.  Assumes one line in the format: <fieldName> = "<value>"
 *
 * parameters: string fieldName: name of the field to get
 *             string line: line to get the field from
 *
 * Returns: Null if the field cannot be found or the file otherwise does not match.  <value> if a match is found
 */
function getValueFromField(fieldName, line) {
  const re = RegExp("^" + fieldName + '\\s*=\\s*"(.*)"');
  const matches = re.exec(line);

  if (matches == null) {
    return null; // Group 1
  } else {
    return matches[1]; // Group 1
  }
}

/* function  readSettingsFile()
 *
 * description: Reads settings.cfg into a structure of the form {category, voiceChannelId}
 *
 * parameters: None
 *
 * Returns: A structure with the parameters category and voiceChannelId
 */
function readSettingsFile(guildId) { // eslint-disable-line
  const fileContents = fs.readFileSync(
    `./globalserversettings/setupsettings/${guildId}/settings.cfg`,
    "utf8",
  );
  const lines = fileContents.split("\n");
  const settingsFile = {};
  for (const line of lines) {
    if (line.startsWith(FIELD_CATERGORYID_NAME)) {
      settingsFile.category = getValueFromField(FIELD_CATERGORYID_NAME, line);

      if (settingsFile.category === null)
        console.error(`Could not find the field ${FIELD_CATERGORYID_NAME}`);
    } else if (line.startsWith(FIELD_VOICECREATECHANNELID_NAME)) {
      settingsFile.voiceChannelId = getValueFromField(
        FIELD_VOICECREATECHANNELID_NAME,
        line,
      );
      if (settingsFile.voiceChannelId === null)
        console.error(
          `Could not find the field ${FIELD_VOICECREATECHANNELID_NAME}`,
        );
    }
  }

  return settingsFile;
}

/* function  writeValueToField(fieldName, value)
 *
 * description: Writes a field name and value pair into the form: <fieldName> = "<value>"
 *
 * parameters: string fieldName: name of the field to write
 *             string value: Value to set
 *
 * Returns: <fieldName> = "" if the value is null or undefined, otherwise returns <fieldName> = "<value>"
 */
function writeValueToField(fieldName, value) {
  let fileData = `${fieldName} = `;
  if (typeof value === "undefined" || value === null) {
    fileData = fileData + '""\n';
  } else {
    fileData = fileData + `"${value}"\n`;
  }

  return fileData;
}

/* function  writeSettingsFile(settingsFile)
 *
 * description: Writes settings.cfg into a structure of the form {category, voiceChannelId}
 *
 * parameters: structure settingsFile: the structure to write to disk
 *
 * Returns: void
 */
function writeSettingsFile(settings, guildID) {
  let fileData = "";

  fileData =
    fileData + writeValueToField(FIELD_CATERGORYID_NAME, settings.category);
  fileData =
    fileData +
    writeValueToField(FIELD_VOICECREATECHANNELID_NAME, settings.voiceChannelId);

  fs.writeFileSync(
    `./globalserversettings/setupsettings/${guildID}/settings.cfg`,
    fileData,
    "utf8",
  );
}

function createSettingsFile(guildId) {
  const directoryPath = `./globalserversettings/setupsettings/${guildId}`;
  const filePath = `${directoryPath}/settings.cfg`;
  const fileContents = `CATEGORYID = ""\nVOICECREATECHANNELID = ""`;

  try {
    fs.mkdirSync(directoryPath, { recursive: true });
    fs.writeFileSync(filePath, fileContents, "utf8");
    console.log("Settings file created successfully");
  } catch (error) {
    console.error("Error creating settings file:", error);
  }
}

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the temp channel.")
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("The category id to use")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The create voice channel id to use.")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    let settings = {};
    try {
      settings.category = interaction.options.getChannel("category").id;
    } catch {
      settings.category = "";
    }

    try {
      settings.voiceChannelId = interaction.options.getChannel("channel").id;
    } catch {
      settings.voiceChannelId = "";
    }
    const guild = interaction.guild;

    let thecategoryId;
    let thevoiceChannelId;

    if (
      !fs.existsSync(
        `./globalserversettings/setupsettings/${guild.id}/settings.cfg`,
      )
    ) {
      console.log("Settings file does not exist. Creating settings file.");
      createSettingsFile(guild.id);
    }

    try {
      //Category

      if (!settings.category) {
        let category = await guild.channels.create({
          name: "Temporary Voice Create",
          type: ChannelType.GuildCategory,
        });
        thecategoryId = category.id;
        console.log("Category created with ID:", thecategoryId);
        settings.category = thecategoryId;
      }

      if (!settings.voiceChannelId) {
        let voice = await guild.channels.create({
          name: "Temporary Voice Create",
          type: ChannelType.GuildVoice,
        });
        thevoiceChannelId = voice.id;
        console.log("Voice created with ID:", thevoiceChannelId);
        settings.voiceChannelId = thevoiceChannelId;
      }

      writeSettingsFile(settings, guild.id);

      try {
        const voice = await guild.channels.fetch(settings.voiceChannelId);
        const catvoice = await guild.channels.fetch(settings.category);

        if (
          !(voice instanceof GuildChannel) ||
          !(catvoice instanceof GuildChannel)
        ) {
          throw new Error("Voice channel or category not found");
        }

        await voice.setParent(catvoice, { lockPermissions: false });
        console.log("Voice channel moved to category");
        await interaction.reply({
          content: `Voice Channels moved to category.`,
          ephemeral: true,
        });
      } catch (error) {
        console.log(error);
        console.error("Error moving voice channel to category:");
      }
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: `There was an error while using the command.`,
        ephemeral: true,
      });
    }
  },
};
