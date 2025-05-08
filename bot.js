require('dotenv').config();
const express = require('express');
const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// Usar sesión simple
bot.use(session());

// Mensaje de ayuda
bot.help(ctx => {
    const helpMessage = `
*Bot para Numerología* ✨
/start - Iniciar bot
/help - Ver ayuda
    `;
    ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

// Comando /start
bot.command('start', ctx => {
    sendInitialMessage(ctx);
});

// Función para enviar mensaje inicial
function sendInitialMessage(ctx) {
    ctx.session = {}; // resetear sesión
    const initialMessage = "Hola 👋, ¿qué número mágico deseas calcular?\n\n1. Mi número mágico (por tu fecha de nacimiento)\n2. Número mágico del día de hoy 📅";
    ctx.reply(initialMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🎂 Mi número mágico", callback_data: "mi_numero_magico" },
                    { text: "📅 Número mágico del día", callback_data: "numero_dia" }
                ]
            ]
        }
    });
}

// Manejo de callback_query
bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;

    if (action === "mi_numero_magico") {
        await ctx.reply("Por favor, escribe tu fecha de nacimiento en formato DD/MM/AAAA:");
        ctx.session.waitingForBirthday = true;
    } 
    else if (action === "numero_dia") {
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        const magicNumber = calculateMagicNumber(formattedDate);
        await ctx.reply(`El número mágico del día de hoy (${formattedDate}) es: *${magicNumber}* ✨`, { parse_mode: "Markdown" });
        sendAnotherQuery(ctx);
    }
    else if (action === "consultar_otro") {
        sendInitialMessage(ctx);
    }
    else if (action === "salir") {
        await ctx.reply("Gracias por usar el bot. ¡Hasta luego! 👋");
    }
});

// Manejo de mensajes de texto
bot.on(message('text'), async (ctx) => {
    const userMessage = ctx.message.text.trim();

    if (ctx.session && ctx.session.waitingForBirthday) {
        const dateRegex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;
        if (dateRegex.test(userMessage)) {
            const magicNumber = calculateMagicNumber(userMessage);
            const zodiacSign = getZodiacSign(userMessage);
            const chineseSign = getChineseZodiac(userMessage);
            await ctx.reply(`🎉 Tu número mágico es: *${magicNumber}*\n♈ Tu signo del zodiaco es: *${zodiacSign}*\n🐉 Tu animal del horóscopo chino es: *${chineseSign}*`, {
                parse_mode: "Markdown"
            });
            ctx.session.waitingForBirthday = false;
            sendAnotherQuery(ctx);
        } else {
            await ctx.reply("⚠️ Fecha inválida. Por favor, escribe la fecha en formato correcto DD/MM/AAAA (por ejemplo 23/08/1995).");
        }
    }
});

// Función para preguntar si quiere consultar otro o salir
function sendAnotherQuery(ctx) {
    ctx.reply("¿Deseas hacer otra consulta?", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔁 Consultar otro", callback_data: "consultar_otro" },
                    { text: "❌ Salir", callback_data: "salir" }
                ]
            ]
        }
    });
}

// Función para calcular el número mágico
function calculateMagicNumber(date) {
    const digits = date.replace(/[^0-9]/g, '');
    let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    while (sum >= 10) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
}

// Función para obtener el signo del zodiaco
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

// Función para obtener el animal del horóscopo chino
function getChineseZodiac(date) {
    const year = parseInt(date.split('/')[2]);
    const animals = [
        "Mono", "Gallo", "Perro", "Cerdo", "Rata", "Buey",
        "Tigre", "Conejo", "Dragón", "Serpiente", "Caballo", "Cabra"
    ];
    return animals[year % 12];
}

// Configurar webhook
app.use(express.json());
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log(`Establece el webhook en Telegram con la URL: https://telegram-bot-gules-six.vercel.app/webhook/${process.env.BOT_TOKEN}`);
});

// Capturar errores
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


