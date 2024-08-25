const fs = require("fs");
const _ = require("lodash");

/**
 * @class Settings
 * @classdesc loads and saves settings for the entire app.
 */
class Settings {
  /**
   * Global settings loaded in memory.
   * @private
   * @var {object} setting
   */
  setting = {};
  permVoiceTemplate = _.template(
    `g-<%= guildId %>.permVoice.c-<%= channelId %>`,
  );

  /**
   * Loads settings from file into memory.
   */
  constructor() {
    let file = {};
    try {
      if (!fs.existsSync(process.env.SETTINGSFILE)) {
        const pathPieces = process.env.SETTINGSFILE.split("/");
        pathPieces.pop();
        fs.mkdirSync(pathPieces.join("/"), { recursive: true });
        fs.writeFileSync(process.env.SETTINGSFILE, "{}", "utf8");
      }
      file = fs.readFileSync(process.env.SETTINGSFILE, "utf8");
    } catch (e) {
      console.error(
        `Error loading settings file from ${process.env.SETTINGSFILE}`,
        e.message,
      );
    }

    try {
      this.setting = JSON.parse(file);
    } catch (e) {
      console.error("Error parsing JSON from settings file!!", e.message);
    }
    // Will save after 10 seconds of the last update call, but will save every 60 seconds no matter what.
    this._save = _.debounce(_.bind(this._save, this), 10000, {
      maxWait: 60000,
    });
  }

  /**
   * async save/update settings file after an update to the data has been made.
   * This function is debounced
   * @private
   */
  _save() {
    fs.writeFile(
      process.env.SETTINGSFILE,
      JSON.stringify(this.setting),
      "utf8",
      (err) => {
        if (err) {
          console.error(
            "Settings have been updated but failed to save!",
            err.message,
          );
        } else {
          console.log("Settings have been updated");
        }
      },
    );
  }

  /**
   * Toggles the permission for voice of a channel
   * @param {string} guildId The guild id to get the settings for
   * @param {string} channelId The channel id to add or delete from th settings file
   */
  togglePermVoiceChannel(guildId, channelId) {
    _.set(
      this.setting,
      this.permVoiceTemplate({ guildId, channelId }),
      !_.get(
        this.setting,
        this.permVoiceTemplate({ guildId, channelId }),
        false,
      ),
    );
    this._save();
  }

  /**
   * Checks if a channel has permission or not.
   * @param {string} guildId The guild id to get the settings for
   * @param {string} channelId The channel id to check
   * @return {boolean}
   */
  doesChannelHavePermVoice(guildId, channelId) {
    return _.get(
      this.setting,
      this.permVoiceTemplate({ guildId, channelId }),
      false,
    );
  }
}

module.exports = new Settings();
