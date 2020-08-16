module.exports.run = async (Client, message, args, Con, Discord, Config) => {
  if(!args[0]){
    message.channel.send(new Discord.MessageEmbed().setTitle('Loading Please Wait...').setColor(Config.colors.prompt).setFooter('Checking your roles.. ').setTimestamp()).then(async (msg) => {
      let Data = Client.commands;
      let ListOfCommands = ``;
      Data.forEach(async (item, index) => {
        let showCMD = false;
        item.help.rolesShow.forEach(async (itemRole, indexRole) => {
          if(message.member.roles.cache.some(role => role.id === Config.roles[itemRole])) showCMD = true;
        })
        if(showCMD){
          ListOfCommands = ListOfCommands + '» ' + Config.bot.prefix + item.help.name + '\n';
        }
      })
      await sleep(1000);
      msg.edit(new Discord.MessageEmbed().setTitle('Help Commands').setColor(Config.colors.complete).setFooter('Commands show base on roles! ').setTimestamp().setDescription(ListOfCommands))
    })
  } else {
    if(args[0]){
      if(Client.commands.find(g => g.help.name === args[0])){
        let Data = Client.commands.find(g => g.help.name === args[0]);
        let AllowedRolesT = ``;
          if(!Data.help.allowedRoles || Data.help.allowedRoles.length <= 0){
            AllowedRolesT = message.guild.roles.cache.find(n => n.name === "@everyone");
          } else {
            Data.help.allowedRoles.forEach((item, index) => {
              AllowedRolesT = AllowedRolesT + '<@&' + Config.roles[item] + '>' + ', ';
            })
          }
        let ShowRolesT = ``;
          if(!Data.help.rolesShow || Data.help.rolesShow.length <= 0){
            ShowRolesT = '<@&' + message.guild.roles.cache.find(n => n.name === "@everyone").id + '>';
          } else {
            Data.help.rolesShow.forEach((item, index) => {
              ShowRolesT = ShowRolesT + '<@&' + Config.roles[item] + '>' + ', ';
            })
          }
          message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle('Command info | ' + Data.help.name).addField('Description.', Data.help.desc).addField('Can show to.', ShowRolesT).addField('Allowed to use command.', AllowedRolesT).setFooter('Made by Spooder#1111 ').setTimestamp())
      } else {
        return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setDescription(`Command missing! Please try again!`)).then((msg2) => {msg2.delete({timeout: 6000, reason: 'Deleted after 6s delay'})})
      }
    }
  }
}

async function sleep(ms){
return new Promise(async (resolve) => {
  setTimeout(resolve,ms);
})
}
module.exports.help = {
name: "help",
desc: "Shows help command",
rolesShow: ["everyone"]
}
