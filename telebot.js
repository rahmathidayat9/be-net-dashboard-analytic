const { Telegraf } = require('telegraf');
const Telegram = require('telegraf/telegram');
const cron = require('node-cron');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegram(process.env.BOT_TOKEN);

const groupIds = ["-4010824640", "-4084355967"];

// cron.schedule('* * * * * *', () => {
  
// });

groupIds.forEach((groupId) => {
  telegram.sendMessage(groupId, 'Okee').then(() => {
    console.log(`Message sent to group ${groupId}`);
  }).catch((error) => {
    console.error(`Error sending message to group ${groupId}:`, error);
  });
});

bot.start((ctx) => ctx.reply('Hello from the bot!'));
bot.launch().then(() => {
  console.log('Bot is running');
});
