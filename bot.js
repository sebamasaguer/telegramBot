require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path'); // Para manejar paths de archivos
const os = require('os');     // Para obtener el directorio temporal del sistema

const bot = new Telegraf(process.env.BOT_TOKEN);

// Usar sesión simple
bot.use(session());

// Mensaje de ayuda
bot.help(ctx => {
    const helpMessage = `
*Bot de Numerología y Astrología* ✨
/start - Iniciar bot y ver opciones.
/help - Mostrar este mensaje de ayuda.

Este bot te permite:
- Calcular tu *Número Mágico* (Sendero de Vida) a partir de tu fecha de nacimiento.
- Conocer el *Número Mágico del Día*.
- Calcular tu *Número Pitagórico* (Expresión/Destino) a partir de tu nombre completo.
- Solicitar un *Informe Completo en PDF* personalizado, combinando tu numerología y astrología solar.
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
    const initialMessage = "Hola 👋\n*¡Bienvenido! Soy tu experto en numerología y astrología.*\nTe acompañaré a descubrir los secretos que los números y los astros tienen para ti.\n ¡Vamos a comenzar!\n\n¿Qué deseas explorar hoy?";
    ctx.reply(initialMessage, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🎂 Mi Número Mágico", callback_data: "mi_numero_magico" },
                    { text: "📅 Número Mágico del Día", callback_data: "numero_dia" }
                ],
                [
                    { text: "🔤 Mi Número Pitagórico", callback_data: "numero_pitagorico" }
                ],
                [
                    { text: "📝 Solicitar Informe Completo PDF", callback_data:"informe_completo"}
                ],
                [
                    // URL Ejemplo
                ]
            ]
        }
    });
}
// Características de cada número (Sendero de Vida / Mágico)
const numerologyDescriptions = {
    1: "Representa el liderazgo, la independencia, la originalidad y la ambición. Eres un pionero, autosuficiente y con una gran fuerza de voluntad. Debes aprender a equilibrar tu individualismo con la cooperación.",
    2: "Simboliza la cooperación, la diplomacia, la sensibilidad y la búsqueda de armonía. Eres adaptable, paciente y un excelente compañero. Debes cuidar tu tendencia a la dependencia emocional.",
    3: "Irradia creatividad, comunicación, optimismo y sociabilidad. Eres expresivo, artístico y disfrutas de la vida social. Debes enfocarte para no dispersar tu energía.",
    4: "Significa la practicidad, la organización, el trabajo duro y la confiabilidad. Eres estable, disciplinado y buscas construir bases sólidas. Debes evitar la rigidez y la terquedad.",
    5: "Es la energía de la libertad, la aventura, la versatilidad y el cambio. Eres curioso, adaptable y amas las nuevas experiencias. Debes tener cuidado con la impulsividad y la falta de constancia.",
    6: "Encarna la responsabilidad, el amor, la protección y la orientación familiar y comunitaria. Eres compasivo, hogareño y buscas la armonía. Debes evitar el exceso de preocupación y la interferencia.",
    7: "Representa el análisis, la introspección, la espiritualidad y la búsqueda del conocimiento. Eres sabio, intuitivo y necesitas tiempo a solas para reflexionar. Debes cuidarte del aislamiento y el escepticismo.",
    8: "Simboliza la ambición, la eficiencia, el poder material y la capacidad de liderazgo. Eres organizado, con visión de negocios y buscas el éxito. Debes equilibrar lo material con lo espiritual y evitar ser dominante.",
    9: "Es la vibración del humanitarismo, la generosidad, la compasión y el altruismo. Eres idealista, desinteresado y buscas servir a los demás. Debes aprender a poner límites y a no sacrificarte en exceso.",
    11: "Como Número Maestro, el 11 es el 'Iluminador'. Posees una intuición elevada, inspiración y carisma. Estás aquí para inspirar y guiar, pero debes aprender a manejar tu sensibilidad y nerviosismo. Se vive a menudo como un 2 (1+1=2) hasta que se integra su alta vibración.",
    22: "Como Número Maestro, el 22 es el 'Constructor Maestro'. Tienes la capacidad de convertir grandes sueños en realidad tangible, con un impacto significativo. Combina visión y practicidad. Se vive a menudo como un 4 (2+2=4) hasta que se asume su potencial.",
    33: "Como Número Maestro, el 33 es el 'Maestro del Amor Compasivo'. Estás aquí para servir, sanar y enseñar con amor universal. Es una vibración de gran sacrificio y entrega. Se vive a menudo como un 6 (3+3=6) hasta que se alcanza esta maestría."
};

// Análisis del número mágico del día
function getDayAnalysis(number) {
    const dayAnalyses = {
        1: "Hoy es un día ideal para iniciar proyectos, tomar decisiones audaces y liderar con confianza. ¡Aprovecha tu impulso!",
        2: "Día propicio para la colaboración, la escucha activa y buscar acuerdos. La diplomacia y la paciencia serán tus mejores herramientas.",
        3: "La creatividad y la comunicación están en su apogeo. Expresa tus ideas, socializa y disfruta de actividades artísticas.",
        4: "Enfócate en la organización, el trabajo metódico y la disciplina. Es un buen momento para poner orden y cumplir responsabilidades.",
        5: "Espera cambios, movimiento y nuevas oportunidades. Mantente flexible y abierto a lo inesperado. ¡Aventura aguarda!",
        6: "Dedica tiempo a tus seres queridos, al hogar y a cuidar de los demás. La armonía y el apoyo mutuo son claves hoy.",
        7: "Un día perfecto para la reflexión, el estudio y la introspección. Busca momentos de calma para conectar con tu sabiduría interior.",
        8: "Concéntrate en tus metas materiales y profesionales. La disciplina y la estrategia te acercarán al éxito y la abundancia.",
        9: "Jornada para la generosidad, el perdón y cerrar ciclos. Practica el desapego y ayuda a quienes lo necesiten.",
        11: "Día de alta intuición e inspiración. Presta atención a tus corazonadas y mensajes sutiles. Potencial para revelaciones.",
        22: "Hoy puedes materializar ideas importantes. Es un día para construir con visión y pragmatismo. ¡Manifiesta tus sueños!",
        33: "La compasión y el servicio desinteresado son protagonistas. Un día para sanar, enseñar y conectar desde el amor universal."
    };
    return dayAnalyses[number] || "Día con una energía particular, mantente atento a sus señales.";
}

// Detalles de los Signos Zodiacales para el PDF
const zodiacSignDetails = {
    "Aries": {
        description: "Aries (Mar 21 - Abr 19), el Carnero, es el primer signo, puro fuego Cardinal. Representa el inicio, la energía primordial, el coraje y el liderazgo. Los Aries son pioneros, dinámicos, directos y competitivos, siempre listos para la acción. Su entusiasmo es contagioso, pero deben moderar su impulsividad e impaciencia. Valoran la independencia y la franqueza.",
        element: "Fuego", modality: "Cardinal", ruler: "Marte",
        colorPalette: { primary: '#D90429', secondary: '#EF233C' }, // Rojos intensos
        magicNumberInfluence: (num) => {
            if (num === 1) return "Tu naturaleza ariana de líder innato se ve potenciada por la individualidad y la fuerza del Número 1. Eres doblemente pionero, con una determinación férrea para abrir caminos.";
            if (num === 5) return "La energía aventurera de Aries se combina con la sed de libertad y cambio del Número 5. Necesitas movimiento constante y te aburres con la rutina, buscando siempre nuevas experiencias estimulantes.";
            if (num === 8) return "La ambición y el impulso de Aries se unen a la capacidad de logro y poder del Número 8. Tienes un gran potencial para alcanzar el éxito material y liderar empresas importantes, pero cuida el autoritarismo.";
            return `Tu Número de Vida ${num} añade una capa distintiva a tu energía ariana, influyendo en cómo canalizas tu ímpetu y tu deseo de conquista.`;
        }
    },
    "Tauro": {
        description: "Tauro (Abr 20 - May 20), el Toro, es un signo de Tierra Fijo. Simboliza la estabilidad, la sensualidad, la perseverancia y el amor por los placeres terrenales y la belleza. Los Tauro son pacientes, prácticos, decididos y buscan seguridad material y emocional. Leales y confiables, pueden ser tercos pero también muy afectuosos.",
        element: "Tierra", modality: "Fijo", ruler: "Venus",
        colorPalette: { primary: '#2b9348', secondary: '#55a630' }, // Verdes naturales
        magicNumberInfluence: (num) => {
            if (num === 2) return "Tu búsqueda taurina de armonía y estabilidad se complementa con la diplomacia y cooperación del Número 2. Eres un excelente mediador y valoras profundamente las relaciones pacíficas y seguras.";
            if (num === 4) return "La practicidad y la necesidad de bases sólidas de Tauro se refuerzan con la disciplina y el trabajo metódico del Número 4. Eres un constructor nato, capaz de crear seguridad duradera.";
            if (num === 6) return "Como Tauro con un Número de Vida 6, tu amor por el hogar, la familia y la belleza se acentúa. Eres protector, responsable y buscas crear un entorno armonioso, confortable y estéticamente agradable.";
            return `Tu Número de Vida ${num} matiza tu sólida energía taurina, influyendo en tus valores y en cómo buscas y mantienes la estabilidad y el placer.`;
        }
    },
    "Géminis": {
        description: "Géminis (May 21 - Jun 20), los Gemelos, es un signo de Aire Mutable. Representa la comunicación, la dualidad, la curiosidad intelectual y la versatilidad. Los Géminis son ingeniosos, adaptables, sociables y siempre ávidos de aprender e intercambiar información. Pueden ser inquietos y tener múltiples intereses simultáneamente.",
        element: "Aire", modality: "Mutable", ruler: "Mercurio",
        colorPalette: { primary: '#fee440', secondary: '#f15bb5' }, // Amarillo brillante, Rosa vibrante
        magicNumberInfluence: (num) => {
            if (num === 3) return "Tu habilidad comunicativa geminiana se potencia enormemente con la creatividad y expresividad del Número 3. Eres un comunicador nato, con un gran ingenio, carisma social y talento para la palabra.";
            if (num === 5) return "La versatilidad, curiosidad y amor por la variedad de Géminis se alinean perfectamente con la energía de cambio y aventura del Número 5. Necesitas estímulo mental constante y disfrutas explorando múltiples caminos e ideas.";
            return `Tu Número de Vida ${num} enriquece tu naturaleza geminiana, aportando diferentes enfoques a tu innata curiosidad y tu habilidad para conectar y adaptarte.`;
        }
    },
     "Cáncer": {
        description: "Cáncer (Jun 21 - Jul 22), el Cangrejo, es un signo de Agua Cardinal. Simboliza el hogar, la familia, las emociones, la nutrición y la protección. Los Cáncer son sensibles, intuitivos, protectores y con un fuerte vínculo con su pasado y sus seres queridos. Pueden ser tímidos al principio, pero son profundamente leales, cariñosos y empáticos.",
        element: "Agua", modality: "Cardinal", ruler: "Luna",
        colorPalette: { primary: '#ade8f4', secondary: '#48cae4' }, // Azules suaves y acuosos
        magicNumberInfluence: (num) => {
            if (num === 2) return "Tu sensibilidad y necesidad de conexión emocional canceriana se ven amplificadas por la cooperación y empatía del Número 2. Valoras profundamente las relaciones armónicas y eres un gran cuidador y nutriente.";
            if (num === 6) return "Como Cáncer con un Número de Vida 6, tu enfoque en la familia, el hogar y el cuidado de los demás es primordial. Eres sumamente responsable y buscas crear un nido seguro, amoroso y lleno de calidez.";
            if (num === 9) return "La compasión natural de Cáncer se une al humanitarismo del Número 9. Sientes una profunda necesidad de ayudar y proteger no solo a los tuyos, sino a quienes lo necesitan en un sentido más amplio, mostrando gran empatía.";
            return `Tu Número de Vida ${num} tiñe tu naturaleza canceriana, influyendo en cómo expresas tu profunda sensibilidad, tu instinto protector y tu necesidad de seguridad emocional.`;
        }
    },
    "Leo": {
        description: "Leo (Jul 23 - Ago 22), el León, es un signo de Fuego Fijo. Simboliza la realeza, la autoexpresión, la creatividad, la generosidad y el liderazgo carismático. Los Leo son orgullosos, seguros de sí mismos, magnánimos y les encanta ser el centro de atención. Tienen un gran corazón y una naturaleza noble, pero deben cuidar su ego y su necesidad de admiración constante.",
        element: "Fuego", modality: "Fijo", ruler: "Sol",
        colorPalette: { primary: '#FFB627', secondary: '#FF9505' }, // Dorados y naranjas solares
        magicNumberInfluence: (num) => {
            if (num === 1) return "Tu liderazgo natural leonino se ve potenciado por la individualidad y la fuerza del Número 1. Eres un líder nato, carismático, con una gran capacidad para inspirar a otros y tomar la iniciativa con audacia.";
            if (num === 3) return "La creatividad y necesidad de autoexpresión de Leo se combinan maravillosamente con la energía comunicativa y artística del Número 3. Brillas en el escenario de la vida, disfrutas compartiendo tu alegría y tienes un gran talento para el drama y la actuación.";
            if (num === 8) return "La nobleza y ambición de Leo se unen a la capacidad de logro y poder del Número 8. Tienes potencial para alcanzar grandes metas, liderar con autoridad y generosidad, y atraer el éxito material.";
            return `Tu Número de Vida ${num} aporta una dimensión particular a tu radiante energía leonina, destacando tus talentos, tu forma de brillar y tu necesidad de reconocimiento.`;
        }
    },
    "Virgo": {
        description: "Virgo (Ago 23 - Sep 22), la Virgen, es un signo de Tierra Mutable. Representa el análisis, el servicio, la meticulosidad, la salud y el orden. Los Virgo son prácticos, detallistas, trabajadores e inteligentes, con una mente aguda y un deseo de perfección. Buscan mejorar y ser útiles a los demás, aunque a veces pueden ser demasiado críticos consigo mismos y con los demás.",
        element: "Tierra", modality: "Mutable", ruler: "Mercurio",
        colorPalette: { primary: '#A5A58D', secondary: '#6B705C' }, // Tonos tierra y verdes discretos
        magicNumberInfluence: (num) => {
            if (num === 4) return "Tu atención al detalle y tu naturaleza trabajadora virginiana se ven reforzadas por la organización, la disciplina y la practicidad del Número 4. Eres excelente para crear sistemas eficientes, cumplir con tus responsabilidades y construir con método.";
            if (num === 6) return "La vocación de servicio de Virgo se alinea con la responsabilidad y el cuidado del Número 6. Encuentras gran satisfacción en ayudar a los demás, mantener el orden en tu entorno y velar por el bienestar y la salud.";
            if (num === 7) return "Tu mente analítica y tu búsqueda de conocimiento como Virgo se profundizan con la introspección, la sabiduría y el perfeccionismo del Número 7. Eres un investigador nato, siempre buscando la verdad, la mejora y la especialización.";
            return `Tu Número de Vida ${num} matiza tu enfoque práctico y analítico virginiano, influyendo en cómo aplicas tus habilidades, tu deseo de servir y tu búsqueda de la eficiencia y la pureza.`;
        }
    },
    "Libra": {
        description: "Libra (Sep 23 - Oct 22), la Balanza, es un signo de Aire Cardinal. Simboliza la armonía, la justicia, las relaciones, la belleza y la diplomacia. Los Libra buscan el equilibrio y la paz, son sociables, encantadores y aprecian la estética y el arte. Tienen un fuerte sentido de la equidad, pero a veces les cuesta tomar decisiones por su deseo de complacer a todos.",
        element: "Aire", modality: "Cardinal", ruler: "Venus",
        colorPalette: { primary: '#FFC6FF', secondary: '#BDB2FF' }, // Pasteles y rosas, azules suaves
        magicNumberInfluence: (num) => {
            if (num === 2) return "Tu búsqueda de armonía, cooperación y equilibrio libriana se ve potenciada por la diplomacia, sensibilidad y compañerismo del Número 2. Eres un mediador natural, excelente para crear acuerdos y relaciones justas y equilibradas.";
            if (num === 6) return "El amor por la belleza, la armonía y las relaciones de Libra se complementa con el sentido de responsabilidad, cuidado y justicia del Número 6. Buscas crear entornos bellos y relaciones amorosas, justas y estables.";
            if (num === 9) return "Tu sentido de justicia libriano se expande con el humanitarismo y la compasión del Número 9. Te preocupas por la equidad a gran escala, buscas el bienestar colectivo y tienes un fuerte ideal de un mundo más justo y pacífico.";
            return `Tu Número de Vida ${num} añade una cualidad distintiva a tu naturaleza libriana, influyendo en tu búsqueda de equilibrio, belleza y justicia en todas las áreas de tu vida.`;
        }
    },
    "Escorpio": {
        description: "Escorpio (Oct 23 - Nov 21), el Escorpión (y el Águila/Fénix), es un signo de Agua Fijo. Representa la transformación, la intensidad emocional, el poder, los misterios y la profundidad. Los Escorpio son apasionados, magnéticos, perceptivos y resilientes, con una gran fuerza de voluntad. Buscan la verdad oculta y pueden ser muy leales, pero también posesivos o vengativos si se sienten traicionados.",
        element: "Agua", modality: "Fijo", ruler: "Plutón (y Marte)",
        colorPalette: { primary: '#540B0E', secondary: '#9E2A2B' }, // Rojos oscuros, borgoña, negro
        magicNumberInfluence: (num) => {
            if (num === 7) return "Tu profundidad, intensidad y naturaleza investigadora escorpiana se alinean con la búsqueda de la verdad oculta, la sabiduría y el análisis del Número 7. Eres un detective nato de los misterios de la vida y la psique humana.";
            if (num === 8) return "El poder inherente, la ambición y la capacidad de transformación de Escorpio se combinan con la fuerza de logro, la autoridad y la visión estratégica del Número 8. Tienes una gran capacidad para regenerar situaciones y alcanzar posiciones de influencia.";
            if (num === 9) return "Tu capacidad de transformación escorpiana puede orientarse hacia un propósito más elevado con la compasión, el humanitarismo y la entrega del Número 9. Puedes ser un agente de sanación y cambio profundo para otros, guiado por una causa mayor.";
            return `Tu Número de Vida ${num} interactúa con la poderosa y transformadora energía de Escorpio, guiando tu intensidad, tus talentos ocultos y tu capacidad de regeneración.`;
        }
    },
    "Sagitario": {
        description: "Sagitario (Nov 22 - Dic 21), el Arquero (Centauro), es un signo de Fuego Mutable. Simboliza la expansión, la aventura, la filosofía, la libertad, el optimismo y la búsqueda de la verdad. Los Sagitario son entusiastas, honestos, joviales y amantes del conocimiento, los viajes y las culturas extranjeras. Buscan el significado de la vida y tienen una fe innata en el futuro, aunque pueden ser imprudentes o exagerados.",
        element: "Fuego", modality: "Mutable", ruler: "Júpiter",
        colorPalette: { primary: '#6A0DAD', secondary: '#9400D3' }, // Púrpuras y azules índigo
        magicNumberInfluence: (num) => {
            if (num === 3) return "Tu optimismo, entusiasmo y amor por la aventura sagitariana se expresan maravillosamente a través de la creatividad, la comunicación y la alegría del Número 3. Eres un narrador inspirador, un maestro divertido y disfrutas compartiendo tu sabiduría con humor.";
            if (num === 5) return "La necesidad de libertad, exploración y expansión de Sagitario se magnifica con la energía aventurera, versátil y amante del cambio del Número 5. Estás siempre en búsqueda de nuevos horizontes, conocimientos y experiencias que expandan tu mente y tu espíritu.";
            if (num === 9) return "Tu búsqueda de sabiduría, tu naturaleza filosófica y tu idealismo sagitariano se alinean con el humanitarismo, la visión amplia y la generosidad del Número 9. Te interesa el bienestar global, la justicia social y puedes ser un gran maestro, guía espiritual o filántropo.";
            return `Tu Número de Vida ${num} colorea tu espíritu aventurero y filosófico sagitariano, dándole un enfoque particular a tu búsqueda de la verdad, la libertad y la expansión.`;
        }
    },
    "Capricornio": {
        description: "Capricornio (Dic 22 - Ene 19), la Cabra (a menudo con cola de pez), es un signo de Tierra Cardinal. Representa la ambición, la disciplina, la estructura, la responsabilidad, la perseverancia y el logro a largo plazo. Los Capricornio son trabajadores, pacientes, pragmáticos y estratégicos, con un fuerte sentido del deber y la autoridad. Buscan construir un legado duradero y alcanzar la cima, aunque pueden parecer fríos o distantes.",
        element: "Tierra", modality: "Cardinal", ruler: "Saturno",
        colorPalette: { primary: '#4A4E69', secondary: '#22223B' }, // Grises oscuros, marrones tierra
        magicNumberInfluence: (num) => {
            if (num === 1) return "Tu ambición, determinación y capacidad de liderazgo capricorniana se ven impulsadas por la autosuficiencia, la originalidad y la fuerza iniciadora del Número 1. Eres un estratega nato, capaz de dirigir proyectos hacia el éxito con disciplina y visión.";
            if (num === 4) return "La disciplina, el enfoque en la estructura, la practicidad y la perseverancia de Capricornio se refuerzan con la organización, el trabajo metódico y la construcción de bases sólidas del Número 4. Eres un maestro de la planificación y la ejecución, capaz de edificar logros duraderos.";
            if (num === 8) return "La ambición de Capricornio por el logro, el estatus y la autoridad se alinea perfectamente con el poder de realización, la visión de negocios y la capacidad de gestión del Número 8. Tienes un gran potencial para alcanzar el éxito material, el reconocimiento profesional y posiciones de liderazgo.";
            return `Tu Número de Vida ${num} aporta una cualidad específica a tu naturaleza capricorniana, influyendo en tu camino hacia el logro, la maestría y el reconocimiento social.`;
        }
    },
    "Acuario": {
        description: "Acuario (Ene 20 - Feb 18), el Portador de Agua, es un signo de Aire Fijo. Simboliza la innovación, la originalidad, la libertad, el humanitarismo, la amistad y el pensamiento progresista. Los Acuario son independientes, intelectuales, idealistas y visionarios, a menudo adelantados a su tiempo. Valoran la igualdad, la fraternidad y las causas sociales, aunque pueden ser excéntricos o desapegados emocionalmente.",
        element: "Aire", modality: "Fijo", ruler: "Urano (y Saturno)",
        colorPalette: { primary: '#00B4D8', secondary: '#90E0EF' }, // Azules eléctricos y turquesas
        magicNumberInfluence: (num) => {
            if (num === 5) return "Tu amor por la libertad, la originalidad y la innovación acuariana se combina con la energía de cambio, versatilidad y experimentación del Número 5. Eres un reformador que disfruta rompiendo esquemas, explorando nuevas ideas y promoviendo el progreso.";
            if (num === 7) return "Tu mente intelectual, tu búsqueda de conocimiento y tu enfoque científico acuariano se profundizan con la introspección, el análisis y la sabiduría del Número 7. Eres un pensador original, capaz de descubrir verdades no convencionales y aportar soluciones ingeniosas.";
            if (num === 11) return "Como Acuario con el Número Maestro 11, tu visión humanitaria, tu originalidad y tu intuición se elevan a un nivel de inspiración, revelación y liderazgo vanguardista. Tienes el potencial de ser un gran reformador social, un innovador o un canalizador de ideas progresistas para la humanidad.";
            return `Tu Número de Vida ${num} añade un matiz único a tu naturaleza innovadora y humanitaria acuariana, guiando tu contribución al colectivo y tu deseo de un mundo mejor.`;
        }
    },
    "Piscis": {
        description: "Piscis (Feb 19 - Mar 20), los Peces, es un signo de Agua Mutable. Representa la compasión, la intuición, la imaginación, la espiritualidad, la empatía y la disolución de los límites. Los Piscis son soñadores, sensibles, artísticos y caritativos, con una profunda conexión con el inconsciente colectivo y el mundo invisible. Pueden ser evasivos o idealistas en exceso, pero tienen una gran capacidad de sanación y entrega.",
        element: "Agua", modality: "Mutable", ruler: "Neptuno (y Júpiter)",
        colorPalette: { primary: '#A9DEF9', secondary: '#E4C1F9' }, // Tonos lavanda, violetas y azules marinos suaves
        magicNumberInfluence: (num) => {
            if (num === 2) return "Tu empatía, sensibilidad y naturaleza compasiva pisciana se alinean con la cooperación, la diplomacia y la necesidad de armonía del Número 2. Eres profundamente intuitivo, buscas conexiones emocionales pacíficas y tienes un gran don para comprender a los demás.";
            if (num === 9) return "La compasión universal, el altruismo y la espiritualidad de Piscis se magnifican con el humanitarismo, la generosidad y la entrega desinteresada del Número 9. Tienes una gran capacidad para el servicio, la sanación y la conexión con lo trascendente.";
            if (num === 33) return "Como Piscis con el Número Maestro 33, tu compasión, tu deseo de sanar y tu conexión espiritual se elevan al nivel de maestría y amor universal. Tienes un potencial extraordinario como guía espiritual, sanador o benefactor de la humanidad, encarnando el servicio altruista.";
            return `Tu Número de Vida ${num} enriquece tu naturaleza compasiva e intuitiva pisciana, influyendo en cómo expresas tu creatividad, tu conexión espiritual y tu deseo de ayudar al mundo.`;
        }
    }
};


// Manejo de callback_query
bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    try {
        await ctx.answerCbQuery(); // Confirmar recepción del callback
    } catch (error) {
        console.warn("Error al responder al callback query (puede ser normal si el bot se reinició):", error.message);
    }


    if (action === "mi_numero_magico") {
        await ctx.reply("Por favor, escribe tu fecha de nacimiento en formato DD/MM/AAAA:");
        ctx.session.waitingForBirthday = true;
    } 
    else if (action === "numero_dia") {
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        const magicNumber = calculateMagicNumber(formattedDate);
        const analysis = getDayAnalysis(magicNumber);
        await ctx.reply(`El número mágico del día de hoy (${formattedDate}) es: *${magicNumber}* ✨\n\n_${analysis}_`, { parse_mode: "Markdown" });
        sendAnotherQuery(ctx);
    }
    else if (action === "numero_pitagorico") {
        await ctx.reply("Por favor, escribe tu nombre completo (tal como aparece en tu acta de nacimiento para mayor precisión):");
        ctx.session.waitingForName = true;
    }
    else if (action === "informe_completo") {
        ctx.session.waitingForFullReportName = true;
        await ctx.reply("📝 Para tu informe completo, por favor escribe tu *nombre completo* (usaremos este nombre para el cálculo pitagórico y como titular del informe):", { parse_mode: "Markdown" });
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
    const dateRegex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (ctx.session && ctx.session.waitingForBirthday) {
        if (dateRegex.test(userMessage)) {
            const magicNumber = calculateMagicNumber(userMessage);
            const zodiacSign = getZodiacSign(userMessage);
            const chineseSign = getChineseZodiac(userMessage);
            const description = numerologyDescriptions[magicNumber] || "Información no disponible para este número.";
           await ctx.reply(
                `🎉 Tu Número Mágico (Sendero de Vida) es: *${magicNumber}*\n_${description}_\n\n♈ Tu Signo Zodiacal Solar es: *${zodiacSign}*\n🐉 Tu Animal del Horóscopo Chino es: *${chineseSign}*`,
                { parse_mode: "Markdown" }
            );
            ctx.session.waitingForBirthday = false;
            sendAnotherQuery(ctx);
        } else {
            await ctx.reply("⚠️ Fecha inválida. Por favor, escribe la fecha en formato correcto DD/MM/AAAA (por ejemplo: 23/08/1995).");
        }
    } else if (ctx.session && ctx.session.waitingForName) {
        const name = userMessage;
        
        const pitagoricNumber = calculatePythagoreanNumber(name);
        const reference = getPythagoreanReference(pitagoricNumber);
        await ctx.reply(`🔢 El Número Pitagórico (Expresión/Destino) de tu nombre (*${name}*) es: *${pitagoricNumber}*\n\n_${reference}_`, {
            parse_mode: "Markdown"
        });
        ctx.session.waitingForName = false;
        sendAnotherQuery(ctx);
    } 
    else if (ctx.session && ctx.session.waitingForFullReportName) {
        const name = userMessage;
        if (!name || name.length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
             await ctx.reply("⚠️ Nombre inválido. Por favor, escribe un nombre completo válido usando solo letras y espacios.");
             return;
        }
        ctx.session.fullReportName = name;
        ctx.session.waitingForFullReportName = false;
        ctx.session.waitingForFullReportBirthday = true;
        await ctx.reply(`¡Genial, *${name}*! Ahora, para completar tu informe, escribe tu *fecha de nacimiento* en formato DD/MM/AAAA:`, { parse_mode: "Markdown" });
    }
    else if (ctx.session && ctx.session.waitingForFullReportBirthday) {
        if (dateRegex.test(userMessage)) {
            const name = ctx.session.fullReportName;
            const birthday = userMessage;

            await ctx.reply("📝 Preparando tu informe personalizado... Esto puede tardar unos segundos. ¡Gracias por tu paciencia!");
            await ctx.replyWithChatAction('typing');

            const pitNum = calculatePythagoreanNumber(name);
            const pitDesc = getPythagoreanReference(pitNum);
            const zodiac = getZodiacSign(birthday);
            const chineseZodiac = getChineseZodiac(birthday);
            const magicNum = calculateMagicNumber(birthday);
            const magicDesc = numerologyDescriptions[magicNum] || "Información no disponible.";
            const signInfo = zodiacSignDetails[zodiac] || { description: `Información detallada para ${zodiac} no completamente disponible.`, colorPalette: {primary: '#333333', secondary: '#CCCCCC'} };

            const tempDir = os.tmpdir();
            const filename = `Informe_Numerologico_Astral_${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const filePath = path.join(tempDir, filename);
            
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 50, right: 50 },
                bufferPages: true,
                autoFirstPage: false // Creamos la primera página manualmente para control total
            });
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- GENERACIÓN DEL PDF ---
            doc.addPage(); // Añadir la primera página
            addPdfHeader(doc, name, birthday, signInfo);
            addNumerologySection(doc, pitNum, pitDesc, magicNum, magicDesc);
            addAstrologySection(doc, zodiac, chineseZodiac, signInfo);
            addZodiacSpecificSection(doc, zodiac, signInfo, magicNum); 
            // El footer se añade al final, después de que todas las páginas estén definidas
            // --- FIN GENERACIÓN DEL PDF ---
            
            doc.end(); // Finaliza el documento PDF

            stream.on('finish', async () => {
                try {
                    await ctx.replyWithChatAction('upload_document');
                    await ctx.replyWithDocument(
                        { source: filePath, filename: `Informe_${name.replace(/\s+/g, '_')}.pdf` }, // Nombre de archivo más corto para el usuario
                        { caption: `¡Aquí está tu informe completo, *${name}*! ✨\n\nEspero que te sea de gran utilidad y te brinde nuevas perspectivas.\n\n_Recuerda que esta es una interpretación general basada en principios de numerología y astrología. Para un análisis más profundo y personalizado, siempre es recomendable una consulta individual._` , parse_mode: "Markdown"}
                    );
                } catch (error) {
                    console.error("Error al enviar PDF:", error);
                    await ctx.reply("😥 Hubo un problema al enviar tu informe. Por favor, inténtalo de nuevo más tarde o contacta al administrador del bot.");
                } finally {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Error al eliminar PDF temporal:", filePath, err);
                        else console.log("PDF temporal eliminado:", filePath);
                    });
                    sendAnotherQuery(ctx);
                }
            });

            stream.on('error', async (err) => {
                console.error("Error en el stream del PDF:", err);
                await ctx.reply("😥 Hubo un error interno al crear el PDF. Por favor, intenta de nuevo o contacta al administrador del bot.");
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, () => {}); // Intenta limpiar
                }
                sendAnotherQuery(ctx);
            });

            ctx.session.waitingForFullReportBirthday = false;
            ctx.session.fullReportName = null;
        } else {
            await ctx.reply("⚠️ Fecha inválida. Por favor, escribe la fecha en formato correcto DD/MM/AAAA (por ejemplo: 23/08/1995).");
        }
    } else {
        // Si el usuario envía texto sin que el bot espere nada, se puede ofrecer ayuda.
        // await ctx.reply("No estoy seguro de cómo ayudarte con eso. Usa /start para ver las opciones disponibles o /help para más información.");
    }
});

// --- Funciones para PDF ---
function addPdfHeader(doc, name, birthday, signInfo) {
    const headerColor = signInfo.colorPalette?.primary || '#4A4A4A';
    
    // Logo Opcional (Descomentar y ajustar path si tienes un logo)
    // const logoPath = path.join(__dirname, 'assets', 'logo.png'); // Asumiendo una carpeta 'assets' con 'logo.png'
    // if (fs.existsSync(logoPath)) {
    //     doc.image(logoPath, doc.page.margins.left, doc.page.margins.top -10, { width: 60, x: doc.page.margins.left });
    // }

    doc.fontSize(24).fillColor(headerColor).text('Informe Numerológico y Astral', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333333').text('Un Viaje de Autoconocimiento a Través de los Números y los Astros', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(15).fillColor(headerColor).text(`Para: ${name}`);
    doc.fontSize(11).fillColor('#555555').text(`Fecha de Nacimiento: ${birthday}`);
    doc.moveDown(0.5);

    doc.save()
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .lineWidth(1)
       .strokeColor(signInfo.colorPalette?.secondary || '#CCCCCC')
       .stroke()
       .restore();
    doc.moveDown(1.5);
}

function addNumerologySection(doc, pitNum, pitDesc, magicNum, magicDesc) {
    doc.fontSize(16).fillColor('#2c2c2c').text('Tu Esencia Numérica', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#3a3a3a').text('Número de Sendero de Vida (Fecha de Nacimiento)');
    doc.fontSize(18).font('Helvetica-Bold').fillColor(doc.fillColor().color === '#000000' ? '#1a1a1a' : doc.fillColor().color).text(`${magicNum}`, { indent: 10 });
    doc.font('Helvetica').fontSize(10).fillColor('#505050').text(magicDesc, { indent: 20, align: 'justify' });
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor('#3a3a3a').text('Número de Expresión/Destino (Nombre Completo)');
    doc.fontSize(18).font('Helvetica-Bold').fillColor(doc.fillColor().color === '#000000' ? '#1a1a1a' : doc.fillColor().color).text(`${pitNum}`, { indent: 10 });
    doc.font('Helvetica').fontSize(10).fillColor('#505050').text(pitDesc, { indent: 20, align: 'justify' });
    doc.moveDown(1.5);
}

function addAstrologySection(doc, zodiac, chineseZodiac, signInfo) {
    doc.fontSize(16).fillColor('#2c2c2c').text('Tus Coordenadas Astrales', { underline: true });
    doc.moveDown(0.5);
    const signColor = signInfo.colorPalette?.primary || '#4A4A4A';

    doc.fontSize(13).fillColor(signColor).text('Signo Zodiacal Solar');
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a').text(zodiac, { indent: 10 });
    if (signInfo.element && signInfo.ruler && signInfo.modality) {
        doc.font('Helvetica').fontSize(10).fillColor('#505050')
           .text(`Elemento: ${signInfo.element}  |  Modalidad: ${signInfo.modality}  |  Regente: ${signInfo.ruler}`, { indent: 20 });
    }
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor('#3a3a3a').text('Animal del Horóscopo Chino');
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a1a1a').text(chineseZodiac, { indent: 10 });
    doc.moveDown(1.5);
}

function addZodiacSpecificSection(doc, zodiac, signInfo, magicNum) {
    if (!signInfo || !signInfo.description) {
        doc.fontSize(11).text("Información detallada para este signo no está completamente disponible en esta versión del informe.", {align: 'center', color: 'red'});
        doc.moveDown();
        return;
    }
    
    if (doc.y + 150 > doc.page.height - doc.page.margins.bottom) { // Estimar si el contenido cabe
        doc.addPage();
    }

    const titleColor = signInfo.colorPalette?.primary || '#007bff';
    doc.fontSize(18).fillColor(titleColor).text(`Profundizando en tu Sol en ${zodiac}`, { align: 'center', underline:true });
    doc.moveDown(0.7);

    doc.fontSize(13).fillColor('#2c2c2c').text('Características Clave de tu Signo:', { underline: false });
    doc.fontSize(10).fillColor('#505050').text(signInfo.description, { align: 'justify', indent: 15 });
    doc.moveDown(0.8);

    const influenceText = signInfo.magicNumberInfluence ? signInfo.magicNumberInfluence(magicNum) : "";
    if (influenceText) {
        doc.fontSize(13).fillColor('#2c2c2c').text(`Tu Número de Vida ${magicNum} y la energía de ${zodiac}:`, { underline: false });
        doc.fontSize(10).fillColor('#505050').text(influenceText, { align: 'justify', indent: 15 });
        doc.moveDown(0.8);
    }
    
    if (signInfo.advice) { // Si añades 'advice' a zodiacSignDetails
        doc.fontSize(13).fillColor('#2c2c2c').text('Un Consejo para Ti:', { underline: false });
        doc.fontSize(10).fillColor('#505050').text(signInfo.advice, { align: 'justify', indent: 15 });
        doc.moveDown(0.8);
    }
}

function addPdfFooter(doc, botUsername) {
    const range = doc.bufferedPageRange();
    if (!range) return; // Si no hay páginas (bufferPages no estaba activo o no se añadieron páginas)

    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        
        // Asegurarse de que no se superponga con el contenido
        const footerY = doc.page.height - doc.page.margins.bottom + 15; // Un poco más abajo del margen

        doc.fontSize(8).fillColor('#AAAAAA')
            .text(`Generado por @${botUsername} con Numerología y Astrología - Página ${i + 1} de ${range.count}`,
                doc.page.margins.left,
                footerY,
                {
                    align: 'center',
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right
                }
            );
    }
}
// --- Fin Funciones para PDF ---

// Función para preguntar si quiere consultar otro o salir
function sendAnotherQuery(ctx) {
    ctx.reply("¿Deseas realizar otra consulta o necesitas algo más?", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "💖 Apoyar este proyecto", url: "https://link.mercadopago.com.ar/sebamasaguer" },
                    { text: "📅 Programar una consulta personalizada", url: "https://wa.me/5493874673314" }
                ],
                [
                    { text: "🔁 Nueva Consulta", callback_data: "consultar_otro" },                    
                    { text: "❌ Salir", callback_data: "salir" }
                ],
            ]
        }
    });
}

// Función para calcular el número mágico (Sendero de Vida)
function calculateMagicNumber(date) {
    const digits = date.replace(/[^0-9]/g, '');
    let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
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
    const animals = ["Mono", "Gallo", "Perro", "Cerdo", "Rata", "Buey", "Tigre", "Conejo", "Dragón", "Serpiente", "Caballo", "Cabra"];
    return animals[year % 12];
}

// Función para calcular el número pitagórico (Expresión/Destino)
function calculatePythagoreanNumber(name) {
    const map = {
        A:1, J:1, S:1, Á:1, À:1, Ä:1, Â:1, Ã:1, // Considerar acentos comunes
        B:2, K:2, T:2,
        C:3, L:3, U:3, Ú:3, Ü:3, Ù:3, Û:3,
        D:4, M:4, V:4,
        E:5, N:5, W:5, É:5, È:5, Ê:5, Ë:5, Ñ:5, // Ñ es importante
        F:6, O:6, X:6, Ó:6, Ö:6, Ò:6, Ô:6, Õ:6,
        G:7, P:7, Y:7, Ý:7,
        H:8, Q:8, Z:8,
        I:9, R:9, Í:9, Ï:9, Ì:9, Î:9
    };
    // Normalizar nombre: a mayúsculas, quitar diacríticos (excepto Ñ si la tratas diferente, pero el mapa ya la incluye)
    // y luego quitar todo lo que no sea letra A-Z (o Ñ si la mantienes así)
    const normalizedName = name.toUpperCase()
        .normalize("NFD") // Separa acentos de letras base
        .replace(/[\u0300-\u036f]/g, ""); // Elimina diacríticos (acentos)

    const letters = normalizedName.replace(/[^A-ZÑ]/g, '').split(''); // Permitir Ñ
    let sum = letters.reduce((acc, letter) => acc + (map[letter] || 0), 0);
    
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
}

// Función para obtener la referencia del número pitagórico
function getPythagoreanReference(number) {
    const references = {
        1: "Liderazgo, independencia, originalidad, iniciativa. Pionero y autosuficiente. Fuerza para iniciar proyectos y abrir caminos.",
        2: "Cooperación, diplomacia, sensibilidad, armonía. Mediador y pacificador. Busca la unión y el trabajo en equipo.",
        3: "Creatividad, comunicación, optimismo, sociabilidad. Artista y comunicador. Expresión y alegría de vivir.",
        4: "Estabilidad, trabajo duro, organización, practicidad. Constructor y pilar. Disciplina y bases sólidas.",
        5: "Libertad, aventura, adaptabilidad, cambio. Viajero y buscador. Versatilidad y nuevas experiencias.",
        6: "Responsabilidad, armonía, servicio, amor familiar. Cuidador y protector. Equilibrio y justicia.",
        7: "Introspección, análisis, espiritualidad, sabiduría. Investigador y místico. Búsqueda del conocimiento y la verdad.",
        8: "Poder, éxito material, ambición, autoridad. Ejecutivo y realizador. Capacidad de gestión y logros tangibles.",
        9: "Generosidad, compasión, humanitarismo, altruismo. Filántropo e idealista. Entrega y servicio a los demás.",
        11: "Número Maestro: Intuición elevada, inspiración, idealismo, visión espiritual. Canal de sabiduría superior. Potencial para iluminar a otros.",
        22: "Número Maestro: 'Constructor Maestro'. Capacidad de manifestar grandes proyectos en beneficio de la humanidad. Combina visión idealista y habilidad práctica.",
        33: "Número Maestro: 'Maestro de la Compasión'. Amor universal, sacrificio altruista y enseñanza espiritual. Vibración de sanación y guía elevada."
    };
    return references[number] || "No hay referencia detallada disponible para este número en esta versión.";
}


// Lanzar el bot
bot.launch().then(() => {
    console.log(`Bot @${bot.botInfo.username} iniciado correctamente!`);
}).catch(err => {
    console.error('Error al iniciar el bot:', err);
    process.exit(1); // Salir si el bot no puede iniciar
});

// Capturar errores y señales de terminación
process.once('SIGINT', () => {
    console.log('Recibido SIGINT. Deteniendo bot...');
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Recibido SIGTERM. Deteniendo bot...');
    bot.stop('SIGTERM');
    process.exit(0);
});

process.on('uncaughtException', (error, origin) => {
    console.error(`\nUNCAUGHT EXCEPTION`);
    console.error(`Error: ${error.message}`);
    console.error(`Origin: ${origin}`);
    console.error(`Stack: ${error.stack}`);
    // Considera si quieres intentar detener el bot aquí o simplemente loggear
    // bot.stop('uncaughtException'); // Podría no funcionar si el estado es muy corrupto
    // process.exit(1); // Forzar salida después de loguear podría ser más seguro en algunos casos
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('\nUNHANDLED REJECTION');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    // Lo mismo que arriba, considera cómo manejarlo
});