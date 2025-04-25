require('dotenv').config()
const { Telegraf } = require('telegraf')
const axios = require('axios')

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.help(ctx => {
    const helpMessage = `
    *Bot para Numerologia*
    /start - Iniciar bot
    `

    bot.telegram.sendMessage(ctx.from.id, helpMessage, {
        parse_mode: "Markdown"
    })
})
bot.command('start', ctx => {
    sendInitialMessage(ctx);
});

function sendInitialMessage(ctx) {
    const initialMessage = "Hola, ¿qué número mágico deseas calcular?\n\n1. Mi número mágico (basado en mi fecha de nacimiento)\n2. Número mágico del día de hoy";
    ctx.reply(initialMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Mi número mágico", callback_data: "mi_numero_magico" },
                    { text: "Número mágico del día", callback_data: "numero_dia" }
                ]
            ]
        }
    });
}

bot.on('callback_query', (ctx) => {
    const action = ctx.callbackQuery.data;
    if (action === "mi_numero_magico") {
        sendStartMessage(ctx);
    } else if (action === "numero_dia") {
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        const magicNumber = calculateMagicNumber(formattedDate);
        ctx.reply(`El número mágico del día de hoy (${formattedDate}) es: ${magicNumber}`);
    }
});

function sendStartMessage(ctx) {
    const startMessage = "Por favor, escribe tu fecha de nacimiento en el formato DD/MM/AAAA:";
    ctx.reply(startMessage);
}

bot.on('text', (ctx) => {
    const userMessage = ctx.message.text;

    // Validar el formato de la fecha (DD/MM/AAAA)
    const dateRegex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (dateRegex.test(userMessage)) {
        // Calcular el número mágico
        const magicNumber = calculateMagicNumber(userMessage);
        const zodiacSign = getZodiacSign(userMessage);
        ctx.reply(`Gracias, tu número mágico es: ${magicNumber} y tu signo del zodiaco es: ${zodiacSign}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Consultar otro", callback_data: "consultar_otro" },
                        { text: "Salir", callback_data: "salir" }
                    ]
                ]
            }
        });
    } else {
        ctx.reply("Por favor, ingresa una fecha válida en el formato DD/MM/AAAA.");
    }
});

bot.on('callback_query', (ctx) => {
    const action = ctx.callbackQuery.data;
    if (action === "consultar_otro") {
        sendInitialMessage(ctx);
    } else if (action === "salir") {
        ctx.reply("Gracias por usar el bot. ¡Hasta luego!");
    }
});

function calculateMagicNumber(date) {
    const digits = date.replace(/[^0-9]/g, '');
    let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    while (sum >= 10) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
}

function getZodiacSign(date) {
    const [day, month] = date.split('/').map(Number);
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Acuario";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Piscis";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Tauro";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Géminis";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cáncer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Escorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagitario";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricornio";
    return "Desconocido";
}

bot.launch();