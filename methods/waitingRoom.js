const Discord = require("discord.js");
/**
 * Collection for owners of a channel that is accessed in various files
 */
const waitingRoom = new Discord.Collection();

exports.waitingRoom = waitingRoom;
