const settings = require("../settings.js");
const jsl = require("svjsl");

module.exports.isAdminCommand = true;
module.exports.help = "Sends a message as " + settings.bot_name + " (in a different channel if one is specified, else in the same one)";
module.exports.args = ["?Channel", "Message"];
/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {*} args 
 */
module.exports.run = (client, message, args) => {
    var sayInChannel, sendMsg;

    var allowToUse = false;
    for(let i = 0; i < settings.dev_ids.length; i++) if(message.author.id == settings.dev_ids[i]) allowToUse = true;

    if(jsl.isEmpty(args))
        return message.delete();
    if(args.split(" ")[0].split("")[0] == "<" && args.split(" ")[0].split("")[1] == "#") {
        sayInChannel = args.split(" ")[0];
        sayInChannel = sayInChannel.substring(2, sayInChannel.length - 1);
        sendMsg = args.split(" ");
        sendMsg.shift();
        sendMsg = sendMsg.join(" ");
    }

    if(message.member.permissions.has("MANAGE_MESSAGES") || allowToUse) {
        if(jsl.isEmpty(sayInChannel)) {
            message.delete().then(m=>{
                message.channel.send(args);
            });
        }
        else {
            try {
                message.guild.channels.cache.find(ch => ch.id == sayInChannel).send(sendMsg);
                message.react("✅");
                setTimeout(() => message.delete(), 2000);
            }
            catch(err) {
                message.channel.send(args);
            }
        }
    }
    else return message.reply("you don't have enough permissions to do that!");
}