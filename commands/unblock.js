module.exports.run = async (Client, message, args, Con, Discord, Config) => {
    if(message.member.roles.cache.some(role => role.id === Config.roles.executives) || message.member.roles.cache.some(role => role.id === Config.roles.genmanager)){
        let user = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
        if(!user) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setDescription('You did not tag an user or give an ID!').setTitle('Opps!').setTimestamp().setFooter('Please Try Again')).then(async (msg) => { msg.delete({timeout: 10000, reason: 'Removed Missing User!'}); });

        Con.query(`SELECT * FROM bannedUsers WHERE UserID = '${user.id}';`,async (error, result) => {
            if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Check User Ban)').setDescription(error).setTimestamp());
            if(result.length > 0){
                Con.query(`DELETE FROM bannedUsers WHERE UserID = '${user.id}'`, async (error, result) => {
                    if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Insert User Ban)').setDescription(error).setTimestamp());
                    message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setDescription('Enjoy!').setTitle('All done!'));
                })   
            } else {
                return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setDescription(`The user is not banned!`)).then((msg) => {msg.delete({timeout: 10000, reason: 'Deleted after 10s delay'})})
            }
        })
    } else {
        return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setDescription(`You do not have the correct roles to exacute this command!`)).then((msg) => {msg.delete({timeout: 10000, reason: 'Deleted after 10s delay'})})
     }
}

module.exports.help = {
  name: "unblock",
  desc: "Unblocks the user from using the bot.",
  allowedRoles: ["genmanager", "executives", "staff"],
  rolesShow: ["genmanager", "executives", "staff"]
}
