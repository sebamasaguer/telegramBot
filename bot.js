require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');

const bot = new Telegraf(process.env.BOT_TOKEN);

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
    const initialMessage = "Hola 👋\n*¡Bienvenido! Soy tu experto en numerología.*\nTe acompañaré a descubrir los secretos que los números tienen para ti.\n ¡Vamos a comenzar!\n\n¿Qué deseas calcular?\n\n1. Mi número mágico (por tu fecha de nacimiento)\n2. Número mágico del día de hoy 📅\n3. Mi número pitagórico (por tu nombre)";
    ctx.reply(initialMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🎂 Mi número mágico", callback_data: "mi_numero_magico" },
                    { text: "📅 Número mágico del día", callback_data: "numero_dia" }
                ],
                [
                    { text: "🔤 Mi número pitagórico", callback_data: "numero_pitagorico" }
                ]
            ]
        }
    });
}
// Características de cada número según la numerología
const numerologyDescriptions = {
    1: "Líder, independiente, innovador y con gran fuerza de voluntad. Los nacidos bajo el número 1 suelen ser pioneros y tener iniciativa.",
    2: "Cooperativo, diplomático, sensible y pacífico. El número 2 destaca por su capacidad para trabajar en equipo y su empatía.",
    3: "Creativo, comunicativo, optimista y sociable. El 3 es expresivo y disfruta de la vida social y artística.",
    4: "Práctico, organizado, trabajador y confiable. El número 4 representa la estabilidad y el esfuerzo constante.",
    5: "Aventurero, versátil, curioso y amante de la libertad. El 5 busca cambios y nuevas experiencias.",
    6: "Responsable, protector, amoroso y orientado a la familia. El 6 se preocupa por el bienestar de los demás.",
    7: "Analítico, introspectivo, espiritual y amante del conocimiento. El 7 busca la verdad y la sabiduría.",
    8: "Ambicioso, eficiente, con visión de negocios y capacidad de liderazgo. El 8 está relacionado con el éxito material.",
    9: "Humanitario, generoso, compasivo y altruista. El 9 se orienta al servicio y la ayuda a los demás."
};

// Análisis del número mágico del día
function getDayAnalysis(number) {
    const dayAnalyses = {
        1: "Hoy es un día ideal para iniciar proyectos, tomar decisiones y liderar. Aprovecha la energía para avanzar con determinación.",
        2: "Día para colaborar, escuchar y buscar acuerdos. La diplomacia y la paciencia serán tus mejores aliados.",
        3: "La creatividad y la comunicación fluirán. Expresa tus ideas y disfruta de actividades sociales.",
        4: "Enfócate en la organización y el trabajo constante. Es un buen momento para poner orden y cumplir responsabilidades.",
        5: "Día de cambios, movimiento y nuevas oportunidades. Mantente abierto a lo inesperado.",
        6: "Dedica tiempo a la familia y a cuidar de los demás. La armonía y el apoyo mutuo serán importantes.",
        7: "Reflexiona, estudia y busca momentos de introspección. Es un día para el crecimiento personal.",
        8: "Enfócate en tus metas materiales y profesionales. La disciplina te acercará al éxito.",
        9: "Jornada para ayudar, perdonar y cerrar ciclos. Practica la generosidad y el desapego."
    };
    return dayAnalyses[number] || "";
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
        const analysis = getDayAnalysis(magicNumber);
        await ctx.reply(`El número mágico del día de hoy (${formattedDate}) es: *${magicNumber}* ✨\n\n${analysis}`, { parse_mode: "Markdown" });
        sendAnotherQuery(ctx);
    }
    else if (action === "numero_pitagorico") {
        await ctx.reply("Por favor, escribe tu nombre completo:");
        ctx.session.waitingForName = true;
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
            const description = numerologyDescriptions[magicNumber] || "";
           await ctx.reply(
                `🎉 Tu número mágico es: *${magicNumber}*\n${description}\n\n♈ Tu signo del zodiaco es: *${zodiacSign}*\n🐉 Tu animal del horóscopo chino es: *${chineseSign}*`,
                { parse_mode: "Markdown" }
            );
            ctx.session.waitingForBirthday = false;
            sendAnotherQuery(ctx);
        } else {
            await ctx.reply("⚠️ Fecha inválida. Por favor, escribe la fecha en formato correcto DD/MM/AAAA (por ejemplo 23/08/1995).");
        }
    } else if (ctx.session && ctx.session.waitingForName) {
        const name = userMessage;
        const pitagoricNumber = calculatePythagoreanNumber(name);
        const reference = getPythagoreanReference(pitagoricNumber);
        await ctx.reply(`🔢 El número pitagórico de tu nombre es: *${pitagoricNumber}*\n\n${reference}`, {
            parse_mode: "Markdown"
        });
        ctx.session.waitingForName = false;
        sendAnotherQuery(ctx);
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

// Función para calcular el número pitagórico de un nombre
function calculatePythagoreanNumber(name) {
    // Mapeo pitagórico: A=1, B=2, ..., I=9, J=1, ..., R=9, S=1, ..., Z=8
    const map = {
        A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
        J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
        S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8
    };
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
    let sum = letters.reduce((acc, letter) => acc + (map[letter] || 0), 0);
    while (sum >= 10 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
}

// Función para obtener la referencia del número pitagórico
function getPythagoreanReference(number) {
    const references = {
        1: "El número 1 representa liderazgo, independencia y originalidad.",
        2: "El número 2 simboliza cooperación, sensibilidad y diplomacia.",
        3: "El número 3 está asociado a creatividad, comunicación y optimismo.",
        4: "El número 4 indica estabilidad, trabajo duro y organización.",
        5: "El número 5 es libertad, aventura y adaptabilidad.",
        6: "El número 6 representa responsabilidad, armonía y servicio.",
        7: "El número 7 es introspección, análisis y espiritualidad.",
        8: "El número 8 simboliza poder, éxito material y ambición.",
        9: "El número 9 es generosidad, compasión y humanitarismo.",
        11: "El número maestro 11 es intuición, inspiración y visión.",
        22: "El número maestro 22 es construcción, realización y liderazgo global.",
        33: "El número maestro 33 es maestría, amor universal y enseñanza."
    };
    return references[number] || "No hay referencia disponible para este número.";
}

// Lanzar el bot
bot.launch();

// Capturar errores
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


