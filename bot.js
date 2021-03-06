const {Telegraf} = require('telegraf')
require('dotenv').config()
const http = require('http');
const { count } = require('console');
const bot = new Telegraf(process.env.BOT_TOKEN, {username:'@dickii_bot'}); 
const redis = require("redis");
// const client = redis.createClient({url: process.env.REDIS_URL});

// chats
const ryyax = 547015874;
const s_mia_h = 681035579;
const chatpasta = -1001517072456;
const dickaya_genshtab = -699023771;

// database(temporary until i make the real database mazafaka)
let db = {

}
class RemoteDataBase{
    static database_client;
    static getInstance(){
        if(RemoteDataBase.database_client){
            if(!RemoteDataBase.database_client.isOpen){
                RemoteDataBase.database_client.connect();
            }
            return RemoteDataBase.database_client;
        }
        RemoteDataBase.database_client = redis.createClient({url: process.env.REDIS_URL});
        RemoteDataBase.database_client.connect();
        return RemoteDataBase.database_client;
    }
}
const client = RemoteDataBase.getInstance();
console.log(client)

// technical functions
function sleep(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
}
function reply(ctx,text){
    ctx.reply(text,{reply_to_message_id:ctx.message.message_id})
}
function notifyMe(text, extra = {}){
    bot.telegram.sendMessage(ryyax, text, extra);
}

// functions
let morningAnnouncement = function(){
    setInterval(()=>{
        let date = new Date();
        if(date.getUTCHours() === 6 && date.getUTCMinutes() === 0){
            bot.telegram.sendMessage(dickaya_genshtab,morningMessage(date),{parse_mode:'HTML'}) 
            daily_weather_lviv(dickaya_genshtab)           
        }
    },60000)
}();
function getCoords(city_name, country_code){
    return new Promise((resolve)=>{
        http.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city_name},${country_code}&limit=1&appid=${process.env.WEATHER_API_KEY}`, res=>{
            let data = '';
            res.on('data', chunk => data+=chunk);
            res.on('end',()=>{
                try{
                    data = JSON.parse(data);
                    resolve(data[0]);
                } catch(e){
                    bot.telegram.sendMessage(ryyax, `data coords error: ${e.message}`)
                }
            })
        }).on('error', e=>{
            bot.telegram.sendMessage(ryyax, `request coords error: ${e.message}`);
        });
    })
}
function getWeather(city_name, country_code){
    return new Promise((resolve)=>{
        getCoords(city_name, country_code).then(data => {
            let request = http.get(`http://api.openweathermap.org/data/2.5/onecall?lat=${data.lat}&lon=${data.lon}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=ua`,res=>{
                let weather_data = '';
                res.on('data', chunk => weather_data+=chunk);
                res.on('end',()=>{
                    try{
                        weather_data = JSON.parse(weather_data);
                        weather_data.city_names_in_different_names = data.local_names;
                        resolve(weather_data);
                    }catch(e){
                        bot.telegram.sendMessage(ryyax,`data weather error: ${e.message}`)
                    }
                })
            }).on('error',e=>{
                bot.telegram.sendMessage(ryyax, `request weather error: ${e.message}`)
            });    
        })     
    })
}
function getTodayWeather(city_name, country_code){
    return new Promise(resolve=>{
        getWeather(city_name,country_code).then(data=>{
            resolve({
                temperature: Math.round(data.current.temp),
                feels_like: Math.round(data.current.feels_like),
                temperature_max: Math.round(data.daily[0].temp.max),
                temperature_min: Math.round(data.daily[0].temp.min),
                weather_conditions_description: data.current.weather[0].description,
                weather_conditions_id: data.current.weather[0].id,
                city_name_language_ukrainian: data.city_names_in_different_names.uk,

            })
        })
    })
}

// messages
let morningMessage = date => {
return `<b>?????????????? ??????????, ????????????????????!</b>
???????????????? <b>${Math.floor((date.getTime()-new Date('February 24, 2022 03:40:00'))/1000/60/60/24) + 1}-??</b> ????????, ???? <span class="tg-spoiler">??????????</span> ???????????? ???? ??????
?????? ???? ???????????????????? ?? ?????????? ??????????????????, <u>???? ???? ????????????????!</u>
<b><i>?????????? ??????????????!</i></b>`
}
let daily_weather_lviv = (chat) => {
    getTodayWeather('Lviv','UKR').then(weather=>{
        let daily_weather_message = '1';
        let weather_conditions_icon
        let personal_message_patterns = {
            0: '?????????????? ????????????????:',
            1: '?? ?????????? ?????????????? ????????????.',
            2: '???????????????????? ?? ???????? ?? ?????????? ????????????',
            3: '?????????????????????? ?????????? ????????, ???????? ??????, ???? ?????? ??????????????????:',
        };
        personal_message = personal_message_patterns[Math.floor(Math.random()*4)];
        if(weather.weather_conditions_id >= 800){
            switch(weather.weather_conditions_id){
                case 800:
                    weather_conditions_icon = '??????';
                    break;
                case 801:
                    weather_conditions_icon = '????';
                    break;
                case 802:
                    weather_conditions_icon = '??????';
                    break;
                case 803:
                    weather_conditions_icon = '????';
                    break;
                case 804:
                    weather_conditions_icon = '??????';
                    break;
            } 
        } else{
            switch(weather.weather_conditions_id / 100){
                case 2:
                    weather_conditions_icon = '???';
                    break;
                case 3:
                    weather_conditions_icon = '????';
                    break;
                case 5:
                    weather_conditions_icon = '????';
                    break;
                case 6:
                    weather_conditions_icon = '??????';
                    break;
                case 7:
                    weather_conditions_icon = '????';
                    break;
                default:
                    weather_conditions_icon = '??????'
            }
        }
        let date = new Date();
        let weather_date_today = date.getDate() + '.';
        if(date.getMonth()<10){
            weather_date_today += `0${date.getMonth()+1}`;
        } else{
            weather_date_today += date.getMonth()+1;
        }
        weather_date_today += '.' + date.getFullYear();

daily_weather_message = `????<b>${weather.city_name_language_ukrainian}!</b> ${personal_message}.
${weather_conditions_icon}?? ?????????? ???????????? ???? ???????????? <i>${weather.temperature}??</i>, <i>${weather.weather_conditions_description}</i>.
????????????????????, ${weather_date_today} ???????????????? <i>${weather.temperature_max}??</i>, ?????????????? <i>${weather.temperature_min}??</i>. 
????<i>???????? ?????????????????????? ??????!</i>`,{parse_mode:'HTML'}
        bot.telegram.sendMessage(chat,daily_weather_message,{parse_mode:'HTML'});
    })
}

// bot hears
bot.hears('1000',ctx=>{
    let chat_id = ctx.message.chat.id;
    if(chat_id.toString().slice(0,1)==='-'){
        chat_id = '_' + chat_id.toString().slice(1,chat_id.length);
    }
    let database_identifier = 'counting_for_dead_insides' + chat_id;
    async function fn(){    
        for(let i=993;i>0;i=i-7){
            ctx.reply(i);
            await sleep(3000);
        }
        ctx.reply('DEAD INSIDE!!!!!!!')
        db[database_identifier] = 0;
    }
    if(db[database_identifier] != 1){
        fn();
        db[database_identifier] = 1;
    } else{
        reply(ctx,'?? ???????? ???????????????? ???????????? 1 ?????? ??????????????????(?????? ???? ???????? ??????????, ?????? ???? ???????? ?? ????????????)')    
    }
})
bot.hears('1000-7', ctx=>reply(ctx,'?????????? ???? ???? ????????'));
bot.hears(/^????????$/gi, ctx=>ctx.replyWithHTML(`<a href="tg://user?id=${s_mia_h}">?????????????????? ???????????????????????? ???? ??????????????</a>`))
// bot.hears(/??????.*????????/gi, ctx=>{
//     if(ctx.message.chat.type === 'private'){
//         reply(ctx, '???????? ?? ???? ?????????? ?? ?? ????????????');
//     } else {
//         ctx.leaveChat();
//     }
// });
bot.hears(/((????????).*(??????????|??????????)|(????????|??????)|(??????????|????????????)|(????????))$/gi, ctx=>reply(ctx,'???? ?? ??????????????!'));
bot.hears(/?????????? ??????????????/gi, ctx=> reply(ctx,'???????????? ??????????!'))
bot.hears(/?????????? ??????????/gi, ctx=>reply(ctx,'???????????? ??????????????!'))
bot.hears(/^??????????????!?$/gi,ctx=>reply(ctx,'?????????? ??????!'))
bot.hears(/^??????????$/gi,ctx=>reply(ctx,'??????????!'))
bot.hears(/???????????? ?????????????? ??????????????/gi, ctx=>reply(ctx,'?????? ??????????'))
bot.hears(/??/gi, ctx=>reply(ctx,'???????? ?????????? ????????????????!'))
bot.hears(/??????????????/gi, ctx=>{
    reply(ctx, ctx.message.text.replace(/??????????????/gi, '??????'))
})
bot.hears('???????? ?????????? ????????????????!', ctx=>{
    reply(ctx,'???????? ?????????? ????????????????!');
})
bot.hears(/????????????????|????????????????|????????????????/gi, ctx=>{
    ctx.replyWithSticker('CAACAgIAAxkBAAIS9WJT4c_xJfaWYxDWH7zyd8nSUuEoAAJ2FAACuETYSNwh06eAZXcqIwQ')
})

// bot commands
bot.command('/weather', ctx=>{
    daily_weather_lviv(ctx.message.chat.id)
})
bot.command('addvoice', async ctx=>{
    
    let regex = /\/addvoice\S* */;
    let restricted_symbols = /[/]/gi
    let voice_message_name = ctx.message.text.replace(regex, '').toLowerCase();
    if(restricted_symbols.test(voice_message_name)){
        reply(ctx, '???????????????? ???????????? "/" ?? ?????????? ???????????????????? ????????????????????????')
        return
    }
    let voice_message_list = [];
    let voice_message_list_id = 'voice_message_list' + ctx.message.chat.id;
    let promise = new Promise((resolve,reject)=>{
        resolve(client.get(voice_message_list_id));
    })
    let voice_message_list_from_database = await promise;
    if(voice_message_list_from_database){
        voice_message_list = voice_message_list_from_database.split(',');
    }
    if(ctx.message.reply_to_message && voice_message_name!='' && (typeof(ctx.message.reply_to_message.voice) != 'undefined' || typeof(ctx.message.reply_to_message.audio) != 'undefined' )){
        if(!voice_message_list.includes(voice_message_name)){
            if(typeof(ctx.message.reply_to_message.voice) != 'undefined'){
                client.set(ctx.message.chat.id.toString() + voice_message_name.toString(), ctx.message.reply_to_message.voice.file_id)
            }
            if(typeof(ctx.message.reply_to_message.audio) != 'undefined'){
                client.set(ctx.message.chat.id.toString() + voice_message_name.toString(), ctx.message.reply_to_message.audio.file_id)
            }
            voice_message_list.push(voice_message_name);
            console.log(voice_message_list);
            client.set(voice_message_list_id,voice_message_list);
            // reply(ctx, '???????????????? ???????????????????????? ?????????????? ????????????!')
            reply(ctx, `???????????? ???????? ????????????. ???????????????????? "${voice_message_name}" ??????????????????`)
            notifyMe(`added: ${voice_message_name} - ${ctx.message.reply_to_message.voice.file_id}\n to: ${voice_message_list_id} - ${voice_message_list}`)
        } else{
            // reply(ctx, '?????? ?????????? ???????????????? ???????????????????????? ?? ?????????? ????????????.')
            reply(ctx, '?????????? ?????????????? ???????????????? ?? ???????? ?????????? ???????? ??????, ???????? ?????? ??')
        }
    } else if(voice_message_name==''){
        // reply(ctx, '?????????????? ?????????? ???????????????????? ???????????????????????? - "/addvoice *??????????*"')
        reply(ctx, '"/addvoice *??????????*", ?????????? ?????? ??????????..')
    } else if(typeof(ctx.message.reply_to_message) == 'undefined'){
        // reply(ctx, '???? ???? ???????????????????????? ???? ???????????????? ????????????????????????')
        reply(ctx, '???? ???????? ???????????????? ????????????????????????? ???? ????????!')
    } else {
        // reply(ctx, '?????? ?????????????????? ???? ???????????????? ????????????????????????, ?????? ???????????? ????????????????') 
        reply(ctx, '?? ???? ??????????, ?????? ?????????? ?????? ???????? ???????????????? ???? ???????? ?????????????????...')
    }
    
})
bot.command('voicelist', async (ctx)=>{
    let voice_message_list_id = 'voice_message_list' + ctx.message.chat.id;
    let promise = new Promise((resolve,reject)=>{
        resolve(client.get(voice_message_list_id));
    })
    let voice_message_list = await promise;
    if(voice_message_list){
        ctx.reply(`?????????? ???????????????????? ?????????????????? ?????????????????????? ?? ???????????? ????????: <b>${voice_message_list.replace(/,/gi,', ')}</b>`,{parse_mode:'HTML'})
    } else{
        reply(ctx, '?? ?????? ???? ???????????? ?????????????? ???????????????????? ????????????????????????. ?????????????????????????? ???????????????? /addvoice, ?????? ????????, ?????? ???????????????? ???????????????? ????????????????????????')
    }
})
bot.command('delvoice', ctx=>{
    reply(ctx, '?? ????????????????. ?????????? ???? ???? ??????????????')
})

// test
bot.hears('test',ctx=>{
    ctx.reply(ctx.message)
})

// bot on
// bot.on('sticker', ctx => reply(ctx, ctx.message))
bot.on('voice', ctx => reply(ctx,'?????????? ?? ???????? ???? ?????????? ?????????????'))
bot.on('text', async ctx=>{
    let promise = new Promise((resolve)=>{
        resolve(client.get('voice_message_list' + ctx.message.chat.id))
    })
    let voice_message_list = await promise;
    if(voice_message_list){
        voice_message_list = voice_message_list.split(',');
        if(voice_message_list.includes(ctx.message.text.toLowerCase())){
            let promis = new Promise((resolve)=>{
                resolve(client.get(ctx.message.chat.id.toString() + ctx.message.text.toString().toLowerCase()));
            })
            let voice_message_id = await promis;
            ctx.replyWithVoice(voice_message_id);
        }    
    } 
})




bot.launch();   

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))