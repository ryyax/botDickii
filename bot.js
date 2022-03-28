const {Telegraf} = require('telegraf')
require('dotenv').config()
const http = require('http');
const { count } = require('console');
const bot = new Telegraf(process.env.BOT_TOKEN); 
const redis = require("redis");
const client = redis.createClient({url: process.env.REDIS_URL});

// chats
const ryyax = 547015874;
const s_mia_h = 681035579;
const chatpasta = -1001517072456;
const dickaya_genshtab = -699023771;

// database(temporary until i make the real database mazafaka)
let db = {

}
client.connect();
client.on('connect', ()=>notifyMe(`Successfuly connected to database`))
client.on('error', err=>notifyMe(`Redis Client Error: ${err}`))

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
return `<b>Доброго ранку, товариство!</b>
Сьогодні <b>${Math.floor((date.getTime()-new Date('February 24, 2022 03:40:00'))/1000/60/60/24)}-й</b> день, як <span class="tg-spoiler">хуйло</span> напало на нас
Але ми тримаємось і будем триматись, <u>бо ми українці!</u>
<b><i>Слава Україні!</i></b>`
}
let daily_weather_lviv = (chat) => {
    getTodayWeather('Lviv','UKR').then(weather=>{
        let daily_weather_message = '1';
        let weather_conditions_icon
        let personal_message_patterns = {
            0: 'Ранкова програма:',
            1: 'А зараз прогноз погоди.',
            2: 'Прокидайся і будь в курсі погоди',
            3: 'Починається новий день, отож маю, що вам розказати:',
        };
        personal_message = personal_message_patterns[Math.floor(Math.random()*4)];
        if(weather.weather_conditions_id >= 800){
            switch(weather.weather_conditions_id){
                case 800:
                    weather_conditions_icon = '☀️';
                    break;
                case 801:
                    weather_conditions_icon = '🌤';
                    break;
                case 802:
                    weather_conditions_icon = '⛅️';
                    break;
                case 803:
                    weather_conditions_icon = '🌥';
                    break;
                case 804:
                    weather_conditions_icon = '☁️';
                    break;
            } 
        } else{
            switch(weather.weather_conditions_id / 100){
                case 2:
                    weather_conditions_icon = '⛈';
                    break;
                case 3:
                    weather_conditions_icon = '🌧';
                    break;
                case 5:
                    weather_conditions_icon = '🌧';
                    break;
                case 6:
                    weather_conditions_icon = '❄️';
                    break;
                case 7:
                    weather_conditions_icon = '🌫';
                    break;
                default:
                    weather_conditions_icon = '❗️'
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

daily_weather_message = `📍<b>${weather.city_name_language_ukrainian}!</b> ${personal_message}.
${weather_conditions_icon}В даний момент на вулиці <i>${weather.temperature}°</i>, <i>${weather.weather_conditions_description}</i>.
🌡Сьогодні, ${weather_date_today} максимум <i>${weather.temperature_max}°</i>, мінімум <i>${weather.temperature_min}°</i>. 
🙌<i>Всім прекрасного дня!</i>`,{parse_mode:'HTML'}
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
        reply(ctx,'я можу рахувати тільки 1 раз одночасно(аби не було спаму, так то можу і більше)')    
    }
})
bot.hears('1000-7', ctx=>reply(ctx,'видно шо ти даун'));
bot.hears(/^соля$/gi, ctx=>ctx.replyWithHTML(`<a href="tg://user?id=${s_mia_h}">Наймиліше створіннячко на планеті</a>`))
// bot.hears(/сам.*даун/gi, ctx=>{
//     if(ctx.message.chat.type === 'private'){
//         reply(ctx, 'була б це група я б лівнув');
//     } else {
//         ctx.leaveChat();
//     }
// });
bot.hears(/((добр).*(ранку|ранок)|(день|дня)|(вечір|вечора)|(ночі))$/gi, ctx=>reply(ctx,'ми з України!'));
bot.hears(/Слава Україні/gi, ctx=> reply(ctx,'Героям Слава!'))
bot.hears(/Слава Нації/gi, ctx=>reply(ctx,'Смерть ворогам!'))
bot.hears(/^Україна!?$/gi,ctx=>reply(ctx,'Понад усе!'))
bot.hears(/^путін$/gi,ctx=>reply(ctx,'хуйло!'))
bot.hears(/рускій ваєнний карабль/gi, ctx=>reply(ctx,'іді нахуй'))
bot.hears(/Ы/gi, ctx=>reply(ctx,'Кажи слово паляниця!'))
bot.hears(/процько/gi, ctx=>{
    reply(ctx, ctx.message.text.replace(/процько/gi, 'хуй'))
})
bot.hears(/паляниця/gi, ctx=>{
    new Promise((resolve,reject)=>{
        resolve(client.get('паляниця'))
    }).then(data=>{
        ctx.replyWithVoice(data,{reply_to_message_id:ctx.message.message_id});
    })
})

// bot on
// bot.on('sticker', ctx => reply(ctx, 'заєбеш'))
bot.on('voice', ctx => reply(ctx,'блять в тебе шо букви платні?'))

// bot commands
bot.command('/weather', ctx=>{
    daily_weather_lviv(ctx.message.chat.id)
})
bot.command('/addvoice',ctx=>{
    // let voice_message_name = ctx.message.text.replace(/\/addvoice /, '');
    if(ctx.message.chat.id === ryyax){
        if(ctx.message.reply_to_message){
            client.set(ctx.message.text.replace(/\/addvoice /, '').toLowerCase(), ctx.message.reply_to_message.voice.file_id, function (err,reply){
                bot.telegram.sendMessage(ryyax,`Error: ${err}\n Success: ${reply}`)
            })
            notifyMe(`added: ${ctx.message.text.replace(/\/addvoice /, '')} - ${ctx.message.reply_to_message.voice.file_id}`)
        } else {
           reply(ctx, 'Дай відповідь на голосове повідомлення, яке бажаєш зберегти') 
        }
    }
})

// test
bot.hears('test',ctx=>{
    ctx.reply(ctx.message)
})


bot.launch();   

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))