const Discord = require('discord.js');
const client = new Discord.Client();
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chalk = require('chalk');
const fsExtra = require('fs-extra');
var config = JSON.parse(fs.readFileSync('config.json'));
client.con = mysql.createPool({
  connectionLimit : 100,
  host: config.mysql.ip,
  user: config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.db
});

client.con.on('enqueue', function () {
  return console.log('Waiting for available connection slot')
});

client.systemChannel = [];
client.systemRoles = [];
client.config = config;
client.commands = new Discord.Collection();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(config.bot.activity.name, {type: config.bot.activity.type})
  for (const [name, data] of Object.entries(config.channels)) {
    client.systemChannel[name] = client.channels.cache.find(g => g.id === data)
  }

  for (const [name, data] of Object.entries(config.roles)) {
    client.systemRoles[name] = client.guilds.cache.find(g => g.id === config.bot.guild).roles.cache.find(g => g.id === data)
  }

  fs.readdir("./commands/", (err, files) => {
    if(err){
         console.log(chalk.red('ERROR Commands: ') + err);
         client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('ERROR ON COMMAND LOAD!').setDescription(err).setTimestamp())
    }
      const jsfile = files.filter(f => f.split(".").pop() === "js");
      if(jsfile.length <= 0){
        console.log(chalk.red('ERROR: ') + 'No Commands Found!');
        client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('ERROR: No Commands Found!').setTimestamp())

        process.exit(0);
        return;
      }
      jsfile.forEach((f, i) =>{
          const props = require(`./commands/${f}`);
          client.commands.set(props.help, props);
          console.log(chalk.green('Command Loaded:'), chalk.white(`${props.help.name} (${f})`));
      });
      client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.complete).setTitle('Im Online with ' + client.commands.size + ' commands!').setTimestamp())
      if(config.bot.guild && config.supportMsg && config.channels.tickets && client.systemChannel["tickets"]){
        client.systemChannel["tickets"].messages.fetch(config.supportMsg).then(() => {}).catch(error => {
          client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Missing supportMsg!').setTimestamp())
        })
      } else {
        client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Missing supportMsg Or guild Or tickets Or tickets channel is missing!').setTimestamp())

      }
  })
});

client.on('message', async (message) => {
  if(message.content.startsWith('S-Eval')){
    if(config.specialusers.includes(message.author.id)){
      const clean = text => {
        if (typeof(text) === "string")
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else
            return text;
    };
        const args = message.content.split(" ").slice(1);
            try {
                const code = args.join(" ");
                let evaled = eval(code);

                if (typeof evaled !== "string")
                    evaled = require("util").inspect(evaled);

                message.channel.send(clean(evaled), {code:"xl"});
            } catch (err) {
                message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
            }
    }
  }
})

client.on('guildMemberAdd', async (user) => {
  try {
    user.roles.set(config.info.defaultRoles, 'User joined.')
  } catch (error) {
    console.log(error)
    return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Error on user roles set.').setDescription(error).setTimestamp());
  }
})

client.on('message', async (message) => {
  if(message.author.bot) return; //If Bot Does Command Stop.
  if(message.channel.type === "dm") return; //If Message Type Is DM/PM Stop.
  if(message.guild.id !== config.bot.guild) return;
  if(!message.content.startsWith(config.bot.prefix)) return; //If Message Does Not Start With The Prefix That Is Set In The Console

    let messageArray = message.content.split(" "); //Splits Message
    let cmd = messageArray[0].toLowerCase(); //Finds Command Makes it LowerCase No Mater What
    let args = messageArray.slice(1); //Arguments
    let prefix = config.bot.prefix; //Prefix

    let CommandFile = client.commands.find(g => g.help.name === cmd.slice(prefix.length)); //Looking For Command
    //If No Command Found
    if(!CommandFile){
      return message.channel.send(new Discord.MessageEmbed().setColor(config.colors.missing).setDescription(`Command missing! Please do \`\`${prefix}help\`\` to read all of our active commands!`)).then((msg) => {msg.delete({timeout: 6000, reason: 'Deleted after 6s delay'})})
    } else {
      client.con.query(`SELECT * FROM bannedUsers WHERE UserID = '${message.author.id}'`, async (error, result) => {
        if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Select User Ban)').setDescription(error).setTimestamp());

        if(result.length <= 0){
          CommandFile.run(client, message, args, client.con, Discord, config);
        }
      })
    }
})

client.on('messageReactionAdd', async (reaction, user) => {
  if(reaction.message.guild.id !== config.bot.guild) return;
  if(reaction.message.id !== config.supportMsg) return;
  if(user.id == client.user.id) return;
  client.con.query(`SELECT * FROM bannedUsers WHERE UserID = '${user.id}'`, async (error, result) => {
    if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Select User Ban)').setDescription(error).setTimestamp());
    if(result.length <= 0){

      if(config.supportReasons.map(g => g.emoji).includes(reaction.emoji.name)){
        let selectedReason = config.supportReasons.find(g => g.emoji === reaction.emoji.name);
        if(selectedReason.type.includes("question-")){
          //is question that dms
          user.send(new Discord.MessageEmbed()
          .setColor(config.colors.prompt)
          .setTitle(`Q » ${selectedReason.message}`).setDescription(`A » ${selectedReason.answer}`).setFooter(`Feel free to open a ticket if needed! (Type: ${selectedReason.type})`).setTimestamp()).then(async (m) => {
            await reaction.users.remove(user);
            client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.complete).setTitle(`${user.tag} selected a question!`).setDescription(`Type: ${selectedReason.type}`).setFooter("Sent Correctly!").setTimestamp());
          }).catch(async (g) => {
            await reaction.users.remove(user);
            client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle(`${user.tag} selected a question!`).setDescription(`Type: ${selectedReason.type}`).setFooter("Could not send!").setTimestamp());
            return reaction.message.channel.send(new Discord.MessageEmbed().setColor(config.colors.missing).setTitle(`Oh no ${user.tag}!`).setDescription(`It looks like your DM/PMs are closed! Make sure they are open for me!`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})})
          })
        } else {
          //is a Ticket
          client.con.query("SELECT * FROM Tickets WHERE UserID = '" + user.id + "' AND Status = 'Open';", async (error, result) => {
            if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Reaction Add #1)').setDescription(error).setTimestamp());

            if(reaction.message.guild.member(user.id).roles.cache.some(role => role.id === config.roles.staff) || result.length <= 0){
              if(config.supportReasons.map(g => g.emoji).includes(reaction.emoji.name)){
                let channel;
                try {
                  await reaction.users.remove(user);
                  channel = await reaction.message.guild.channels.create(`ticket-${selectedReason.emoji}-creating`, {
                    type: 'text',
                    topic: `Type: ${selectedReason.type} | Ticket #: Waiting...`,
                    parent: config.category.support || null,
                    reason: `${user.tag}, create a ticket!`,
                    permissionOverwrites: [
                      {
                        id: reaction.message.guild.roles.cache.find(n => n.name === "@everyone").id,
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                      },
                      {
                        id: user.id,
                        allow: ['VIEW_CHANNEL'],
                        deny: ['SEND_MESSAGES']
                      },
                      {
                        id: client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                      }
                    ]
                  });
                  client.con.query(`INSERT INTO Tickets (UserID, CreatedAt, ClosedAt, Status, ChannelID, Issue) VALUES ('${user.id}', '${Math.floor(Date.now()/1000)}', '', 'Open', '${channel.id}', '${selectedReason.type}')`, async (error, result) => {
                    if(error) return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Mysql Error (Insert Into Database Ticket)').setDescription(error).setTimestamp());
                    channel.edit({
                      name: `ticket-${result.insertId}-${selectedReason.emoji}`,
                      topic: `Type: ${selectedReason.type} | Ticket #: ${result.insertId}`,
                      permissionOverwrites: [
                        {
                          id: reaction.message.guild.roles.cache.find(n => n.name === "@everyone").id,
                          deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                          id: user.id,
                          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                        },
                        {
                          id: client.user.id,
                          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        },
                        {
                          id: config.roles.staff,
                          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                        }
                      ]
                    })
                    .then(async (data) => {
                      channel = data;
                      channel.send(new Discord.MessageEmbed().setColor(config.colors.complete).setDescription("Hello <@" + user.id + ">, please provide as much detail as possible so we can assist you best. \nDo `" + config.bot.prefix + "close` to close this ticket at any time!\nStaff have been notified about your ticket creation!\n**We now require the following details on creation**: ``Email, Support PIN, First & Last Name, Service id (if on game panel), and Zip Code (For major issues)``").setTimestamp().setFooter('It can take up 24hrs for a response! '));
                      client.systemChannel["ticket-announcements"].send(new Discord.MessageEmbed().setColor(config.colors.complete).setTitle('Ticket #' + result.insertId + ' has been created!').setDescription(user.tag + ' has create a new ticket!').addField('Jump to channel', '<#' + channel.id + '>', true).addField('Ticket User', '<@' + user.id + '>', true).addField('Type/Selcted', selectedReason.type + ' <> ' + selectedReason.message).setTimestamp()).then(() => {
                        client.systemChannel["ticket-announcements"].send('<@&' + config.roles.staff + '>');
                      })
                    })
                  })
                } catch (error) {
                  console.log(error)
                  return client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(config.colors.error).setTitle('Error on channel creation and other.').setDescription(error).setTimestamp());
                }
              } else {
                await reaction.users.remove(user);
                return reaction.message.channel.send(new Discord.MessageEmbed().setColor(config.colors.missing).setTitle(`Sorry ${user.tag}!`).setDescription(`The emoji you tried to not exist!`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})})
              }
            } else {
              await reaction.users.remove(user);
              return reaction.message.channel.send(new Discord.MessageEmbed().setColor(config.colors.missing).setTitle(`Sorry ${user.tag}!`).setDescription(`You already got an ticket opened! \nPlease close your other ticket!\nThis helps to stop spam. Only staff can create more then one ticket!`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})})
            }
          })
        }
      } else {
        await reaction.users.remove(user);
        return reaction.message.channel.send(new Discord.MessageEmbed().setColor(config.colors.missing).setTitle(`Sorry ${user.tag}!`).setDescription(`The emoji you tried to not exist!`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})})
      }
    } else {
      await reaction.users.remove(user);
      return;
    }
  })
})

client.login(config.bot.token);