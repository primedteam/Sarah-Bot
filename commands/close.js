module.exports.run = async (Client, message, args, Con, Discord, Config) => {
  const fs = require('fs-extra');
  const path = require('path');
  let DateAndTime = require('date-and-time');
  var moment = require('moment');
  Con.query(`SELECT * FROM Tickets WHERE ChannelID = '${message.channel.id}'`, async (error, result) => {
    if(error) return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Mysql Error (Close Ticket #1)').setDescription(error).setTimestamp());
    if(result.length <= 0) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle(`Sorry ${message.author.tag}!`).setDescription(`This is not a ticket on our database. Please delete this channel manually if needed.`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})});
    if(message.channel.id !== result[0].ChannelID) return message.channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle(`Sorry ${user.tag}!`).setDescription(`This is not a ticket on our database. Please delete this channel manually if needed.`).setFooter('If an error report to staff! ').setTimestamp()).then((msg) => {msg.delete({timeout: 15000, reason: 'Deleted after 15s delay'})});

    let channel = message.channel;
    let TicketData = result[0];
    channel.send(new Discord.MessageEmbed().setColor(Config.colors.prompt).setTitle('Are you sure?').setDescription('Please click ' + Config.checkBox + ' to close this ticket OR click ' + Config.wrongBox + ' to cancel or dont click a reaction to cancel! \nYou have **15s** to respond').setTimestamp().setFooter('Only ' + message.author.tag + ' can respond! ')).then(async (msg) => {
      await msg.react(Config.checkBox).catch(() => {}).then(async () => {
        await msg.react(Config.wrongBox).catch(() => {}).then(async () => {
          const filter = (reaction, user) => {return (Config.checkBox === reaction.emoji.name || Config.wrongBox === reaction.emoji.name) && user.id === message.author.id;};
          await msg.awaitReactions(filter, {max: 1, time: 15000, errors: ['time']}).then(async (collected) => {
            let reactionData = collected.first();
            if(reactionData.emoji.name === Config.wrongBox){
              msg.delete().catch(() => {});
              return channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle('Canceled!').setDescription('We have canceled the closure request because you clicked ' + Config.wrongBox + '!').setTimestamp());
            } else {
              channel.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle('Thanks you!').setDescription('Thank you for talking with us! We are currently closing the ticket!').setTimestamp()).then(async (thankyouMsg) => {
                try {
                  channel.edit({
                    permissionOverwrites: [
                      {
                        id: message.guild.roles.cache.find(n => n.name === "@everyone").id,
                        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                      },
                      {
                        id: message.author.id,
                        allow: ['VIEW_CHANNEL'],
                        deny: ['SEND_MESSAGES']
                      },
                      {
                        id: Client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                      },
                      {
                        id: Config.roles.staff,
                        allow: ['VIEW_CHANNEL'],
                        deny: ['SEND_MESSAGES']
                      }
                    ]
                  }).then(async (data) => {
                    channel = data;
                    channel.messages.fetch({ limit: 100 }).then(messages => {
                      var dd = new Date(TicketData.CreatedAt*1000);
                      var date = dd.toLocaleString('en-US', {
                        timeZone: 'America/New_York',
                        hour12: true,
                        hour: 'numeric',
                        minute: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZoneName: 'short'
                      });
                      let LogData = `HTML PART 1`;
                        let messageschange = []
                        let messageSizeTotal = messages.size;
                        let messageSizeCurr = 0

                         messages.forEach((item, index) => {
                           let content;
                            if(item.content === ''){
                              content = 'EMBED MESSAGED'
                            } else {
                              content = item.content
                            }
                            //messageschange.push(`${item.author.username}#${item.author.discriminator}: ${content}`);
                            messageschange.push(`
                            <div id="${item.id}"> 
                        <h5 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:tahoma, verdana, segoe, sans-serif;display:inline;">${item.author.username}#${item.author.discriminator}</h5> @ 
                        <h5 style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:tahoma, verdana, segoe, sans-serif;display:inline;">${moment(item.createdTimestamp).format("dddd, MMMM Do YYYY, h:mm a")}</h5>: 
                        <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:12px;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:18px;color:#131313;display:inline;">${content}</p> 
                       </div> 
                       `)
                            messageSizeCurr++
                            if(messageSizeCurr === messageSizeTotal){
                              messageschange.reverse();
                              let messageSizeTotal2 = messages.size;
                              let messageSizeCurr2 = 0;
                                messageschange.forEach(async (item, index) => {
                                  LogData = LogData + '\n' + item;
                                  messageSizeCurr2++
                                  if(messageSizeCurr2 === messageSizeTotal2){
                                    LogData = LogData + `HTML PART 2`;

                                    const file = path.join(process.cwd(), 'data', `Temp-Ticket-${TicketData.TicketID}-${TicketData.UserID}.html`);
                                    fs.outputFile(file, LogData, err => {
                                      if (err){
                                        channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Opps!').setDescription('We had an error! Were currently trying to fix it! Please wait...').setTimestamp());
                                        return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Writing File.').setDescription(err).setTimestamp());
                                      } else {
                                        fs.readFile(file, 'utf8', (err, data) => {
                                          if (err){
                                            channel.send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Opps!').setDescription('We had an error! Were currently trying to fix it! Please wait...').setTimestamp());
                                            return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Reading File.').setDescription(err).setTimestamp());
                                          } else {
                                            const buffer = fs.readFileSync(file);
                                            const FileData = new Discord.MessageAttachment(buffer, `Ticket-${TicketData.TicketID}-${TicketData.UserID}.html`);
                                            channel.delete('Ticket Closed').then(async () => {
                                              let User = Client.users.cache.find(u => u.id === TicketData.UserID);
                                              let TicketChatLogs = Client.systemChannel["ticket-message-logs"];
                                              User.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle(`Ticket #${TicketData.TicketID} Closed!`).setDescription(`Thanks for talking to us! Please download your ticket file to read your ticket messages!`).attachFiles(FileData).setFooter('Thanks! ').setTimestamp()).catch(() => {
                                                console.log('Cant pm user', User.id)
                                              });
                                              TicketChatLogs.send(new Discord.MessageEmbed().setColor(Config.colors.complete).setTitle(`Ticket #${TicketData.TicketID} Closed!`).setDescription(`Was Closed By ${message.author}!`).attachFiles(FileData).setFooter('Yay! ').setTimestamp()).catch(() => {
                                                console.log('Cant send msg to channel')
                                              });
                                              Con.query(`UPDATE Tickets SET ClosedAt = '${Math.floor(Date.now()/1000)}', Status = 'Closed' WHERE ChannelID = '${message.channel.id}'`, async (errors, result) => {
                                                if(error) return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Mysql Error (Close Ticket #2)').setDescription(error).setTimestamp());

                                                fs.remove(file, err => {
                                                  if (err) {
                                                    return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Deleting File.').setDescription(err).setTimestamp());
                                                  }
                                                })
                                              })
                                            }).catch(async (error) => {
                                              thankyouMsg.edit(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Opps!').setDescription('We had an error! Were currently trying to fix it! Please wait...').setTimestamp());
                                              return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Error deleting ticket.').setDescription(error).setTimestamp());
                                            })
                                          }
                                        })
                                      }
                                    })
                                  }
                                })
                            }
                         })
                    }).catch(async (error) => {
                      return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Error closure of ticket.').setDescription(error).setTimestamp());
                    })
                  })
                } catch (error) {
                  thankyouMsg.edit(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Opps!').setDescription('We had an error! Were currently trying to fix it! Please wait...').setTimestamp());
                  return Client.systemChannel["system"].send(new Discord.MessageEmbed().setColor(Config.colors.error).setTitle('Error closure of ticket.').setDescription(error).setTimestamp());
                }
              })
            }
          }).catch(async (collected) => {
              msg.delete().catch(() => {});
              channel.send(new Discord.MessageEmbed().setColor(Config.colors.missing).setTitle('You did not respond!').setDescription('We have canceled the closure request because you did not respond!').setTimestamp());
          })
        })
      })
    })
  })
}

module.exports.help = {
  name: "close",
  desc: "close your ticket",
  rolesShow: ["everyone"]
}
