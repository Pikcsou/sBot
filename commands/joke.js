const jsl = require("svjsl");
const settings = require("../settings.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const Discord = require("discord.js");


module.exports.help = "Tells you a random joke";
module.exports.category = "Fun";
module.exports.args = ["Category"];
module.exports.run = (client, message, args) => {
    try {
		args = args.split(" ");
		if(args.length == 1) {
			let loadingembed = new Discord.MessageEmbed()
				.setFooter("Loading...", settings.loadingURL)
				.setColor(settings.embed.color);
			message.channel.send(loadingembed).then(smsg => {

				let catxhr = new XMLHttpRequest();
				catxhr.open("GET", `${settings.command_settings.joke.baseURL}/categories`);
				catxhr.onreadystatechange = () => {
					if(catxhr.readyState == 4 && catxhr.status == 200) {
						let availableCategories = JSON.parse(catxhr.responseText).categories, jokeCategory;

						if(args[0] === "") {
							let noCat = new Discord.MessageEmbed()
								.setColor(settings.embed.color)
								.setDescription(`**Joke category was left empty - Please specify any of the following categories (case sensitive):**\n- ${JSON.parse(catxhr.responseText).categories.join("\n- ")}\n\nExample: \`${settings.command_prefix}joke Miscellaneous\`\n\nTo submit a joke, please [click here](${settings.command_settings.joke.baseURL}#submit)`);
							return smsg.edit(noCat);
						}

						if(!availableCategories.includes(args[0])) {
							let wrongCat = new Discord.MessageEmbed()
								.setColor(settings.embed.color)
								.setDescription(`**Couldn't find the category \`${args[0]}\` - Please use any of the following (case sensitive):**\n- ${JSON.parse(catxhr.responseText).categories.join("\n- ")}\n\nExample: \`${settings.command_prefix}joke Miscellaneous\``);
							return smsg.edit(wrongCat);
						}
						else jokeCategory = args[0];

						var xhr = new XMLHttpRequest();
						xhr.open("GET", `${settings.command_settings.joke.baseURL}/joke/${jokeCategory}`, true);
						xhr.setRequestHeader("Content-type", "application/json; utf-8");
						xhr.onreadystatechange = () => {
							if(xhr.readyState == 4 && xhr.status == 200) {
								let joketype = JSON.parse(xhr.responseText).type;
								var joke = "";

								if(joketype == "single") {
									let embed = new Discord.MessageEmbed()
										.setDescription(JSON.parse(xhr.responseText).joke)
										.setFooter(`#${JSON.parse(xhr.responseText).id} - Category: ${JSON.parse(xhr.responseText).category} - Powered by JokeAPI (${settings.command_settings.joke.baseURL})`, settings.command_settings.joke.icon)
										.setColor(settings.embed.color);
									return smsg.edit(embed);
								}
								else if(joketype == "twopart") {
									let embed = new Discord.MessageEmbed()
										.setDescription(JSON.parse(xhr.responseText).setup + "\n\n(...)")
										.setFooter(`#${JSON.parse(xhr.responseText).id} - Category: ${JSON.parse(xhr.responseText).category} - Powered by JokeAPI (${settings.command_settings.joke.baseURL})`, settings.command_settings.joke.icon)
										.setColor(settings.embed.color);
									smsg.edit(embed).then(m => {
										setTimeout(()=>{
											let nembed = new Discord.MessageEmbed()
												.setDescription(JSON.parse(xhr.responseText).setup + "\n\n" + JSON.parse(xhr.responseText).delivery)
												.setFooter(`#${JSON.parse(xhr.responseText).id} - Category: ${JSON.parse(xhr.responseText).category} - Powered by JokeAPI (${settings.command_settings.joke.baseURL})`, settings.command_settings.joke.icon)
												.setColor(settings.embed.color);
											return m.edit(nembed);
										}, 4000);
									});
								}
							}
							else if(xhr.readyState == 4 && xhr.status >= 400) {
								let nrembed = new Discord.MessageEmbed()
									.setColor(settings.embed.color)
									.setDescription(`The Joke API couldn't be reached. Maybe it is down at the moment or you've sent too many requests. Please try again in a few hours.\n\nStatus code: ${xhr.status} - ${xhr.responseText}`);
								return smsg.edit(nrembed);
							}
						};
						xhr.send();
						
					}
				}
				catxhr.send();
			});
		}
    }
    catch(err) {
        message.reply("📡 Couldn't connect to the joke API.\nError: " + err);
    }
}