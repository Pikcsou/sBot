const settings = require("../settings.js");
const Discord = require("discord.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports.help = "Tells you a random / useless fact";
module.exports.category = "Knowledge";
module.exports.args = [];
module.exports.run = (client, message, args) => {
    let loadingembed = new Discord.MessageEmbed()
        .setFooter("Loading...", settings.loadingURL)
        .setColor(settings.embed.color);
    message.channel.send(loadingembed).then(smsg => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", settings.command_settings.fact.url, true);
        xhr.onreadystatechange = () => {
            if(xhr.readyState == 4 && xhr.status < 400) {
                let fact = "";
                let source = "";
                try
                {
                    fact = JSON.parse(xhr.responseText).text;
                    source = JSON.parse(xhr.responseText).source_url;
                }
                catch(err)
                {
                    let errEmbed = new Discord.MessageEmbed()
                        .setColor(settings.embed.color)
                        .setDescription(`Couldn't reach the uselessfacts API - Status: ${xhr.status} - Response: ${xhr.responseText ? xhr.responseText : "(none)"}`)
                        .setFooter(`Powered by the uselessfacts API (http://randomuselessfact.appspot.com/) - ${settings.embed.footer}`);
                    smsg.edit(errEmbed);
                    return;
                }

                let successEmbed = new Discord.MessageEmbed()
                    .setColor(settings.embed.color)
                    .setDescription(`${fact}\n\n\n[(Source)](${source})`)
                    .setFooter(`Powered by the uselessfacts API (http://randomuselessfact.appspot.com/) - ${settings.embed.footer}`);
                smsg.edit(successEmbed);
            }
            else if(xhr.readyState == 4 && xhr.status >= 400) {
                let errEmbed = new Discord.MessageEmbed()
                    .setColor(settings.embed.color)
                    .setDescription(`Couldn't reach the uselessfacts API - Status: ${xhr.status}`)
                    .setFooter(`Powered by the uselessfacts API (http://randomuselessfact.appspot.com/) - ${settings.embed.footer}`);
                smsg.edit(errEmbed);
            }
        };
        xhr.send();
    });
};