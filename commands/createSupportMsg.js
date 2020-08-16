module.exports.run = async (Client, message, args, Con, Discord, Config) => {
  const fs = require('fs');

  if(message.member.roles.cache.some(role => role.id === Config.roles.executives) || message.member.roles.cache.some(role => role.id === Config.roles.genmanager)){
    let MsgDescription = '';


    Config.supportReasons.forEach(async (item, index) => {
      if(item.type.includes("question-")){
        MsgDescription = MsgDescription + item.emoji + '» ' + item.message + '\n';
      } else {
        MsgDescription = MsgDescription + item.emoji + '» ' + item.message + '\n\n';
      }
    });

    MsgDescription = MsgDescription + '**DM/PMs Must be opened!**'
    
    let TicketChannel = message.guild.channels.cache.find(g => g.id === Config.channels.tickets);
    if(TicketChannel === undefined || TicketChannel === null || !TicketChannel) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setDescription('The channel needed: `tickets` is missing please put the id in the config and reboot the bot!').setTitle('Channel missing!'));

    if(Config.supportMsg){
      message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setDescription('Please make sure you delete all old messages from this bot and other users/bot!').setTitle('Quick Warning!'));
      Config.supportMsg = "";
      fs.writeFile('./config.json', JSON.stringify(Config, null, 2), (err) => {
        if (err){
          return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Can\'t rewrite config!').setDescription(err).setTimestamp())
        }
        return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle('Config was updated!').setDescription('Updated `supportMsg`').setTimestamp())
      });
    }

    TicketChannel.send(new Discord.MessageEmbed().setColor(Config.colors.prompt).setDescription(MsgDescription).setTitle('Please click an reaction below from the list.').setFooter("Some reactions require DMS to be opened!")).then(async (msg) => {
      Config.supportReasons.forEach(async (item, index) => {
        await msg.react(item.emoji).catch(() => {})
      })
      Config.supportMsg = msg.id;
      fs.writeFile('./config.json', JSON.stringify(Config, null, 2), (err) => {
        if (err){
          return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Can\'t rewrite config!').setDescription(err).setTimestamp())
        }
        return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle('Config was updated!').setDescription('Updated `supportMsg`').setTimestamp())
      });
      message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setDescription('Enjoy!').setTitle('All done!')).then((msg) => {msg.delete({timeout: 10000, reason: 'Deleted after 10s delay'}).catch(() => {})});
    });
  } else {
    return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setDescription(`You do not have the correct roles to exacute this command!`)).then((msg) => {msg.delete({timeout: 10000, reason: 'Deleted after 10s delay'})})
  }
}

module.exports.help = {
  name: "csm",
  desc: "Recreats the support message!",
  allowedRoles: ["genmanager", "executives"],
  rolesShow: ["genmanager", "executives"]
}
