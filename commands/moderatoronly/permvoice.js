const { Client, SlashCommandBuilder, PermissionFlagsBits , ChannelType, GuildChannel } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');

/* function  createSettingsFile()
 * 
 * description: Creates a settings file for the guild
 * 
 * parameters: string guildId: The guild id to get the settings for
 * 
 * Returns: None
 */
function createSettingsFile(guildId) {
  const directoryPath = `./globalserversettings/permvoice/${guildId}`;
  const filePath = `${directoryPath}/settings.cfg`;
  const fileContents = ``;

  try {
    fs.mkdirSync(directoryPath, { recursive: true });
    fs.writeFileSync(filePath, fileContents, 'utf8');
    console.log('Settings file created successfully');
  } catch (error) {
    console.error('Error creating settings file:', error);
  }
}

/* function  managePermVoiceChannels()
 * 
 * description: Creates a settings file for the guild
 * 
 * parameters: string guildId: The guild id to get the settings for
 *             string channelid: The channel id to add or delete from th settings file
 * 
 * Returns: None
 */
function managePermVoiceChannels(guildId, channelid) {
    const filePath = `./globalserversettings/permvoice/${guildId}/settings.cfg`;
    
    //Read the existing settings file
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split the file into lines
    const lines = fileContent.split('/\r?\n/').filter(line => line.trim());
    console.log(lines)

    // Check if the channel id exists in the file
    if (lines.includes(channelid)) {
      //Remove the channel id from the file
      const lines = fileContent.split('\n');
      const updatedLine = lines.filter(line => line !== channelid);
      fileContent = updatedLine.join('\n');
    } else {
      //Add the channel id to the file
      fileContent += channelid + '\n';
    }

    //Write the updated file
    fs.writeFileSync(filePath, fileContent, 'utf-8');
}

module.exports = {
  category: 'permanentvoice',
  data: new SlashCommandBuilder()
    .setName('permvoice')
    .setDescription('Change the user limit.')
    .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('The create voice channel id to use.')
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice, ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildMedia, ChannelType.GuildAnnouncement)
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const guild = interaction.guild
    const target = interaction.options.getChannel('channel');

    if (!fs.existsSync(`./globalserversettings/permvoice/${guild.id}/settings.cfg`)) {
      console.log("Settings file does not exist. Creating settings file.");
      createSettingsFile(guild.id);
    }

    //Method to set the channel permanent status toggles
        try {
            managePermVoiceChannels(guild.id, target);
            await interaction.reply({ content:`The channel ${target} has been toggled.`, ephemeral: true });
            
        } catch (error) {
          await interaction.reply({ content:`There was an error while using the command.`, ephemeral: true });
          console.log(error);
        }
    
  },
};