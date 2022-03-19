const {Telegraf} = require('telegraf')
const token = '5282404263:AAF-DrOmyBZ1bc1-vwUBjKBSQDEWdiEKqSU';
const bot = new Telegraf(token);
bot.context.db = {
    countingForDeadInsides: 0
}
bot.hears('1000-7',ctx=>{
    async function deadIndide(){
        for(let i=1000;i>0;i=i-7){
            ctx.reply(i);
            await sleep(3000);
        }
        ctx.reply('DEAD INSIDE!!!!!');
        bot.context.db.countingForDeadInsides = 0;
    }
    if(bot.context.db.countingForDeadInsides === 0){
        deadIndide();
        bot.context.db.countingForDeadInsides = 1;
    }
})
bot.hears('доброго ранку',ctx=>{
    ctx.reply('ми з України!');
})

// bot.telegram.setWebhook('https://mysterious-mesa-16110.herokuapp.com/' + token)

bot.launch();

function sleep(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
}