const Discord = require("discord.js");
/**
 * Collection for owners of a channel that is accessed in various files
 */
const channelOwners = new Discord.Collection();

exports.channelOwners = channelOwners;
