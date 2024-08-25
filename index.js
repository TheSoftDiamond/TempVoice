// Invoke necessary modules for the bot to run

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { channelOwners } = require("./methods/channelowner");
const { togglePrivate } = require("./methods/private");
const token = process.env.DISCORD_TOKEN;

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
function readSettingsFile(guild) {
  const fileContents = fs.readFileSync(
    `./globalserversettings/setupsettings/${guild}/settings.cfg`,
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

/* function  checkIdInFile(channelid)
 *
 * description: Creates a settings file for the guild
 *
 * parameters: string channelid: The channel id to check for in the settings file
 * 			   string guildId: The guild id to get the settings for
 *
 *
 * Returns: None
 */
function checkIdInFile(guildId, channelid) {
  const filePath = `./globalserversettings/permvoice/${guildId}/settings.cfg`;

  try {
    // Read the existing settings file
    let fileContent = fs.readFileSync(filePath, "utf-8");

    // Split the file into lines
    const lines = fileContent.split("\n");

    for (const line of lines) {
      if (line.trim() === channelid) {
        return true; // Channel id found in the file
      }
    }

    return false; // Channel id not found in the file
  } catch {
    //console.error('Error reading settings file:', error);
    return false;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  //Handle the channel deletion if the channel is empty
  if (oldState.channelId) {
    const guild = oldState.guild;
    const settings = readSettingsFile(guild.id);
    guild.channels
      .fetch(oldState.channelId)

      //Handle Channel deletion
      .then((oldChannel) => {
        if (
          oldChannel.parentId === settings.category &&
          oldChannel.members.size === 0 &&
          oldChannel.id !== settings.voiceChannelId
        ) {
          if (checkIdInFile(guild.id, oldChannel.id)) {
            return;
          }
          channelOwners.delete(oldChannel.id);
          oldChannel
            .delete()
            .then(() => {
              //console.log(`Deleted empty channel: ${oldChannel.name}`);
            })
            .catch(() => {
              //console.error('Error deleting channel:', error);
            });
          return;
        }
      });
  }
  //Handle the channel creation if the user joins the create channel
  if (newState.channelId) {
    const guild = newState.guild;
    const settings = readSettingsFile(guild.id);
    if (newState.channelId === settings.voiceChannelId) {
      //const guild = newState.guild;

      const category = guild.channels.cache.get(settings.category);
      if (category && category.type === ChannelType.GuildCategory) {
        guild.channels
          .create({
            name: `${newState.member.user.username}'s Channel`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
              {
                id: newState.member.id,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                  PermissionFlagsBits.ViewChannel,
                ],
              },
            ],
          })
          .then((channel) => {
            newState.member.voice.setChannel(channel);
            //console.log(`Created voice channel: ${channel.name}`);

            //Set the owner of the channel to the one the user who created the channel
            channelOwners.set(channel.id, newState.member.id);

            // Set the channel's private state to false,
            // this can be adjusted by the user toggling the channel's visibility via /private
            togglePrivate.set(channel.id, 0);

            const embed = new EmbedBuilder()
              .setTitle("✏️ **Control your temporary channel**")
              .setDescription(
                "**Use the following buttons to modify the channel's " +
                  "settings or various slash commands to control how the channel works." +
                  "\n\nYou can use commands such as:\n\nUtility Commands:\n`/rename`\n`/lock`" +
                  "\n`/private`\n`/bitrate`\n`/limit`\n`/region`\n`/waitingroom`\n\n" +
                  "Moderation Comamnds:\n`/ban`- To ban a user from your channel\n" +
                  "`/unban` - To unban a user from your channel\n`/kick` - Remove a user from" +
                  " the channel without banning\n`/owner` - Change the owner of the channel" +
                  " (requires you to own the said channel.\n\n **",
              )
              .setColor("#f5cc00")
              .setTimestamp();

            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("button_id")
                .setLabel("Click Me")
                .setStyle(ButtonStyle.Primary),
            );
            //channel.send({ content: '', embeds: [embed], components: [actionRow] });
            channel.send({ content: "", embeds: [embed] });
          })
          .catch(() => {
            //console.error('Error creating voice channel:', error);
          });
        return;
      }
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);

  //TODO Add a check for the command to see if it is a button press

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({
        content:
          `Please wait, you are on a cooldown for \`${command.data.name}\`.` +
          ` You can use it again <t:${expiredTimestamp}:R>.`,
        ephemeral: true,
      });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(token);
