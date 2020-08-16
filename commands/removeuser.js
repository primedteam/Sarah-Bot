module.exports.run = async (Client, message, args, Con, Discord, Config) => {
    Con.query(`SELECT * FROM Tickets WHERE ChannelID = '${message.channel.id}'`, async (error, result) => {
        if(error) return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Mysql Error (Close Ticket #1)').setDescription(error).setTimestamp());
        if(result.length <= 0) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle(`Sorry ${message.author.tag}!`).setDescription(`This is not a ticket on our database. Please delete this channel manually if needed.`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})});
        if(message.channel.id !== result[0].ChannelID) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle(`Sorry ${user.tag}!`).setDescription(`This is not a ticket on our database. Please delete this channel manually if needed.`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})});
        let channel = message.channel;
        let TicketData = result[0];
        let UserAdd = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if(!UserAdd) return channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setDescription('You did not tag an user or give an ID!').setTitle('Opps!').setTimestamp().setFooter('Please Try Again')).then(async (msg) => { msg.delete({timeout: 10000, reason: 'Removed Missing UserAdd!'}); });

        channel.updateOverwrite(UserAdd, {SEND_MESSAGES: false, VIEW_CHANNEL: false}, `Removed ${UserAdd} from a support ticket!`).then(async () => {
            return channel.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle(`Removed user!`).setDescription(`I removed ${UserAdd} from your support ticket!`).setTimestamp().setFooter('Your Welcome! ')).then(async (msg) => { msg.delete({timeout: 30000, reason: 'Removed Added User!'}); });
        }).catch(() => {})
    })
}

module.exports.help = {
  name: "removeuser",
  desc: "Removes a user from a ticket",
  rolesShow: ["everyone"]
}
