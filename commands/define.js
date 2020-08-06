/**
 * author: ap4gh(Github)
 * license: MIT https://opensource.org/licenses/MIT
 */
const settings = require("../settings");
const Discord = require("discord.js");




module.exports.help = "Search DuckDuckGo for a word's definition";
module.exports.category = 'Knowledge';
module.exports.args = ['Search String'];

// run function for !define command:
exports.run = (client, message, args) => {
  if(Array.isArray(args))
    args = args.map(a => typeof a == "string" ? a.toLowerCase() : a);

  if (args.length === 0)
    return sendMessage(message, `Use \`${settings.command_prefix}define --help\` to display the command guide.`);
  runUserCommand(message, args.split(' '), args.split(' ')[0]);
};




/**
 * command_name: define
 * description: Provides definition for words from web.
 * npm_dependencies: { request, request-promise-native }
 */

const request = require('request-promise-native');

const maxRelatedTopics = 4;

/*
    ------------ HELPER FUNCTIONS ------------
*/

/**
 * name: notifyErrors
 * description: Notify maintainer and the end-user about the error.
 * param: {Object.Prototype} message discord message object
 * param: {Error} err error message
 */
const notifyErrors = (message, err = '') => {
  // maintainer can be changed by changing the maintainer ID
  // from the top of the file.
  const maintainer = message.guild.member(settings.mainMaintainerID);
  maintainer.send(`Message ID: ${message.id}`);
  maintainer.send('```' + err + '```');
  message.channel.send(
    `Some internal error occured, maintainer ${maintainer} has been notified.`
  );
};
/**
 * name: sendMessage
 * description: checks for errors and sends message to the channel.
 * param: {Object.Prototype} message discord message object
 * param: {String} messageContent text, embed, image path etc.
 */
const sendMessage = (message, messageContent) => {
  try {
    message.channel.send(messageContent);
  } catch (e) {
    console.error(e);
    return notifyErrors(message, e);
  }
};
/**
 * name: generateQueryURL
 * description: generate api query URL for service.
 * param: {String} serve The service to look for definition wiki, ddg etc.
 * param: {String} phrase search phrase entered by end-user.
 */
const generateQueryURL = (phrase, service = 'ddg') => {
  const queryURLs = {
    wiki: `https://en.wikipedia.org/w/api.php?action=opensearch&list=search&search=${phrase}&format=json&formatversion=2`,
    ddg: `https://api.duckduckgo.com/?q=${phrase}&format=json`
  };
  return encodeURI(queryURLs[service]);
};
/**
 * name: runCommand
 * description: screen command and return the function running that command.
 * param: {Object.Prototype} message discord message object
 * param: {Array.Prototype} args arguments passed with the command
 * param: {String} commandName name of command
 */
const runUserCommand = (message, args, commandName) => {
  const availableCommands = {
    '--help': showHelp,
    // wiki: wikipediaOpenSearch,
    default: ddgInstantAnswer
  };

  // if(args[0] == "wiki")
  //   args.shift();

  // if commandName does not match any, return default
  return (availableCommands[commandName] || availableCommands.default)(
    message,
    args
  );
};

/*
    ------------ COMMAND FUNCTIONS ------------
*/

/**
 *      •• DUCKDUCKGO INSTANT ANSWER ••
 */
const ddgInstantAnswer = async (message, args) => {
  // join args to create a search phrase
  const searchPhrase = args.join(' ');
  let data;
  try {
    data = await request({
      url: generateQueryURL(searchPhrase),
      json: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error(e);
    // if request fails report errors
    return notifyErrors(message, e);
  }
  let result = `:mag: \`${searchPhrase}\`\n`;
  const relatedTopics = data['RelatedTopics'];
  const abstractText = data['AbstractText'];
  const abstractURL = data['AbstractURL'];
  // if no data is provided:
  if (relatedTopics.length === 0) {
    result += `Cannot find information on *${searchPhrase}* - Read the command guide with \`${settings.command_prefix}define --help\` for more information.`;
  } // if abstract data is missing:
  else if (!abstractText || !abstractURL) {
    result += `*"${searchPhrase}" may refer to following things*  :point_down:\n\n`;
    for (let topic of relatedTopics) {
      // keeping maximum of 3 related topics to be displayed.
      // maximum related topics can be changed at the top.
      // NOTE: discord do not allow a message length > 2000
      // characters.
      if (
        topic['Text'] === undefined ||
        topic['FirstURL'] === undefined ||
        relatedTopics.indexOf(topic) >= maxRelatedTopics
      )
        break;
      result += `${topic['Text']}\n${topic['FirstURL']}\n\n`;
    }
  } // if abstract data exist:
  else {
    result += '```' + abstractText + '```:link: ' + abstractURL;
  }
  return sendMessage(message, result);
};

/**
 *      •• WIKIPEDIA OPEN SEARCH ••
 */
const wikipediaOpenSearch = async (message, args) => {
  args.shift();
  // join args after 'wiki' to create a search phrase
  const searchPhrase = args.join(' ');
  let data;
  try {
    let url = generateQueryURL(searchPhrase, 'wiki');
    data = await request({
      url: url,
      json: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error(e);
    return notifyErrors(message, e);
  }
  // all definitions:
  const definitions = data[2];
  // all wikipedia page links:
  const links = data[3];
  // main definition page link:
  let wikipediaPageLink = ':link: ' + links[0];
  let result = definitions[0];
  // no information is received from wikipedia:
  if (!result) {
    result = `Couldn't find information on *${searchPhrase}*`;
  } // a word have more than one meaning:
  else if (result.match(/may refer to/g)) {
    result =
      `:mag: **Wikipedia**: \`${searchPhrase}\`\n\n` +
      '```\n' +
      result +
      '\n\n';
    // remove useless definition at index 0:
    definitions.shift();
    // collect related definition:
    let nonEmptyDefinitions = [];
    for (let d of definitions) if (d.length > 0) nonEmptyDefinitions.push(d);
    for (let i = 0; i < maxRelatedTopics; ++i) {
      if (nonEmptyDefinitions[i] == undefined) break;
      result += `${i + 1}. ${nonEmptyDefinitions[i]}\n\n`;
    }
    result += '```';
  } // exact meaning is obtained:
  else {
    result =
      `:mag: ${searchPhrase}` + '```' + result + '```' + wikipediaPageLink;
  }
  return sendMessage(message, result);
};

/**
 *      •• HELP COMMAND ••
 * send help to user
 */
const showHelp = (message, args) => {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle(`${settings.command_prefix}define - Help:`)
        .addField("**Description:**", `The \`${settings.command_prefix}define\` command looks up abstract information on a word or sentence from DuckDuckGo or Wikipedia.`)
        .addField("**Commands:**", `1) \`${settings.command_prefix}define [search text]\` - Looks up the search text on DuckDuckGo\n2) \`${settings.command_prefix}define wiki [search text]\` - Returns the definition of the search text on Wikipedia\n3) \`${settings.command_prefix}define --help\` - Displays this help message`)
        .addField("**Example Usage:**", `\`${settings.command_prefix}define yellow stone\`\n\`${settings.command_prefix}define wiki Object Oriented Programming\``)
        .setFooter(`Command made by ap4gh (https://github.com/ap4gh) - ${settings.embed.footer}`)
        .setColor(settings.embed.color);

        /*
        GUIDE:
        !define will only show definition on receiving exact info,
        in case a word have more than one meaning, related topics
        (not more than three) will be displayed. To get more acc-
        urate results pass more keywords in search phrase sepearted  
        with spaces. Eg: 'react' means many things but if you want 
        to get definition for 'reactjs' use command like this:
        > !define reactjs
                OR
        > !define wiki react javascript
        For now, !define only provide information about things, places,
        events, news etc. and does not provide meaning of the words from
        english dictionary. DDG bang redirects will also not work here.
        */

    message.channel.send(helpEmbed);
};