module.exports.run = async (Client, message, args, Con, Discord, Config) => {
    Con.query('SELECT * FROM Tickets LIMIT 1;', async (error, result) => {
        let cmError = true;
        if(error){
            cmError = false;
            console.log(error)
        }
        message.channel.send(new Discord.MessageEmbed().setDescription(`Hello! How are you?\nDatabase Online?: ${cmError}`).setColor(Config.colors.complete)).then((msg) => {msg.delete({timeout: 10000, reason: 'Deleted msg after 10s delay'})});
    })
}

module.exports.help = {
  name: "hello",
  desc: "Sup!",
  rolesShow: ["everyone"]
}
