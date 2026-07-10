const missions = [
  {
    code: 'VISUAL_BOOT_01', type: 'BASE VISUAL',
    intro: 'Quizá podríamos empezar por algo pequeño pero demasiado útil.',
    title: 'Dejar el logo listo para cualquier cosa.',
    body: 'El logo actual está bonito y ya tiene personalidad. Lo único que nos falta es una versión digital realmente limpia, grande y sin fondo, para que nunca tengamos que usar una captura borrosa.',
    why: 'Lo vamos a necesitar en el menú, Smart Link, QR, dashboard, flyers, redes, packaging y cualquier futura colaboración.',
    steps: ['Abre la mejor imagen del logo actual.', 'Pídele a ChatGPT que lo reconstruya sin cambiar su esencia.', 'Guarda una versión PNG transparente, una de fondo claro y otra de fondo oscuro.', 'Nómbralas: hummus-logo-main, hummus-logo-light y hummus-logo-dark.'],
    prompt: 'Te envío el logo actual de Hummus Mediterranean Food. Recréalo en alta resolución, manteniendo exactamente su composición, personalidad y colores. Límpialo sin rediseñarlo. Entrégalo centrado, nítido y listo para usar como logo profesional. Primero haz una versión PNG con fondo transparente. No agregues mockups ni elementos nuevos.',
    reward: '+3 archivos base para toda la marca'
  },
  {
    code: 'VISUAL_BOOT_02', type: 'BASE VISUAL',
    intro: 'El logo alternativo también podría convertirse en una pieza fuerte.',
    title: 'Pulir el logo alternativo sin quitarle lo suyo.',
    body: 'Tenemos una segunda versión del logo. Puede servir para espacios pequeños, perfiles, stickers o lugares donde el logo principal no encaje tan bien.',
    why: 'Una marca se siente más profesional cuando tiene versiones pensadas para distintos tamaños y fondos.',
    steps: ['Compara el logo principal y el alternativo.', 'Decide en qué situaciones se ve mejor cada uno.', 'Limpia el alternativo en HD.', 'Guárdalo también en transparente, claro y oscuro.'],
    prompt: 'Te envío el logo alternativo actual de Hummus Mediterranean Food. Digitalízalo en alta resolución sin cambiar su estilo. Corrige bordes, nitidez y proporciones únicamente cuando sea necesario. Hazlo útil como icono, avatar y sticker. Fondo transparente, sin mockup.',
    reward: '+1 sistema de logo más flexible'
  },
  {
    code: 'ASSET_SCAN_03', type: 'FOOD ASSETS',
    intro: 'Hay fotos de clientes que ya parecen casi fotos de menú.',
    title: 'Encontrar la primera comida con potencial.',
    body: 'Revisa las fotos de Yelp, Google y los assets actuales. Busca solo una foto que esté nítida, se vea apetecible y tenga un plato fácil de separar del fondo.',
    why: 'Esa primera prueba nos dirá qué tan bonito puede verse el menú antes de hacer una sesión de fotos nueva.',
    steps: ['Busca una sola foto, no todas.', 'Evita fotos oscuras, movidas o con demasiadas manos y objetos.', 'Prefiere platos completos y bien centrados.', 'Guárdala dentro de una carpeta llamada food-candidates.'],
    prompt: 'Analiza esta foto como posible base para un artículo de menú digital. Dime si el plato está suficientemente nítido, completo y separable del fondo. Señala qué partes habría que reconstruir para convertirlo en un asset premium sin inventar ingredientes.',
    reward: '+1 candidato para el menú'
  },
  {
    code: 'FOOD_CUT_04', type: 'FOOD ASSETS',
    intro: '¿Qué tal si convertimos esa foto en el primer item real?',
    title: 'Crear un plato transparente, uno solo.',
    body: 'Usa la foto candidata como referencia y crea una versión limpia del mismo plato, respetando sus ingredientes y su forma real. Debe sentirse como Hummus, no como una comida genérica de stock.',
    why: 'Este asset puede entrar directamente en el prototipo del Custom Restaurant Menu.',
    steps: ['Sube la foto elegida.', 'Pide que conserve los ingredientes visibles.', 'Solicita fondo transparente y sombra muy sutil.', 'Compara el resultado con la referencia antes de guardarlo.'],
    prompt: 'Recrea exactamente este plato de Hummus Mediterranean Food como una fotografía profesional de menú. Mantén los ingredientes, cantidades aproximadas, forma de servir y apariencia real de la referencia. No agregues ingredientes nuevos. Vista de 45 grados, iluminación natural suave, bordes limpios, fondo completamente transparente y una sombra mínima debajo del plato. Debe verse real, no como ilustración ni como comida genérica.',
    reward: '+1 item listo para Hummus Menu'
  },
  {
    code: 'FOOD_SYSTEM_05', type: 'FOOD ASSETS',
    intro: 'Si el primero queda bello, podemos darle una regla al resto.',
    title: 'Definir cómo deben verse todos los platos.',
    body: 'Elige el ángulo, la luz, el tamaño del plato y el tipo de sombra que más te gustó. Esa decisión hará que los próximos items se sientan parte del mismo menú.',
    why: 'La consistencia hace que un catálogo improvisado se vea como un producto premium.',
    steps: ['Mira el primer item terminado.', 'Anota ángulo, luz, escala y sombra.', 'Guarda una imagen como referencia maestra.', 'Usa esa referencia cada vez que generes otro plato.'],
    prompt: 'Usa esta imagen como referencia visual maestra para todos los próximos platos de Hummus. Describe en una guía corta el ángulo de cámara, iluminación, contraste, escala, sombra, realismo y encuadre que debemos repetir para que todos los assets parezcan de la misma sesión fotográfica.',
    reward: '+1 regla visual para todo el catálogo'
  },
  {
    code: 'MENU_SCAN_06', type: 'MENU VISUAL',
    intro: 'El menú actual tiene toda la información, pero todavía no tiene la experiencia.',
    title: 'Escoger la primera categoría que merece una portada.',
    body: 'Mira las categorías del menú y escoge la que más te provoque diseñar primero: bowls, wraps, platters, sides, desserts o drinks.',
    why: 'Empezar por una sola categoría nos deja avanzar sin sentir que hay que resolver el restaurante completo de una vez.',
    steps: ['Revisa las capturas del menú.', 'Escoge la categoría más visual.', 'Busca dos o tres fotos relacionadas.', 'Crea una carpeta con el nombre de esa categoría.'],
    prompt: 'Estoy creando la experiencia visual de un menú mediterráneo premium. Te enviaré el menú actual. Ayúdame a detectar cuál categoría tiene más potencial visual para convertirse primero en una sección bonita y apetitosa. No cambies productos ni precios.',
    reward: '+1 categoría activada'
  },
  {
    code: 'MENU_COVER_07', type: 'MENU VISUAL',
    intro: 'Podríamos hacer que cada categoría se sienta como una mini Carrd.',
    title: 'Crear la portada de una categoría.',
    body: 'Diseña una imagen vertical o cuadrada que presente esa categoría con comida real, espacio limpio para texto y la personalidad de Hummus.',
    why: 'Servirá como card de categoría en el menú, landing, Smart Link y promociones.',
    steps: ['Usa assets reales como referencia.', 'No llenes la imagen de texto.', 'Deja espacio para que Janko coloque el nombre desde el sistema.', 'Guarda versión cuadrada y vertical.'],
    prompt: 'Crea una fotografía editorial para presentar la categoría [NOMBRE DE CATEGORÍA] de Hummus Mediterranean Food. Usa las referencias que te envío para mantener la comida y el estilo reales. Composición premium, mediterránea, cálida y limpia, con espacio negativo suficiente para agregar texto después. No incluyas letras ni logos. Haz una versión 1:1 y otra 4:5.',
    reward: '+2 portadas reutilizables'
  },
  {
    code: 'PALETTE_08', type: 'BRAND FEEL',
    intro: 'No hace falta inventar una marca nueva; quizá solo encontrar sus mejores colores.',
    title: 'Sacar la paleta desde lo que ya existe.',
    body: 'Usa el logo, el restaurante y las fotos más bonitas para escoger una paleta corta que se sienta natural para Hummus.',
    why: 'Janko podrá usar los mismos colores en cards, botones, dashboard y menú sin adivinar cada vez.',
    steps: ['Elige entre 4 y 6 colores.', 'Incluye fondo claro, fondo oscuro, color principal y CTA.', 'Anota los códigos HEX.', 'Guarda una lámina sencilla con los colores.'],
    prompt: 'Basándote únicamente en este logo y estas fotos reales de Hummus Mediterranean Food, propón una paleta de 4 a 6 colores que conserve su identidad. Necesito nombre del color, código HEX y uso recomendado: fondo, texto, CTA, acento o borde. Debe sentirse mediterránea, limpia, cálida y moderna, no genérica.',
    reward: '+1 paleta lista para el OS'
  },
  {
    code: 'TYPE_09', type: 'BRAND FEEL',
    intro: 'Una buena letra puede hacer que todo se sienta mucho más caro.',
    title: 'Encontrar dos tipografías que hagan buen match.',
    body: 'Busca una tipografía con personalidad para títulos y otra muy limpia para precios, botones y descripciones.',
    why: 'Con solo esas dos reglas podemos mantener consistencia en todos los assets y pantallas.',
    steps: ['Prueba el nombre HUMMUS en varias fuentes.', 'Evita letras difíciles de leer.', 'Busca opciones disponibles en Google Fonts o Canva.', 'Guarda el nombre exacto de ambas.'],
    prompt: 'Te envío el logo y la estética actual de Hummus Mediterranean Food. Recomiéndame dos tipografías gratuitas: una para títulos con personalidad y otra muy legible para menú, precios y botones. Deben combinar con el logo sin competir con él. Incluye enlaces o nombres exactos de Google Fonts.',
    reward: '+1 sistema tipográfico sencillo'
  },
  {
    code: 'PHOTO_CURATE_10', type: 'ASSET LIBRARY',
    intro: 'Ya hay muchísimo material; quizá solo necesita una curadora.',
    title: 'Escoger las 12 fotos que representan mejor a Hummus.',
    body: 'No hace falta descargar todo. Elige las doce imágenes que harían que alguien quisiera visitar el restaurante: comida, ambiente, detalles y una o dos fotos humanas.',
    why: 'Estas serán la biblioteca inicial para landing, Smart Link, menú y primeras campañas.',
    steps: ['Evita duplicados.', 'Prioriza nitidez y comida apetecible.', 'Mezcla platos, interior y experiencia.', 'Renómbralas del 01 al 12 con una descripción corta.'],
    prompt: 'Voy a enviarte varias fotos de un restaurante mediterráneo. Ayúdame a escoger las 12 más fuertes para una biblioteca de marca inicial. Evalúa apetito, nitidez, composición, confianza y variedad. No edites todavía; solo clasifícalas como HERO, MENU, AMBIENCE, PEOPLE o DETAIL.',
    reward: '+12 assets curados'
  },
  {
    code: 'HERO_11', type: 'LANDING ASSET',
    intro: 'Entre las fotos existentes puede estar la portada completa del restaurante.',
    title: 'Encontrar y preparar una hero image.',
    body: 'Elige una foto que pueda recibir a la gente apenas abra Hummus online. Puede ser comida o ambiente, pero debe sentirse inmediata y deliciosa.',
    why: 'Será la primera impresión del landing y posiblemente del Smart Link.',
    steps: ['Escoge una foto horizontal o con espacio para recortar.', 'Limpia distracciones pequeñas.', 'Crea versión desktop 16:9 y mobile 4:5.', 'No agregues texto dentro de la imagen.'],
    prompt: 'Convierte esta foto real de Hummus Mediterranean Food en una hero image premium para web. Conserva la escena y la comida reales. Mejora luz, nitidez y balance; elimina únicamente distracciones pequeñas. No cambies el restaurante ni inventes elementos. Entrega versión 16:9 y versión 4:5 sin texto.',
    reward: '+2 portadas para lanzamiento'
  },
  {
    code: 'SMARTLINK_12', type: 'SMART LINK',
    intro: 'El Smart Link también puede sentirse como una mini Carrd hecha por ti.',
    title: 'Imaginar la portada del Smart Link.',
    body: 'Piensa qué debería ver alguien que escanea un QR: logo, una foto irresistible y botones para menú, orden, dirección y review.',
    why: 'Janko construirá la lógica; tu composición define cómo se siente entrar.',
    steps: ['Haz un boceto simple en Carrd, Canva o una imagen.', 'Usa máximo una foto principal.', 'Marca dónde pondrías los botones.', 'No te preocupes todavía por hacerlos funcionar.'],
    prompt: 'Ayúdame a crear un concepto visual mobile-first para el Smart Link de Hummus Mediterranean Food. Debe tener logo, una foto principal y accesos claros a Menu, Order Pickup, Directions, Call y Leave a Review. Quiero una estética tipo Carrd premium, limpia y apetitosa. No necesito código; quiero una propuesta de composición visual.',
    reward: '+1 dirección visual para Smart Link'
  },
  {
    code: 'QR_FRAME_13', type: 'QR EXPERIENCE',
    intro: 'El QR no tiene que verse como un cuadrito pegado sin cariño.',
    title: 'Crear un marco bonito para “Scan to Menu”.',
    body: 'Diseña una pieza donde luego podamos insertar el QR real. Puede vivir en mesa, caja, bolsa o mostrador.',
    why: 'Hace que el acceso al menú se vea intencional y aumenta la probabilidad de que la gente lo escanee.',
    steps: ['Deja un espacio cuadrado limpio para el QR.', 'Incluye una frase corta, no demasiada información.', 'Prueba formato vertical y cuadrado.', 'No generes tú el QR; Janko lo colocará.'],
    prompt: 'Diseña una tarjeta visual para Hummus Mediterranean Food con el mensaje “Scan to explore the menu”. Deja un espacio cuadrado claramente vacío para insertar un QR real después. Usa el logo y la paleta que te envío. Estética premium, cálida y limpia, lista para imprimir o mostrar en pantalla. No inventes un QR.',
    reward: '+2 templates para QR'
  },
  {
    code: 'QR_REVIEW_14', type: 'QR EXPERIENCE',
    intro: 'Otra pequeña pieza podría ayudar a convertir visitas en reviews.',
    title: 'Crear el marco para dejar una review.',
    body: 'Haz una tarjeta amable para invitar al cliente a contar cómo le fue. Debe sentirse agradecida, no desesperada.',
    why: 'Las reviews fortalecen Google, confianza local y futuras campañas.',
    steps: ['Usa un mensaje humano y corto.', 'Deja el espacio del QR.', 'Haz una versión para mesa y otra para receipt/bag.', 'Evita prometer descuentos hasta definir la campaña.'],
    prompt: 'Crea una tarjeta de agradecimiento para Hummus Mediterranean Food que invite al cliente a dejar una review de forma humana y elegante. Deja un espacio vacío para un QR real. Mensaje corto, sin presión y sin inventar promociones. Usa la identidad visual de Hummus.',
    reward: '+2 piezas para reputación'
  },
  {
    code: 'PROMO_15', type: 'GROWTH CREATIVE',
    intro: 'Podemos pensar en una promo visual sin decidir todavía el descuento.',
    title: 'Crear un template para la primera oferta.',
    body: 'Diseña la base de una promoción donde el precio o beneficio pueda cambiar. Así no tendremos que empezar de cero cuando se decida el BOGO, combo o descuento.',
    why: 'Nos deja lanzar rápido cuando Janko confirme qué oferta tiene sentido con costos y márgenes.',
    steps: ['Usa una foto fuerte de producto.', 'Deja un área editable para la oferta.', 'Incluye espacio para CTA y fecha.', 'Guarda sin precio definitivo.'],
    prompt: 'Diseña un template editable para una promoción de Hummus Mediterranean Food. Usa una foto real del producto, logo y paleta. Deja espacios claros para nombre de oferta, beneficio, CTA y fecha. No inventes descuento ni precio. Debe servir para Instagram 4:5 y Story 9:16.',
    reward: '+2 templates de campaña'
  },
  {
    code: 'SOCIAL_16', type: 'SOCIAL SYSTEM',
    intro: 'Quizá una sola plantilla bonita ya pueda ordenar el Instagram.',
    title: 'Crear el primer formato repetible de post.',
    body: 'No hace falta rediseñar toda la cuenta. Crea un formato que pueda repetirse para plato de la semana, promo o recomendación.',
    why: 'Reduce el esfuerzo futuro y hace que la cuenta empiece a sentirse conectada con el Hummus OS.',
    steps: ['Escoge un uso concreto.', 'Deja áreas editables.', 'Haz una versión feed y story.', 'Mantén la comida como protagonista.'],
    prompt: 'Crea una plantilla reutilizable para Instagram de Hummus Mediterranean Food. El foco debe ser una foto de comida real. Incluye espacio editable para título corto, detalle y CTA. Usa la identidad visual definida. Haz versión 4:5 y 9:16, sin rellenar con una promoción inventada.',
    reward: '+2 piezas sociales reutilizables'
  },
  {
    code: 'REEL_COVERS_17', type: 'SOCIAL SYSTEM',
    intro: 'Los videos ya existen; quizá solo necesitan portadas que hablen el mismo idioma.',
    title: 'Hacer tres covers para reels existentes.',
    body: 'Cuando descargues los reels, escoge tres que valgan la pena conservar y crea portadas simples para que el perfil se vea más organizado.',
    why: 'Aprovecha contenido actual sin pedir una producción nueva.',
    steps: ['Descarga los reels cuando tengas acceso.', 'Escoge tres con buena comida o ambiente.', 'Toma un frame fuerte.', 'Agrega un título corto con el sistema visual.'],
    prompt: 'Te envío un frame de un reel existente de Hummus Mediterranean Food. Conviértelo en una portada 9:16 limpia y premium. Mantén la foto real, mejora ligeramente luz y nitidez, y deja espacio para un título corto. Usa la tipografía y colores de la marca sin tapar la comida.',
    reward: '+3 reels organizados'
  },
  {
    code: 'MENU_CARD_18', type: 'MENU UI',
    intro: 'Esta idea sí puede ayudar a Janko directamente con la interfaz.',
    title: 'Diseñar cómo se ve una sola card de producto.',
    body: 'Haz un ejemplo con foto, nombre, descripción corta, precio y botón. Solo una card; Janko luego la convierte en sistema.',
    why: 'Une tu gusto visual con la estructura real del menú sin obligarte a diseñar todo el inventario.',
    steps: ['Escoge un producto real y su precio.', 'Usa uno de los assets transparentes.', 'Diseña mobile first.', 'Incluye un botón simple como Add o View.'],
    prompt: 'Crea un mockup mobile-first de una card de menú para Hummus Mediterranean Food. Usa este producto real, su precio real y el asset de comida que te envío. La card debe incluir nombre, descripción corta, precio y botón “Add”. Estética limpia, fondo claro, apetitoso y premium. No diseñes la página completa; solo una card reusable.',
    reward: '+1 componente visual para el OS'
  },
  {
    code: 'EMPTY_STATES_19', type: 'OS DETAILS',
    intro: 'Hasta los momentos vacíos pueden sentirse bonitos.',
    title: 'Crear una mini ilustración para cuando no haya resultados.',
    body: 'Piensa en un pequeño visual de plato, hummus, pita o ingrediente que pueda aparecer cuando una categoría esté vacía o una búsqueda no encuentre nada.',
    why: 'Le da personalidad al sistema y evita pantallas frías.',
    steps: ['Escoge un símbolo sencillo.', 'Hazlo con el estilo de la marca.', 'Fondo transparente.', 'Evita demasiado detalle.'],
    prompt: 'Crea un pequeño asset visual para un estado vacío del Hummus OS. Puede ser un plato de hummus con pita, muy simple pero realista y con personalidad. Fondo transparente, composición centrada, sin texto y sin parecer clipart genérico.',
    reward: '+1 detalle humano para el OS'
  },
  {
    code: 'ASSET_NAMING_20', type: 'ASSET LIBRARY',
    intro: 'Una idea poco glamorosa que después nos va a salvar la vida.',
    title: 'Guardar cada cosa con un nombre que podamos entender.',
    body: 'Cada vez que termines un asset, evita “final-final2”. Usa un nombre que diga negocio, tipo, producto y formato.',
    why: 'Janko podrá encontrar e integrar tus piezas sin preguntarte cuál archivo era.',
    steps: ['Usa minúsculas y guiones.', 'Ejemplo: hummus-chicken-bowl-transparent-v1.png.', 'Separa food, logos, promos, social y qr.', 'Conserva editable y export final.'],
    prompt: 'Voy a enviarte una lista de archivos creativos de Hummus. Propón nombres cortos y consistentes usando esta estructura: hummus-[categoría]-[descripción]-[formato]-v1.ext. No cambies el contenido; solo ayúdame a organizar los nombres.',
    reward: '+1 biblioteca que sí se puede usar'
  },
  {
    code: 'IDEA_UNLOCK_21', type: 'IDEA LIBRE',
    intro: 'A partir de aquí no son necesidades. Son ideas para prenderte el cerebro.',
    title: '¿Y si cada salsa tuviera su propia personalidad?',
    body: 'Podrías imaginar pequeñas cards, colores o nombres visuales para las salsas reales del menú. No hay que cambiar sus nombres; solo hacerlas reconocibles.',
    why: 'Puede convertir extras simples en algo coleccionable, compartible y fácil de vender.',
    steps: ['Mira cuáles salsas existen realmente.', 'Asigna un color o textura a cada una.', 'Haz una sola prueba.', 'Guárdala como concepto, no como decisión final.'],
    prompt: 'Basándote en las salsas reales que aparecen en este menú de Hummus Mediterranean Food, crea un concepto visual para presentarlas como una pequeña colección. No cambies sus nombres ni ingredientes. Propón un color, textura y estilo de card para cada una, manteniendo una estética premium y divertida.',
    reward: '+1 concepto opcional desbloqueado'
  },
  {
    code: 'IDEA_UNLOCK_22', type: 'IDEA LIBRE',
    intro: 'Una bolsa puede convertirse en una foto que la gente quiera subir.',
    title: 'Imaginar un sticker sencillo para packaging.',
    body: 'Usa el logo o una frase corta para crear un sticker que pudiera cerrar bolsas o cajas en el futuro.',
    why: 'Es una mejora barata que puede hacer que el pickup se sienta más de marca.',
    steps: ['Hazlo circular o rectangular.', 'Usa máximo una frase.', 'Prueba sobre una bolsa kraft en mockup.', 'Conserva también el archivo plano.'],
    prompt: 'Diseña un sticker sencillo para packaging de Hummus Mediterranean Food usando el logo actual. Debe funcionar sobre una bolsa kraft o una caja blanca. Estilo limpio, cálido y memorable. Primero entrégame el diseño plano; después muéstralo en un mockup.',
    reward: '+1 idea de packaging'
  },
  {
    code: 'IDEA_UNLOCK_23', type: 'IDEA LIBRE',
    intro: 'Puede existir una pequeña firma visual que aparezca en todas partes.',
    title: 'Crear un pattern inspirado en el logo.',
    body: 'Toma una forma del logo, un ingrediente o un detalle mediterráneo y conviértelo en un patrón muy sutil.',
    why: 'Puede vivir en backgrounds, papel, cards, stories y secciones del Hummus OS.',
    steps: ['Escoge un solo elemento.', 'Repítelo sin que se vea cargado.', 'Haz versión clara y oscura.', 'Prueba cómo se ve detrás de una card.'],
    prompt: 'Crea un patrón repetible y sutil para Hummus Mediterranean Food inspirado en este logo y su identidad. No uses símbolos mediterráneos genéricos si no conectan con la marca. Debe funcionar como background ligero en web, menú, stories y packaging. Entrega versión clara y oscura.',
    reward: '+2 backgrounds propios'
  },
  {
    code: 'IDEA_UNLOCK_24', type: 'IDEA LIBRE',
    intro: 'La gente compra más fácil cuando puede imaginar la combinación.',
    title: 'Visualizar un “build your meal”.',
    body: 'Puedes crear una composición bonita que muestre base, proteína, toppings y salsa, usando solo opciones reales del menú.',
    why: 'Puede ayudar a explicar el producto, inspirar combos y más adelante convertirse en una experiencia interactiva.',
    steps: ['Confirma las opciones del menú.', 'Haz un esquema visual sencillo.', 'Usa fotos o assets reales.', 'No prometas personalizaciones que no existan.'],
    prompt: 'Usando únicamente las opciones reales de este menú, crea un concepto visual de “Build Your Meal” para Hummus Mediterranean Food. Organiza base, proteína, toppings y salsa de forma clara y apetitosa. No inventes ingredientes ni opciones. Quiero una composición visual, no una interfaz funcional todavía.',
    reward: '+1 concepto para aumentar ticket'
  },
  {
    code: 'IDEA_UNLOCK_25', type: 'IDEA LIBRE',
    intro: 'La última idea es completamente tuya.',
    title: 'Crear la pieza que tú sientes que Hummus necesita.',
    body: 'Después de ver fotos, menú, logo y reviews, seguramente algo te va a provocar. Puede ser una Carrd, una portada, una camiseta, una promo o una imagen rara pero bella. Haz una sola pieza sin pedir permiso creativo.',
    why: 'Tu intuición visual también es data. A veces la mejor dirección aparece cuando no estamos intentando cumplir una lista.',
    steps: ['Escoge lo que más te emocione.', 'Usa información real del restaurante.', 'Hazlo hasta que a ti te guste.', 'Guárdalo como “johanka-concept-01”.'],
    prompt: 'Te enviaré todo lo que sé y varios assets reales de Hummus Mediterranean Food. Ayúdame a convertir una idea visual mía en una pieza terminada. No quiero que inventes el concepto por mí: primero pregúntame qué estoy imaginando, luego ayúdame a definir composición, formato y prompt final sin quitarle mi estilo.',
    reward: '+1 pieza libre de Johanka'
  }
];

const KEY = 'boostr_hummus_creative_missions_v1';
let state = loadState();
let current = Number.isInteger(state.current) ? state.current : 0;
let completed = new Set(Array.isArray(state.completed) ? state.completed : []);

const screens = [...document.querySelectorAll('[data-screen]')];
const missionCard = document.getElementById('missionCard');
const cardCode = document.getElementById('cardCode');
const cardType = document.getElementById('cardType');
const softIntro = document.getElementById('softIntro');
const cardTitle = document.getElementById('cardTitle');
const cardBody = document.getElementById('cardBody');
const cardWhy = document.getElementById('cardWhy');
const microSteps = document.getElementById('microSteps');
const promptText = document.getElementById('promptText');
const rewardText = document.getElementById('rewardText');
const completeBtn = document.getElementById('completeBtn');
const savedNote = document.getElementById('savedNote');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const missionLabel = document.getElementById('missionLabel');
const currentNumber = document.getElementById('currentNumber');
const totalNumber = document.getElementById('totalNumber');
const indexGrid = document.getElementById('indexGrid');
const toast = document.getElementById('toast');

totalNumber.textContent = String(missions.length).padStart(2, '0');

function loadState() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function saveState() {
  localStorage.setItem(KEY, JSON.stringify({ current, completed: [...completed], opened: true, updatedAt: new Date().toISOString() }));
}
function showScreen(name) {
  screens.forEach(screen => screen.classList.toggle('is-active', screen.dataset.screen === name));
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}
function formatNumber(index) { return String(index + 1).padStart(2, '0'); }
function renderMission() {
  const m = missions[current];
  cardCode.textContent = m.code;
  cardType.textContent = m.type;
  softIntro.textContent = m.intro;
  cardTitle.textContent = m.title;
  cardBody.textContent = m.body;
  cardWhy.textContent = m.why;
  microSteps.innerHTML = m.steps.map((step, index) => `<div class="micro-step"><b>${index + 1}</b><span>${step}</span></div>`).join('');
  promptText.textContent = m.prompt;
  rewardText.textContent = m.reward;
  missionLabel.textContent = `${m.type} · IDEA ${formatNumber(current)}`;
  currentNumber.textContent = formatNumber(current);
  const pct = Math.round(((current + 1) / missions.length) * 100);
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${pct}% EXPLORADO`;
  const isDone = completed.has(current);
  completeBtn.setAttribute('aria-pressed', String(isDone));
  completeBtn.textContent = isDone ? 'Hecha ✓' : 'Guardar como hecha';
  savedNote.textContent = isDone ? 'guardado en este dispositivo' : '';
  saveState();
  missionCard.animate([{opacity:0, transform:'translateY(14px)'},{opacity:1, transform:'none'}], {duration:420, easing:'cubic-bezier(.22,1,.36,1)'});
}
function buildIndex() {
  indexGrid.innerHTML = missions.map((m, index) => `
    <button class="index-item ${completed.has(index) ? 'done' : ''}" data-index="${index}" type="button">
      <small>IDEA ${formatNumber(index)} · ${m.type}</small>
      <strong>${m.title}</strong>
      <span>${completed.has(index) ? 'HECHA ✓' : 'ABRIR IDEA'}</span>
    </button>`).join('');
  indexGrid.querySelectorAll('[data-index]').forEach(button => button.addEventListener('click', () => {
    current = Number(button.dataset.index);
    showScreen('missions');
    renderMission();
  }));
}
function updateCompletion() {
  document.getElementById('doneCount').textContent = completed.size;
  document.getElementById('leftCount').textContent = missions.length - completed.size;
}

document.querySelector('[data-action="start"]').addEventListener('click', () => { showScreen('missions'); renderMission(); });
document.querySelector('[data-action="return"]').addEventListener('click', () => { showScreen('missions'); renderMission(); });
document.getElementById('prevBtn').addEventListener('click', () => {
  current = current === 0 ? missions.length - 1 : current - 1;
  renderMission();
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (current === missions.length - 1) { updateCompletion(); showScreen('completion'); return; }
  current += 1;
  renderMission();
});
document.getElementById('indexBtn').addEventListener('click', () => { buildIndex(); showScreen('index'); });
document.getElementById('closeIndex').addEventListener('click', () => { showScreen('missions'); renderMission(); });
completeBtn.addEventListener('click', () => {
  if (completed.has(current)) completed.delete(current); else completed.add(current);
  saveState(); renderMission(); showToast(completed.has(current) ? 'Idea guardada como hecha' : 'Idea marcada como pendiente');
});
document.getElementById('copyPrompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(missions[current].prompt); showToast('Prompt copiado'); }
  catch { showToast('Selecciona y copia el prompt manualmente'); }
});
document.addEventListener('keydown', event => {
  if (!document.querySelector('[data-screen="missions"]').classList.contains('is-active')) return;
  if (event.key === 'ArrowRight') document.getElementById('nextBtn').click();
  if (event.key === 'ArrowLeft') document.getElementById('prevBtn').click();
});

if (state.opened) { showScreen('missions'); renderMission(); }
