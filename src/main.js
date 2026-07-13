import './styles.css';
import { getLinkRoute, renderLinkExperience } from './linkSystem.js';

const config = {
  siteUrl: import.meta.env.VITE_SITE_URL || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'boostrlabs@gmail.com',
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT || '',
  analyticsId: import.meta.env.VITE_ANALYTICS_ID || '',
  referralCookieDays: Number(import.meta.env.VITE_REFERRAL_COOKIE_DAYS || 30)
};

const serviceOptions = [
  'Start BOOSTR Build',
  'Local Service Build',
  'Creative Brand Build',
  'Automotive OS Build',
  'Custom OS',
  'BOOSTR Scan',
  'Free Audit',
  'Request Custom OS Quote',
  'Campaign Audit',
  'Apply as Partner',
  'BOOSTR Pulse',
  'Brand Starter Kit',
  'HQ Logo Boost',
  'Extra Page',
  'Booking Integration',
  'WhatsApp Flow',
  'Basic CRM Setup',
  'PDF Report Generation',
  'Dashboard Module',
  'Priority Launch',
  'Not sure yet'
];

const budgetOptions = [
  'Not sure yet',
  '$100 - $250',
  '$250 - $500',
  '$500 - $1,000',
  '$1,000 - $2,500',
  '$2,500+',
  'Custom quote'
];

const industryOptions = ['Beauty / Local Service', 'Automotive', 'Artist / Creator', 'Other Business'];

const timelineOptions = ['Not sure yet', 'ASAP', '1-2 weeks', '2-4 weeks', '1-3 months', 'Flexible'];

const websiteStatusOptions = ['No website yet', 'Website needs work', 'Only Instagram / social media', 'Already have a working site', 'Need internal tools', 'Not sure'];

const intakeModules = [
  'Website',
  'Landing page',
  'CRM',
  'Dashboard',
  'Automation',
  'Booking system',
  'Ecommerce',
  'Smart Link',
  'Client portal',
  'Internal tool',
  'Not sure'
];

const preferredContactOptions = ['email', 'phone', 'whatsapp', 'sms'];

const intakeTimelineOptions = ['ASAP', '1 week', '2-4 weeks', '1-2 months', 'Flexible'];

const intakeBudgetOptions = ['Under $300', '$300 - $500', '$500 - $1,000', '$1,000 - $2,500', '$2,500+', 'Not sure'];

const matchResults = {
  local: {
    offer: 'Local Service Build',
    price: 'Quote',
    why: 'You need a cleaner front-end for bookings, calls, WhatsApp or local lead capture.',
    cta: 'Start Local Build'
  },
  creative: {
    offer: 'Creative Brand Build',
    price: 'Quote',
    why: 'Your brand needs a stronger digital home for attention, inquiries, services or media.',
    cta: 'Start Creative Build'
  },
  automotive: {
    offer: 'Automotive OS Build',
    price: 'Quote',
    why: 'Your operation needs lead structure, deal flow, documents, reports or sales tools.',
    cta: 'Start Automotive Build'
  },
  custom: {
    offer: 'Custom OS',
    price: 'Custom Quote',
    why: 'Your business needs custom logic, dashboards, user roles, integrations or internal tools.',
    cta: 'Request Custom OS Quote'
  },
  brand: {
    offer: 'Brand Starter Kit',
    price: 'Quote',
    why: 'Your first move is looking more professional before building a full website or system.',
    cta: 'Get Brand Starter Kit'
  },
  campaign: {
    offer: 'Campaign Audit',
    price: 'Free',
    why: 'Your capture path, offer, audience, tracking and follow-up should be reviewed first.',
    cta: 'Request Campaign Audit'
  }
};

const partnerPages = {
  gemese: {
    code: 'GEMESE',
    name: 'GEMESE',
    headline: 'A private BOOSTR path for businesses ready to move better.',
    builds: ['Local Service Build', 'Custom OS', 'Campaign Audit']
  },
  janko: {
    code: 'JANKO',
    name: 'Janko Diorr',
    headline: 'A BOOSTR collaboration for artists, creators and brands with a world to build.',
    builds: ['Creative Brand Build', 'Brand Starter Kit', 'Custom OS']
  },
  omgbeauty: {
    code: 'OMGBEAUTY',
    name: 'OMG Beauty',
    headline: 'A BOOSTR collaboration for beauty and local service businesses that need a premium booking flow.',
    builds: ['Local Service Build', 'HQ Logo Boost', 'Booking Integration']
  }
};

const copy = {
  en: {
    nav: [
      ['Builds', 'builds'],
      ['Custom OS', 'custom-os'],
      ['Essentials', 'essentials'],
      ['Work', 'work'],
      ['Partner', 'partner']
    ],
    start: 'Start',
    heroEyebrow: 'Business Boosting Intelligence',
    heroTitle: 'BUILD THE DIGITAL SYSTEM BEHIND YOUR BUSINESS.',
    heroText:
      'Websites, landing pages, CRMs, dashboards, automations and Custom OS built around how your business actually works.',
    heroPrimary: 'Start with a BOOSTR Build',
    heroSecondary: 'Request Custom OS Quote',
    introTitle: 'NOT JUST WEBSITES. BUSINESS SYSTEMS.',
    introText:
      'BOOSTR studies how your business gets clients, sells, follows up, collects data and operates. Then we build the digital flow that helps it move better.',
    introPoints: ['Leads', 'Bookings', 'Workflows', 'Documents', 'Reports', 'Clients', 'Operations'],
    servicesEyebrow: 'OS Modules',
    servicesTitle: 'MODULES THAT CAN BECOME PART OF ONE SYSTEM.',
    servicesText:
      'Clients may ask for one clear service first. BOOSTR builds it as part of a larger system that can grow with the business.',
    services: [
      ['Business Websites', 'A serious digital home built for trust, lead capture and mobile-first conversion.'],
      ['Landing Pages', 'Focused pages for offers, campaigns, bookings, launches and quote requests.'],
      ['Custom Web Apps', 'Client-facing or internal tools shaped around the real workflow.'],
      ['Mobile Apps', 'App experiences for teams, clients, creators or service operations.'],
      ['Automation', 'Useful automation for follow-up, intake, content, support and repetitive tasks.'],
      ['CRM & Business Systems', 'Pipelines, records, dashboards and workflows that keep the operation organized.'],
      ['UI/UX Design', 'Cleaner interfaces, flows and product direction for websites, apps and portals.'],
      ['Ecommerce Systems', 'Stores, product flows, checkout paths and post-purchase structure.'],
      ['Website Redesign', 'A stronger version of an existing site without losing what already works.']
    ],
    buildsEyebrow: 'BOOSTR Builds',
    buildsTitle: 'START WITH A BUILD. UPGRADE INTO AN OS.',
    buildsText:
      'Not every business needs to start from zero. These systems are faster and more accessible because they start from structures we have already built and can customize.',
    builds: [
      {
        name: 'Local Service Build',
        price: 'Quote',
        text:
          'A premium landing page for local service businesses that need to present services clearly and convert visitors into bookings, calls or WhatsApp leads.',
        ideal: 'Beauty studios, nail techs, barbers, med spas, personal trainers, cleaning services and local providers.',
        includes: ['One-page landing page', 'Mobile-first design', 'Booking or WhatsApp CTA', 'Basic copy structure', 'Basic hosting and domain setup'],
        custom: ['Services', 'Prices', 'Photos', 'Booking link', 'Instagram', 'Booksy, Square, Calendly or WhatsApp'],
        cta: 'Start Intake'
      },
      {
        name: 'Creative Brand Build',
        price: 'Quote',
        text:
          'A premium visual website for artists, producers, creators and personal brands that need more than a link-in-bio.',
        ideal: 'Artists, producers, studios, creators, designers, fashion brands, creative directors and personal brands.',
        includes: ['Mini website', 'Strong visual direction', 'Music or portfolio sections', 'Booking or inquiry CTA', 'Launch-ready delivery'],
        custom: ['Visual identity', 'Photos', 'Music links', 'Services', 'Release links', 'Spotify, YouTube, SoundCloud or Untitled'],
        cta: 'Start Intake'
      },
      {
        name: 'Automotive OS Build',
        price: 'Quote',
        text:
          'A professional automotive business system inspired by SOLVE. Built for dealers, brokers and sales teams that need credibility, lead structure and internal organization.',
        ideal: 'Dealers, brokers, finance teams, automotive sellers and lead-based sales operations.',
        includes: ['Public website', 'Lead capture', 'Deal intake', 'Document upload flow', 'Inventory section', 'Basic dashboard structure'],
        custom: ['Lead fields', 'Deal fields', 'Team roles', 'Referral logic', 'PDF reports', 'CRM or inventory tools'],
        cta: 'Start Automotive Build',
        note: 'Quoted after the workflow, lead flow and system scope are mapped.'
      },
      {
        name: 'Custom OS',
        price: 'Custom Quote',
        text:
          'For businesses that need a system built around their own process, data, users, tools, workflows and operations.',
        ideal: 'Businesses with custom logic, internal teams, client portals, dashboards, integrations or advanced workflows.',
        includes: ['Custom CRM', 'Dashboards', 'Client portals', 'User roles', 'Automations', 'Reports / PDF generation'],
        custom: ['Business logic', 'Existing tools', 'API integrations', 'Inventory', 'Notifications'],
        cta: 'Request Custom OS Quote',
        note: 'Quoted after we study the business, scope, modules and integrations needed.'
      }
    ],
    osEyebrow: 'Custom OS',
    osTitle: 'EVERY BUSINESS HAS A SYSTEM. BOOSTR MAKES IT WORK BETTER.',
    osText:
      'We do not force every business into the same structure. We study what makes the business different and build around that advantage.',
    osQuestions: [
      'What do you sell?',
      'Where do leads come from?',
      'What happens after contact?',
      'What tools already run the business?',
      'What should be automated?',
      'What should stay human?'
    ],
    processEyebrow: 'How We Build',
    processTitle: 'STUDY. MAP. BUILD. BOOST.',
    steps: [
      ['01', 'Study', 'Understand the business, offer, tools and client journey.'],
      ['02', 'Map', 'Define the digital flow, data, roles and conversion path.'],
      ['03', 'Build', 'Create the website, tools, dashboards, portals or automations.'],
      ['04', 'Boost', 'Launch, learn and improve the system as the business grows.']
    ],
    industriesEyebrow: 'Industry Logic',
    industriesTitle: 'BUILT AROUND REAL BUSINESS CONTEXT.',
    industries: [
      ['Beauty & Local Services', 'Booksy, Square Appointments, Calendly, WhatsApp, Instagram, Google Business Profile, reviews, services, pricing, FAQs and booking flow.'],
      ['Automotive', 'vAuto, DealerCenter, DriveCentric, Meta leads, Marketplace, inventory, lead intake, finance programs, document upload, PDF reports and user roles.'],
      ['Artists & Creators', 'DistroKid, ONErpm, UnitedMasters, Spotify, Apple Music, YouTube, SoundCloud, Untitled, rollout planning, booking inquiries and social analytics.']
    ],
    essentialsEyebrow: 'BOOSTR Essentials',
    essentialsTitle: 'SMALLER BOOSTS. FAST ENTRY POINTS.',
    essentials: [
      ['Brand Starter Kit', 'Quote', 'A clean starter identity with logo concept, brand direction, color palette, typography direction and a ready-to-share PDF.', 'Get Brand Starter Kit'],
      ['HQ Logo Boost', 'Quote', 'A clean high-quality logo file prepared for digital use, print, profile images and basic brand presentation.', 'Get Logo Boost'],
      ['Landing Page Audit', 'Free', 'We review your current website, Instagram or lead flow and tell you what should be improved first.', 'Get Free Audit']
    ],
    campaignEyebrow: 'Campaign Systems',
    campaignTitle: 'CAMPAIGN SEGMENTATION STARTS WITH AN AUDIT.',
    campaignText:
      'BOOSTR can help structure campaigns for Meta, Google and X, but every campaign starts by reviewing the website, offer, audience, tracking, lead flow and follow-up system.',
    campaignItems: ['Marketing setup', 'Landing page', 'Offer', 'Audience', 'Pixel / tracking', 'Creative assets', 'CRM / follow-up'],
    campaignCta: 'Request Free Campaign Audit',
    interactiveEyebrow: 'Interactive Tools',
    interactiveTitle: 'DIAGNOSE BEFORE YOU BUILD.',
    scanTitle: 'BOOSTR Scan',
    scanText:
      'Submit your business or project. We review what is working, what is slowing you down and what we would build first.',
    scanSuccess:
      "Your BOOSTR Scan is being reviewed. We'll send you what's working, what's slowing you down, and what we would build first.",
    matchTitle: 'BOOSTR Match',
    matchText: 'A short recommendation tool that points you toward the right BOOSTR offer.',
    matchLabels: {
      industry: 'What type of business is this?',
      goal: 'What do you need most right now?',
      stage: 'What stage are you in?'
    },
    matchGoals: ['More bookings / leads', 'Stronger brand presence', 'Internal system / dashboard', 'Campaign review'],
    matchStages: ['Starting', 'Already operating', 'Scaling / team involved'],
    matchDefault: 'Choose a few signals to see the best starting point.',
    comparisonTitle: 'NOT JUST A WEBSITE.',
    comparison: [
      ['Normal Website', 'Shows information', 'Basic contact page', 'Static presence'],
      ['BOOSTR Build', 'Captures leads', 'Connects booking/contact flow', 'Can evolve into Custom OS']
    ],
    pulseEyebrow: 'BOOSTR Pulse',
    pulseTitle: 'KEEP THE SYSTEM ALIVE.',
    pulseText:
      'Monthly optimization for businesses that want their digital system updated, reviewed and improved after launch.',
    pulsePlans: [
      ['BOOSTR Pulse', '$150/mo', 'Light updates, review and priority fixes.'],
      ['BOOSTR Pulse Plus', '$300/mo', 'Ongoing improvements, landing updates and conversion support.'],
      ['BOOSTR OS Support', 'From $500/mo', 'Support for Custom OS modules, dashboards, workflows and deeper systems.']
    ],
    upgradesEyebrow: 'Upgrade Your Build',
    upgradesTitle: 'ADD WHAT YOUR BUSINESS NEEDS NEXT.',
    upgrades: ['HQ Logo Boost', 'Brand Starter Kit', 'Extra Page', 'Booking Integration', 'WhatsApp Flow', 'Basic CRM Setup', 'PDF Report Generation', 'Dashboard Module', 'Campaign Audit', 'Priority Launch'],
    priorityLine: 'Need it faster? Move your Build to the front of the production queue.',
    workEyebrow: 'Selected Systems',
    workTitle: 'CUSTOM OS BY BOOSTR.',
    cases: [
      {
        tag: 'Beauty OS',
        status: 'OMG Beauty',
        title: 'Beauty OS',
        text:
          'A local beauty brand system: landing page, visual direction, flyers with QR and a cleaner WhatsApp booking flow.',
        link: 'View example',
        url: 'https://omgbeauty.netlify.app/',
        media: 'beauty',
        proof: [
          ['Landing page', '/assets/cases/omg-landing.png'],
          ['Booking flow', '/assets/cases/omg-hero.png'],
          ['Visual direction', '/assets/mockups/omg-flyer-front.png'],
          ['QR flyers', '/assets/mockups/omg-flyer-back.png']
        ]
      },
      {
        tag: 'Automotive OS',
        status: 'SOLVE',
        title: 'Automotive OS',
        text:
          'Automotive platform with lead intake, deal structuring, secure documents, PDF reports and internal tools. The same logic can power any lead-based business.',
        link: 'View example',
        url: 'https://solveautomotive.com',
        media: 'solve',
        proof: [
          ['Academy', '/assets/cases/solve-academy.png'],
          ['Deal structurer', '/assets/cases/solve-finance.png'],
          ['PDF reports', '/assets/cases/solve-pdf.png'],
          ['Secure docs', '/assets/cases/solve-docs.png'],
          ['Compare paths', '/assets/cases/solve-compare.png']
        ]
      },
      {
        tag: 'Artist OS',
        status: 'Janko Diorr',
        title: 'Artist OS',
        text:
          'Artist system for identity, project inquiries, lead flow, content structure and future commerce.',
        link: 'View example',
        url: '/janko',
        media: 'artist',
        proof: [
          ['Smart link', '/assets/link/janko/logo-janko-oficial.png'],
          ['WESTDETRO brand', '/assets/link/janko/branding-westdetro-oficial.png'],
          ['Artist website', '/assets/cases/janko-landing.png'],
          ['Audience stats', '/assets/cases/janko-stats.png'],
          ['Creative direction', '/assets/link/janko/branding-janko-oficial.png']
        ]
      }
    ],
    partnerEyebrow: 'BOOSTR Partner Program',
    partnerTitle: 'BECOME A BOOSTR AMBASSADOR.',
    partnerText:
      'If you already work with business owners, creators or brands, you can connect them with BOOSTR through a clean referral relationship. We review the client, quote the work and build the system.',
    partnerBullets: ['Private referral terms', 'Client-friendly introduction', 'No technical work required', 'Commission, service trade or both'],
    partnerCta: 'Apply as Partner',
    partnerForm: {
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      business: 'Business / project',
      link: 'Website or Instagram',
      service: 'Service interested in',
      budget: 'Budget range',
      work: 'What do you do?',
      clients: 'What type of clients can you refer?',
      interest: 'Commission, service trade or both?',
      message: 'Message',
      industry: 'Industry',
      currentProblem: 'Current problem',
      mainGoal: 'Main goal',
      success: 'Partner application received.',
      error: 'Something went wrong. Please try again or contact BOOSTR directly.'
    },
    contactEyebrow: 'Contact',
    contactTitle: 'READY TO BOOST YOUR BUSINESS?',
    form: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      business: 'Business / project',
      link: 'Website or Instagram',
      service: 'Service interested in',
      budget: 'Budget range',
      timeline: 'Timeline',
      websiteStatus: 'Current website status',
      message: 'Message',
      industry: 'Industry',
      currentProblem: 'Current problem',
      mainGoal: 'Main goal',
      button: 'Send Request',
      success: 'Request received. BOOSTR will follow up soon.',
      error: 'Something went wrong. Please try again or contact BOOSTR directly.'
    },
    footer: 'Everybody gets boosted.'
  },
  es: {
    nav: [
      ['Builds', 'builds'],
      ['Custom OS', 'custom-os'],
      ['Essentials', 'essentials'],
      ['Proyectos', 'work'],
      ['Partner', 'partner']
    ],
    start: 'Start',
    heroEyebrow: 'Business Boosting Intelligence',
    heroTitle: 'CONSTRUIMOS EL SISTEMA DIGITAL DETRAS DE TU NEGOCIO.',
    heroText:
      'Websites, landing pages, CRMs, dashboards, automatizaciones y Custom OS construidos alrededor de como tu negocio realmente trabaja.',
    heroPrimary: 'Empezar con BOOSTR Build',
    heroSecondary: 'Cotizar Custom OS',
    introTitle: 'NO SOLO WEBSITES. SISTEMAS DE NEGOCIO.',
    introText:
      'BOOSTR estudia como tu negocio consigue clientes, vende, da seguimiento, captura data y opera. Luego construimos el flujo digital que lo ayuda a moverse mejor.',
    introPoints: ['Leads', 'Bookings', 'Workflows', 'Documentos', 'Reportes', 'Clientes', 'Operacion'],
    servicesEyebrow: 'OS Modules',
    servicesTitle: 'MODULOS QUE PUEDEN SER PARTE DE UN SISTEMA.',
    servicesText:
      'Un cliente puede pedir un servicio claro primero. BOOSTR lo construye como parte de un sistema mayor que puede crecer con el negocio.',
    services: [
      ['Business Websites', 'Una presencia digital seria para confianza, lead capture y conversion mobile-first.'],
      ['Landing Pages', 'Paginas enfocadas para ofertas, campanas, bookings, lanzamientos y quotes.'],
      ['Custom Web Apps', 'Herramientas internas o publicas construidas alrededor del workflow real.'],
      ['Mobile Apps', 'Experiencias app para equipos, clientes, creators u operaciones de servicio.'],
      ['Automation', 'Automatizacion util para follow-up, intake, contenido, soporte y tareas repetidas.'],
      ['CRM & Business Systems', 'Pipelines, records, dashboards y workflows para organizar la operacion.'],
      ['UI/UX Design', 'Interfaces, flujos y direccion de producto mas clara para websites, apps y portals.'],
      ['Ecommerce Systems', 'Tiendas, product flows, checkout paths y estructura post-compra.'],
      ['Website Redesign', 'Una version mas fuerte de un website existente sin perder lo que ya funciona.']
    ],
    buildsEyebrow: 'BOOSTR Builds',
    buildsTitle: 'EMPIEZA CON UN BUILD. CRECE HACIA UN OS.',
    buildsText:
      'No todo negocio tiene que empezar desde cero. Estos sistemas son mas rapidos y accesibles porque parten de estructuras que ya construimos y podemos personalizar.',
    builds: [
      {
        name: 'Local Service Build',
        price: 'Quote',
        text:
          'Landing page premium para negocios locales que necesitan presentar servicios con claridad y convertir visitas en bookings, llamadas o leads por WhatsApp.',
        ideal: 'Beauty studios, nail techs, barbers, med spas, trainers, cleaning services y proveedores locales.',
        includes: ['Landing one-page', 'Diseno mobile-first', 'CTA de booking o WhatsApp', 'Copy basico', 'Hosting y domain setup basico'],
        custom: ['Servicios', 'Precios', 'Fotos', 'Booking link', 'Instagram', 'Booksy, Square, Calendly o WhatsApp'],
        cta: 'Empezar intake'
      },
      {
        name: 'Creative Brand Build',
        price: 'Quote',
        text:
          'Website visual premium para artistas, productores, creators y marcas personales que necesitan mas que un link-in-bio.',
        ideal: 'Artistas, productores, estudios, creators, designers, fashion brands, directores creativos y personal brands.',
        includes: ['Mini website', 'Direccion visual fuerte', 'Secciones de musica o portfolio', 'CTA de booking o inquiry', 'Entrega launch-ready'],
        custom: ['Identidad visual', 'Fotos', 'Links de musica', 'Servicios', 'Release links', 'Spotify, YouTube, SoundCloud o Untitled'],
        cta: 'Empezar intake'
      },
      {
        name: 'Automotive OS Build',
        price: 'Quote',
        text:
          'Sistema profesional automotive inspirado en SOLVE. Para dealers, brokers y equipos de venta que necesitan credibilidad, lead structure y organizacion interna.',
        ideal: 'Dealers, brokers, finance teams, vendedores automotive y operaciones de venta con leads.',
        includes: ['Website publico', 'Lead capture', 'Deal intake', 'Document upload flow', 'Inventario', 'Dashboard basico'],
        custom: ['Lead fields', 'Deal fields', 'Roles de equipo', 'Referral logic', 'Reportes PDF', 'CRM o inventory tools'],
        cta: 'Empezar Automotive Build',
        note: 'Se cotiza despues de mapear workflow, lead flow y alcance del sistema.'
      },
      {
        name: 'Custom OS',
        price: 'Custom Quote',
        text:
          'Para negocios que necesitan un sistema construido alrededor de su propio proceso, data, usuarios, herramientas, workflows y operacion.',
        ideal: 'Negocios con logica propia, equipos internos, client portals, dashboards, integraciones o workflows avanzados.',
        includes: ['Custom CRM', 'Dashboards', 'Client portals', 'Roles de usuario', 'Automatizaciones', 'Reportes / PDF generation'],
        custom: ['Logica del negocio', 'Herramientas existentes', 'API integrations', 'Inventario', 'Notificaciones'],
        cta: 'Cotizar Custom OS',
        note: 'Se cotiza despues de estudiar el negocio, el alcance, los modulos y las integraciones necesarias.'
      }
    ],
    osEyebrow: 'Custom OS',
    osTitle: 'TODO NEGOCIO TIENE UN SISTEMA. BOOSTR LO HACE FUNCIONAR MEJOR.',
    osText:
      'No forzamos todos los negocios dentro de la misma estructura. Estudiamos que hace diferente al negocio y construimos alrededor de esa ventaja.',
    osQuestions: [
      'Que vendes?',
      'De donde vienen los leads?',
      'Que pasa despues del contacto?',
      'Que herramientas ya usas?',
      'Que puede automatizarse?',
      'Que debe quedarse humano?'
    ],
    processEyebrow: 'Como construimos',
    processTitle: 'ESTUDIAR. MAPEAR. CONSTRUIR. BOOSTEAR.',
    steps: [
      ['01', 'Estudiar', 'Entender el negocio, la oferta, las herramientas y el customer journey.'],
      ['02', 'Mapear', 'Definir el flujo digital, data, roles y conversion path.'],
      ['03', 'Construir', 'Crear website, tools, dashboards, portales o automatizaciones.'],
      ['04', 'Boostear', 'Lanzar, aprender y mejorar el sistema mientras el negocio crece.']
    ],
    industriesEyebrow: 'Logica por industria',
    industriesTitle: 'CONSTRUIDO ALREDEDOR DE CONTEXTO REAL.',
    industries: [
      ['Beauty & Local Services', 'Booksy, Square Appointments, Calendly, WhatsApp, Instagram, Google Business Profile, reviews, servicios, precios, FAQs y booking flow.'],
      ['Automotive', 'vAuto, DealerCenter, DriveCentric, Meta leads, Marketplace, inventario, lead intake, finance programs, document upload, PDF reports y user roles.'],
      ['Artists & Creators', 'DistroKid, ONErpm, UnitedMasters, Spotify, Apple Music, YouTube, SoundCloud, Untitled, rollout planning, booking inquiries y social analytics.']
    ],
    essentialsEyebrow: 'BOOSTR Essentials',
    essentialsTitle: 'BOOSTS MAS PEQUENOS. ENTRADAS RAPIDAS.',
    essentials: [
      ['Brand Starter Kit', 'Quote', 'Identidad inicial limpia con concepto de logo, direccion de marca, paleta, tipografia y PDF listo para compartir.', 'Pedir Brand Starter Kit'],
      ['HQ Logo Boost', 'Quote', 'Logo en alta calidad preparado para uso digital, print, profile images y presentacion basica de marca.', 'Pedir Logo Boost'],
      ['Landing Page Audit', 'Gratis', 'Revisamos tu website, Instagram o lead flow y te decimos que deberia mejorarse primero.', 'Pedir Free Audit']
    ],
    campaignEyebrow: 'Campaign Systems',
    campaignTitle: 'LA SEGMENTACION EMPIEZA CON UN AUDIT.',
    campaignText:
      'BOOSTR puede ayudar a estructurar campanas para Meta, Google y X, pero todo empieza revisando website, oferta, audiencia, tracking, lead flow y follow-up.',
    campaignItems: ['Marketing setup', 'Landing page', 'Oferta', 'Audiencia', 'Pixel / tracking', 'Creative assets', 'CRM / follow-up'],
    campaignCta: 'Pedir Campaign Audit Gratis',
    interactiveEyebrow: 'Herramientas interactivas',
    interactiveTitle: 'DIAGNOSTICAR ANTES DE CONSTRUIR.',
    scanTitle: 'BOOSTR Scan',
    scanText:
      'Envia tu negocio o proyecto. Revisamos que funciona, que lo esta frenando y que construiriamos primero.',
    scanSuccess:
      "Your BOOSTR Scan is being reviewed. We'll send you what's working, what's slowing you down, and what we would build first.",
    matchTitle: 'BOOSTR Match',
    matchText: 'Una herramienta corta que recomienda el mejor punto de entrada dentro de BOOSTR.',
    matchLabels: {
      industry: 'Que tipo de negocio es?',
      goal: 'Que necesitas mas ahora?',
      stage: 'En que etapa estas?'
    },
    matchGoals: ['Mas bookings / leads', 'Marca mas fuerte', 'Sistema interno / dashboard', 'Campaign review'],
    matchStages: ['Empezando', 'Ya operando', 'Escalando / con equipo'],
    matchDefault: 'Elige algunas senales para ver el mejor punto de entrada.',
    comparisonTitle: 'NO SOLO UNA PAGINA WEB.',
    comparison: [
      ['Website normal', 'Muestra informacion', 'Pagina de contacto basica', 'Presencia estatica'],
      ['BOOSTR Build', 'Captura leads', 'Conecta booking/contact flow', 'Puede evolucionar a Custom OS']
    ],
    pulseEyebrow: 'BOOSTR Pulse',
    pulseTitle: 'MANTEN EL SISTEMA VIVO.',
    pulseText:
      'Optimizacion mensual para negocios que quieren mantener su sistema digital actualizado, revisado y mejorando despues del launch.',
    pulsePlans: [
      ['BOOSTR Pulse', '$150/mo', 'Updates ligeros, revision y priority fixes.'],
      ['BOOSTR Pulse Plus', '$300/mo', 'Mejoras continuas, updates de landing y conversion support.'],
      ['BOOSTR OS Support', 'Desde $500/mo', 'Soporte para modulos Custom OS, dashboards, workflows y sistemas mas profundos.']
    ],
    upgradesEyebrow: 'Upgrade Your Build',
    upgradesTitle: 'AGREGA LO QUE TU NEGOCIO NECESITA DESPUES.',
    upgrades: ['HQ Logo Boost', 'Brand Starter Kit', 'Extra Page', 'Booking Integration', 'WhatsApp Flow', 'Basic CRM Setup', 'PDF Report Generation', 'Dashboard Module', 'Campaign Audit', 'Priority Launch'],
    priorityLine: 'Need it faster? Move your Build to the front of the production queue.',
    workEyebrow: 'Sistemas seleccionados',
    workTitle: 'CUSTOM OS BY BOOSTR.',
    cases: [
      {
        tag: 'Beauty OS',
        status: 'OMG Beauty',
        title: 'Beauty OS',
        text:
          'Sistema para una marca local de belleza: landing page, direccion visual, flyers con QR y un booking flow mas claro por WhatsApp.',
        link: 'Ver ejemplo',
        url: 'https://omgbeauty.netlify.app/',
        media: 'beauty',
        proof: [
          ['Landing page', '/assets/cases/omg-landing.png'],
          ['Booking flow', '/assets/cases/omg-hero.png'],
          ['Direccion visual', '/assets/mockups/omg-flyer-front.png'],
          ['Flyers QR', '/assets/mockups/omg-flyer-back.png']
        ]
      },
      {
        tag: 'Automotive OS',
        status: 'SOLVE',
        title: 'Automotive OS',
        text:
          'Plataforma automotive con lead intake, deal structuring, documentos seguros, reportes PDF y herramientas internas. La misma logica puede potenciar cualquier negocio con leads.',
        link: 'Ver ejemplo',
        url: 'https://solveautomotive.com',
        media: 'solve',
        proof: [
          ['Academy', '/assets/cases/solve-academy.png'],
          ['Deal structurer', '/assets/cases/solve-finance.png'],
          ['Reportes PDF', '/assets/cases/solve-pdf.png'],
          ['Docs seguros', '/assets/cases/solve-docs.png'],
          ['Rutas de deal', '/assets/cases/solve-compare.png']
        ]
      },
      {
        tag: 'Artist OS',
        status: 'Janko Diorr',
        title: 'Artist OS',
        text:
          'Sistema de artista para identidad, project inquiries, flujo de leads, estructura de contenido y futuro commerce.',
        link: 'Ver ejemplo',
        url: '/janko',
        media: 'artist',
        proof: [
          ['Smart link', '/assets/link/janko/logo-janko-oficial.png'],
          ['Marca WESTDETRO', '/assets/link/janko/branding-westdetro-oficial.png'],
          ['Website artista', '/assets/cases/janko-landing.png'],
          ['Stats audiencia', '/assets/cases/janko-stats.png'],
          ['Direccion creativa', '/assets/link/janko/branding-janko-oficial.png']
        ]
      }
    ],
    partnerEyebrow: 'BOOSTR Partner Program',
    partnerTitle: 'BECOME A BOOSTR AMBASSADOR.',
    partnerText:
      'Si ya trabajas con business owners, creators o marcas, puedes conectarlos con BOOSTR mediante una relacion de referral limpia. Nosotros revisamos el cliente, cotizamos y construimos el sistema.',
    partnerBullets: ['Terminos privados de referral', 'Introduccion client-friendly', 'No necesitas hacer trabajo tecnico', 'Comision, service trade o ambos'],
    partnerCta: 'Aplicar como Partner',
    partnerForm: {
      name: 'Nombre completo',
      email: 'Email',
      phone: 'Telefono',
      business: 'Negocio / proyecto',
      link: 'Website o Instagram',
      service: 'Servicio de interes',
      budget: 'Rango de budget',
      work: 'Que haces?',
      clients: 'Que tipo de clientes puedes referir?',
      interest: 'Comision, service trade o ambos?',
      message: 'Mensaje',
      industry: 'Industria',
      currentProblem: 'Problema actual',
      mainGoal: 'Meta principal',
      success: 'Aplicacion recibida.',
      error: 'Algo fallo. Intenta de nuevo o contacta a BOOSTR directo.'
    },
    contactEyebrow: 'Contacto',
    contactTitle: 'LISTO PARA BOOSTEAR TU NEGOCIO?',
    form: {
      name: 'Nombre',
      email: 'Email',
      phone: 'Telefono',
      business: 'Negocio / proyecto',
      link: 'Website o Instagram',
      service: 'Servicio de interes',
      budget: 'Rango de budget',
      timeline: 'Timeline',
      websiteStatus: 'Estado del website actual',
      message: 'Mensaje',
      industry: 'Industria',
      currentProblem: 'Problema actual',
      mainGoal: 'Meta principal',
      button: 'Enviar Request',
      success: 'Solicitud recibida. BOOSTR te contactara pronto.',
      error: 'Algo fallo. Intenta de nuevo o contacta a BOOSTR directo.'
    },
    footer: 'Everybody gets boosted.'
  }
};

let language = localStorage.getItem('boostr-language') || 'en';

const mediaTemplate = (type) => {
  if (type === 'beauty') {
    return `
      <div class="case-media beauty-media" aria-label="OMG Beauty print campaign preview">
        <img src="/assets/mockups/omg-flyer-front.png" alt="" />
        <img src="/assets/mockups/omg-flyer-back.png" alt="" />
      </div>
    `;
  }

  return `
    <div class="case-media system-media ${type}" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
};

const proofTemplate = (proof = []) => {
  if (!proof.length) return '';
  const [firstLabel, firstSrc] = proof[0];

  return `
    <div class="proof-showcase" data-proof-showcase>
      <div class="proof-preview">
        <img src="${firstSrc}" alt="${firstLabel}" loading="lazy" data-proof-preview />
      </div>
      <div class="proof-tabs" aria-label="Project proof">
        ${proof
          .map(
            ([label, src], index) => `
              <button type="button" class="${index === 0 ? 'is-active' : ''}" data-proof-tab data-proof-src="${src}">
                ${label}
              </button>
            `
          )
          .join('')}
      </div>
    </div>
  `;
};

const listTemplate = (items = []) => `
  <ul>
    ${items.map((item) => `<li>${item}</li>`).join('')}
  </ul>
`;

const optionsTemplate = (items = [], selected = '') =>
  items.map((item) => `<option value="${item}" ${item === selected ? 'selected' : ''}>${item}</option>`).join('');

const scanTemplate = (t) => `
  <form class="contact-form scan-form reveal" data-managed-form data-form-kind="scan">
    <label><span>${t.form.name}</span><input name="name" autocomplete="name" required /></label>
    <label><span>${t.form.email}</span><input name="email" type="email" autocomplete="email" required /></label>
    <label><span>${t.form.phone}</span><input name="phone" autocomplete="tel" required /></label>
    <label><span>${t.form.business}</span><input name="businessProject" required /></label>
    <label>
      <span>${t.form.industry}</span>
      <select name="industry" required>${optionsTemplate(industryOptions)}</select>
    </label>
    <label><span>${t.form.link}</span><input name="link" /></label>
    <label><span>${t.form.currentProblem}</span><textarea name="currentProblem" rows="3" required></textarea></label>
    <label><span>${t.form.mainGoal}</span><textarea name="mainGoal" rows="3" required></textarea></label>
    <input type="hidden" name="serviceInterested" value="BOOSTR Scan" />
    <input type="hidden" name="referralCode" data-referral-input />
    <button class="primary-button form-button" type="submit">${t.scanTitle}</button>
    <p class="form-status" data-form-status hidden></p>
  </form>
`;

const matchTemplate = (t) => `
  <div class="match-tool reveal" data-match-tool>
    <div class="match-controls">
      <label>
        <span>${t.matchLabels.industry}</span>
        <select data-match-industry>${optionsTemplate(industryOptions)}</select>
      </label>
      <label>
        <span>${t.matchLabels.goal}</span>
        <select data-match-goal>${optionsTemplate(t.matchGoals)}</select>
      </label>
      <label>
        <span>${t.matchLabels.stage}</span>
        <select data-match-stage>${optionsTemplate(t.matchStages)}</select>
      </label>
    </div>
    <div class="match-result" data-match-result>
      <span>BOOSTR Match</span>
      <h3>${t.matchDefault}</h3>
      <p></p>
      <a href="/quote" data-lead-intent="Free Audit">Start</a>
    </div>
  </div>
`;

const comparisonTemplate = (t) => `
  <div class="comparison-panel reveal">
    ${t.comparison
      .map(
        ([title, ...items]) => `
          <article>
            <h3>${title}</h3>
            ${items.map((item) => `<span>${item}</span>`).join('')}
          </article>
        `
      )
      .join('')}
  </div>
`;

const pulseTemplate = (t) => `
  <div class="pulse-grid">
    ${t.pulsePlans
      .map(
        ([name, price, text]) => `
          <article class="pulse-card reveal">
            <span>${price}</span>
            <h3>${name}</h3>
            <p>${text}</p>
            <a href="#contact" data-lead-intent="BOOSTR Pulse">Request Pulse</a>
          </article>
        `
      )
      .join('')}
  </div>
`;

const upgradesTemplate = (t) => `
  <div class="upgrade-panel reveal">
    <div>
      <p class="eyebrow">${t.upgradesEyebrow}</p>
      <h2>${t.upgradesTitle}</h2>
      <p>${t.priorityLine}</p>
    </div>
    <div class="upgrade-list">
      ${t.upgrades.map((item) => `<a href="#contact" data-lead-intent="${item}">${item}</a>`).join('')}
    </div>
  </div>
`;

const getReferralCode = () => localStorage.getItem('boostr-referral-code') || '';

const setReferralCode = (code) => {
  const cleanCode = code.trim().slice(0, 80);
  if (!cleanCode) return;

  localStorage.setItem('boostr-referral-code', cleanCode);

  const maxAge = config.referralCookieDays * 24 * 60 * 60;
  document.cookie = `boostr_ref=${encodeURIComponent(cleanCode)}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const captureReferralFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');

  if (ref) {
    setReferralCode(ref);
  }
};

const serializeForm = (form) => {
  const formData = new FormData(form);
  const payload = {};

  formData.forEach((value, key) => {
    const cleanKey = key.endsWith('[]') ? key.slice(0, -2) : key;

    if (payload[cleanKey]) {
      payload[cleanKey] = Array.isArray(payload[cleanKey]) ? [...payload[cleanKey], value] : [payload[cleanKey], value];
      return;
    }

    payload[cleanKey] = key.endsWith('[]') ? [value] : value;
  });

  return {
    ...payload,
    referralCode: payload.referralCode || getReferralCode(),
    formKind: form.dataset.formKind || 'lead',
    language,
    siteUrl: config.siteUrl,
    pageUrl: window.location.href,
    submittedAt: new Date().toISOString()
  };
};

const submitLead = async (payload) => {
  if (!config.formEndpoint) {
    console.info('BOOSTR lead capture placeholder:', payload);
    return { placeholder: true };
  }

  const response = await fetch(config.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Form endpoint rejected the request.');
  }

  return response;
};

const submitIntake = async (payload) => {
  const response = await fetch('/api/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => null);

  const contentType = response?.headers.get('content-type') || '';

  if (!response || response.status === 404 || !contentType.includes('application/json')) {
    console.info('BOOSTR intake API placeholder:', payload);
    return { placeholder: true };
  }

  if (!response.ok) {
    throw new Error('Intake endpoint rejected the request.');
  }

  return response.json();
};

const intakeTemplate = (t) => `
  <form class="intake-form reveal" data-intake-form data-form-kind="intake">
    <div class="intake-progress" aria-label="Intake progress">
      ${['Contact', 'Business', 'Build', 'Problem', 'Timeline', 'Submit']
        .map((item, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-intake-nav="${index}">${String(index + 1).padStart(2, '0')} ${item}</button>`)
        .join('')}
    </div>

    <section class="intake-step is-active" data-intake-step>
      <p class="eyebrow">Step 01</p>
      <h2>Who should BOOSTR contact?</h2>
      <div class="intake-grid">
        <label><span>Full name</span><input name="contact_name" autocomplete="name" required /></label>
        <label><span>Email</span><input name="contact_email" type="email" autocomplete="email" required /></label>
        <label><span>Phone</span><input name="contact_phone" autocomplete="tel" /></label>
        <label>
          <span>Preferred contact</span>
          <select name="preferred_contact_method">${optionsTemplate(preferredContactOptions)}</select>
        </label>
      </div>
    </section>

    <section class="intake-step" data-intake-step>
      <p class="eyebrow">Step 02</p>
      <h2>What business is this OS for?</h2>
      <div class="intake-grid">
        <label><span>Business name</span><input name="business_name" autocomplete="organization" required /></label>
        <label><span>Industry</span><select name="industry" required>${optionsTemplate(industryOptions)}</select></label>
        <label><span>City / State</span><input name="city_state" /></label>
        <label><span>Current website</span><input name="current_website_url" type="url" /></label>
        <label><span>Social links</span><textarea name="social_links" rows="3"></textarea></label>
        <label><span>Current website status</span><select name="current_website_status">${optionsTemplate(websiteStatusOptions)}</select></label>
      </div>
    </section>

    <section class="intake-step" data-intake-step>
      <p class="eyebrow">Step 03</p>
      <h2>What needs to be built?</h2>
      <label><span>Project goal</span><textarea name="project_goal" rows="4" required></textarea></label>
      <div class="module-select" aria-label="Requested modules">
        ${intakeModules
          .map(
            (module) => `
              <label>
                <input type="checkbox" name="requested_modules[]" value="${module}" />
                <span>${module}</span>
              </label>
            `
          )
          .join('')}
      </div>
    </section>

    <section class="intake-step" data-intake-step>
      <p class="eyebrow">Step 04</p>
      <h2>Where is the friction?</h2>
      <div class="intake-grid">
        <label><span>Current status</span><textarea name="current_status" rows="3" required></textarea></label>
        <label><span>Biggest problem</span><textarea name="biggest_problem" rows="3"></textarea></label>
        <label><span>What is manual or confusing?</span><textarea name="manual_or_confusing" rows="3"></textarea></label>
        <label><span>What should the system help you do?</span><textarea name="system_outcome" rows="3"></textarea></label>
      </div>
    </section>

    <section class="intake-step" data-intake-step>
      <p class="eyebrow">Step 05</p>
      <h2>Timeline and budget signal.</h2>
      <div class="intake-grid">
        <label><span>Timeline</span><select name="timeline">${optionsTemplate(intakeTimelineOptions)}</select></label>
        <label><span>Budget range</span><select name="budget_range">${optionsTemplate(intakeBudgetOptions)}</select></label>
      </div>
    </section>

    <section class="intake-step" data-intake-step>
      <p class="eyebrow">Step 06</p>
      <h2>Final context.</h2>
      <label><span>Anything else BOOSTR should know?</span><textarea name="extra_message" rows="5"></textarea></label>
      <label class="consent-row">
        <input type="checkbox" name="consent_to_contact" value="yes" required />
        <span>I agree that BOOSTR can contact me about this Custom OS request.</span>
      </label>
      <input type="hidden" name="source" value="website" />
      <input type="hidden" name="referralCode" data-referral-input />
    </section>

    <div class="intake-actions">
      <button class="secondary-button" type="button" data-intake-prev>Back</button>
      <button class="primary-button" type="button" data-intake-next>Next</button>
      <button class="primary-button" type="submit" data-intake-submit hidden>Submit Intake</button>
    </div>
    <p class="form-status" data-form-status hidden></p>
  </form>
`;

const renderShell = (content, footerLabel = 'BOOSTR Labs') => {
  const t = copy[language];

  document.querySelector('#app').innerHTML = `
    <header class="site-header" data-header>
      <nav class="nav-shell" aria-label="Primary navigation">
        <a class="brand" href="/" aria-label="BOOSTR Labs home">
          <img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" />
        </a>
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/quote">Intake</a>
          <a href="/app">Client</a>
          <a href="/admin">Admin</a>
          <a href="/login">Login</a>
        </div>
        <div class="nav-actions">
          <div class="language-toggle" aria-label="Language">
            <button type="button" data-language="es" class="${language === 'es' ? 'is-active' : ''}">ES</button>
            <button type="button" data-language="en" class="${language === 'en' ? 'is-active' : ''}">EN</button>
          </div>
        </div>
      </nav>
    </header>
    ${content}
    <footer class="footer">
      <span>${footerLabel}</span>
      <span>${t.footer}</span>
    </footer>
  `;

  bindPage();
};

const renderIntakePage = () => {
  renderShell(`
    <main id="top">
      <section class="section-shell intake-hero">
        <div class="section-copy reveal">
          <p class="eyebrow">BOOSTR Intake</p>
          <h1>START YOUR CUSTOM OS.</h1>
          <p>Tell us how your business works now, where the friction is, and what system needs to exist next. This creates the first structured lead/project record.</p>
        </div>
        ${intakeTemplate(copy[language])}
      </section>
    </main>
  `);
};

const renderDashboardPlaceholder = (type) => {
  const isAdmin = type === 'admin';
  const cards = isAdmin
    ? [
        ['Lead inbox', 'New intake requests, qualification status and source tracking.'],
        ['Project pipeline', 'Discovery, quoted, preview, review and delivered builds.'],
        ['Businesses', 'Client business records connected to leads and projects.'],
        ['Partners', 'Referral codes, referred leads and payout readiness.']
      ]
    : [
        ['Projects', 'Client-facing project status and current modules.'],
        ['Messages', 'Project communication and follow-up.'],
        ['Files', 'Assets, uploads and final deliverables.'],
        ['Invoices', 'Manual payment links now, billing records later.']
      ];

  renderShell(`
    <main id="top">
      <section class="section-shell dashboard-shell">
        <div class="section-copy reveal">
          <p class="eyebrow">${isAdmin ? 'BOOSTR Admin' : 'Client OS'}</p>
          <h1>${isAdmin ? 'ADMIN DASHBOARD FOUNDATION.' : 'CLIENT DASHBOARD FOUNDATION.'}</h1>
          <p>${isAdmin ? 'Early admin route for lead, project, module and partner operations.' : 'Early client route for project visibility, files, messages and invoices.'}</p>
        </div>
        <div class="dashboard-grid">
          ${cards
            .map(
              ([title, text]) => `
                <article class="dashboard-card reveal">
                  <h3>${title}</h3>
                  <p>${text}</p>
                  <span>Architecture stub</span>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    </main>
  `, isAdmin ? 'BOOSTR Admin' : 'BOOSTR Client OS');
};

const appSystems = [
  {
    category: 'Operating Systems',
    title: 'BOOSTR Worker OS',
    description: 'Entrar al BOOSTR Worker OS',
    status: 'Access',
    icon: 'worker',
    accent: 'blue',
    href: '/admin',
    logos: [
      { name: 'BOOSTR Labs', src: '/assets/logos/boostr-logo-nav.png', href: '/admin' }
    ]
  },
  {
    category: 'Parking',
    title: 'Parking OS',
    description: 'Abrir servicio conectado',
    status: 'Live',
    icon: 'parking',
    accent: 'cyan',
    href: '/login',
    logos: [
      { name: 'Ben Soli Parking', label: 'BEN SOLI', href: '/login' }
    ]
  },
  {
    category: 'Restaurant',
    title: 'Restaurant OS',
    description: 'Disponible para miembros',
    status: 'Members',
    icon: 'restaurant',
    accent: 'gold',
    locked: true,
    logos: [
      { name: 'Hummus', label: 'HUMMUS', href: '/login' }
    ]
  },
  {
    category: 'Automotive',
    title: 'Automotive OS',
    description: 'Proximamente',
    status: 'Soon',
    icon: 'car',
    accent: 'indigo',
    locked: true,
    logos: []
  },
  {
    category: 'Artist',
    title: 'Artist OS',
    description: 'Proximamente',
    status: 'Soon',
    icon: 'mic',
    accent: 'rose',
    locked: true,
    logos: []
  },
  {
    category: 'Payments',
    title: 'Payments OS',
    description: 'Proximamente',
    status: 'Soon',
    icon: 'card',
    accent: 'green',
    locked: true,
    logos: [
      { name: 'BOOSTR Labs', src: '/assets/logos/boostr-logo-nav.png', href: '/login' }
    ]
  },
  {
    category: 'Beauty',
    title: 'Beauty OS',
    description: 'Proximamente',
    status: 'Soon',
    icon: 'sparkle',
    accent: 'pink',
    locked: true,
    logos: []
  }
];

const appIconTemplate = (name) => {
  const icons = {
    worker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 11h3a2 2 0 0 1 2 2v6h-7v-6a2 2 0 0 1 2-2z"></path><path d="M15 11V8a3 3 0 0 1 6 0v3"></path><circle cx="8" cy="7" r="3"></circle><path d="M3 20v-2a5 5 0 0 1 8.4-3.7"></path></svg>',
    parking: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V4h7a5 5 0 0 1 0 10H7"></path><path d="M7 14h7"></path></svg>',
    restaurant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18"></path><path d="M4 3v6a2 2 0 0 0 4 0V3"></path><circle cx="15" cy="12" r="5"></circle><path d="M20 4v17"></path></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12 7 6h10l2 6"></path><path d="M4 12h16v6H4z"></path><circle cx="7" cy="18" r="1"></circle><circle cx="17" cy="18" r="1"></circle></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path><path d="M8 21h8"></path><path d="m18 4 .5 1.5L20 6l-1.5.5L18 8l-.5-1.5L16 6l1.5-.5z"></path></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h3"></path><circle cx="17" cy="15" r="1"></circle></svg>',
    sparkle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"></path><path d="m5 3 .8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z"></path></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7"></path><path d="M6 10v10h12V10"></path></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6z"></path><path d="m9 12 2 2 4-5"></path></svg>'
  };

  return icons[name] || icons.sparkle;
};

const appLogoTemplate = (logo, disabled = false) => {
  const content = logo.src
    ? `<img src="${logo.src}" alt="${logo.name}" />`
    : `<strong>${logo.label || logo.name}</strong>`;
  const classes = `app-logo-button${disabled ? ' is-disabled' : ''}`;

  return `<a class="${classes}" href="${logo.href || '/login'}" aria-label="${logo.name}">${content}<span>${logo.name}</span></a>`;
};

const renderAppLauncherPage = () => {
  document.querySelector('#app').innerHTML = `
    <main class="app-launcher-page" id="top">
      <header class="app-launcher-header" aria-label="BOOSTR app launcher">
        <a class="app-launcher-brand" href="/" aria-label="BOOSTR Labs home">
          <img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" />
        </a>
        <label class="app-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Buscar OS" aria-label="Buscar OS" />
        </label>
        <a class="app-launcher-mark" href="/login" aria-label="Login">
          <img src="/assets/icons/07.-b-star-icon-app.png" alt="" />
        </a>
      </header>

      <section class="app-system-panel" aria-labelledby="app-os-title">
        <div class="app-panel-heading">
          <p class="eyebrow" id="app-os-title">Operating Systems</p>
          <span aria-hidden="true"></span>
        </div>
        <div class="app-system-list">
          ${appSystems
            .map(
              (system) => `
                <article class="app-system-card ${system.locked ? 'is-locked' : ''} app-accent-${system.accent}">
                  <div class="app-system-icon">${appIconTemplate(system.icon)}</div>
                  <div class="app-system-copy">
                    <small>${system.category}</small>
                    <h2>${system.title}</h2>
                    <p>${system.description}</p>
                    <div class="app-logo-row">
                      ${
                        system.logos.length
                          ? system.logos.map((logo) => appLogoTemplate(logo, system.locked && system.status === 'Soon')).join('')
                          : '<span class="app-empty-logo">Sin partners activos</span>'
                      }
                    </div>
                  </div>
                  <div class="app-system-actions">
                    <span>${system.status}</span>
                    <a class="app-open-button" href="${system.locked ? '/login' : system.href}" aria-label="Abrir ${system.title}">${system.locked ? '•••' : '→'}</a>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="app-role-panel" aria-labelledby="new-boostr-title">
        <h2 id="new-boostr-title">¿Nuevo en BOOSTR?</h2>
        <div class="app-role-grid">
          <a class="app-role-card is-primary" href="/quote">
            ${appIconTemplate('home')}
            <span>Soy negocio</span>
          </a>
          <a class="app-role-card" href="/login">
            ${appIconTemplate('user')}
            <span>Soy cliente</span>
          </a>
          <a class="app-role-card" href="/admin">
            ${appIconTemplate('shield')}
            <span>Soy manager BOOSTR</span>
          </a>
        </div>
      </section>
    </main>
  `;
};

const renderLoginPage = () => {
  renderShell(`
    <main id="top">
      <section class="section-shell login-shell">
        <div class="section-copy reveal">
          <p class="eyebrow">Auth preview</p>
          <h1>LOGIN WILL UNLOCK THE OS.</h1>
          <p>This route is reserved for client, partner, operator and admin access once auth is connected.</p>
        </div>
        <form class="contact-form reveal">
          <label><span>Email</span><input type="email" autocomplete="email" disabled placeholder="Auth pending" /></label>
          <label><span>Password</span><input type="password" disabled placeholder="Cloudflare/auth provider pending" /></label>
          <button class="primary-button form-button" type="button" disabled>Auth Stub</button>
        </form>
      </section>
    </main>
  `, 'BOOSTR Auth');
};

const getPartnerFromPath = () => {
  const match = window.location.pathname.match(/^\/partner\/([^/]+)/);
  if (!match) return null;

  return partnerPages[match[1].toLowerCase()] || {
    code: match[1].toUpperCase(),
    name: match[1],
    headline: 'A private BOOSTR collaboration path for your business.',
    builds: ['Start BOOSTR Build', 'Custom OS', 'Free Audit']
  };
};

const renderPartnerPage = (partner) => {
  const t = copy[language];
  setReferralCode(partner.code);

  document.querySelector('#app').innerHTML = `
    <header class="site-header" data-header>
      <nav class="nav-shell" aria-label="Primary navigation">
        <a class="brand" href="/" aria-label="BOOSTR Labs home">
          <img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" />
        </a>
        <div class="nav-links">
          <a href="/">BOOSTR Labs</a>
          <a href="/#builds">Systems</a>
          <a href="/#contact">Contact</a>
        </div>
        <div class="nav-actions">
          <div class="language-toggle" aria-label="Language">
            <button type="button" data-language="es" class="${language === 'es' ? 'is-active' : ''}">ES</button>
            <button type="button" data-language="en" class="${language === 'en' ? 'is-active' : ''}">EN</button>
          </div>
        </div>
      </nav>
    </header>

    <main id="top">
      <section class="section-shell partner-hero">
        <div class="partner-collab-copy reveal">
          <p class="eyebrow">BOOSTR x ${partner.name}</p>
          <h1>${partner.headline}</h1>
          <p class="hero-subtitle">Use this private collaboration path to request a BOOSTR review, start from a recommended Build or ask for a Custom OS quote.</p>
          <div class="partner-badges">
            <span>Private referral code: ${partner.code}</span>
            <span>20% client discount</span>
            <span>Built by BOOSTR Labs</span>
          </div>
        </div>
        <div class="partner-recommend reveal">
          <span>Recommended Builds</span>
          ${partner.builds.map((item) => `<a href="#partner-form" data-lead-intent="${item}">${item}</a>`).join('')}
        </div>
      </section>

      <section class="section-shell partner-section" id="partner-form">
        <div class="partner-copy reveal">
          <p class="eyebrow">BOOSTR Scan</p>
          <h2>START WITH A PRIVATE REVIEW.</h2>
          <p>Tell us what you are building. BOOSTR will review the project, the current flow and the best first move.</p>
        </div>
        <form class="contact-form partner-form reveal" data-managed-form data-form-kind="partner-page">
          <label><span>${t.form.name}</span><input name="name" autocomplete="name" required /></label>
          <label><span>${t.form.email}</span><input name="email" type="email" autocomplete="email" required /></label>
          <label><span>${t.form.phone}</span><input name="phone" autocomplete="tel" required /></label>
          <label><span>${t.form.business}</span><input name="businessProject" required /></label>
          <label><span>${t.form.link}</span><input name="link" /></label>
          <label>
            <span>${t.form.service}</span>
            <select name="serviceInterested" data-service-select required>${optionsTemplate(serviceOptions, partner.builds[0])}</select>
          </label>
          <label>
            <span>${t.form.budget}</span>
            <select name="budgetRange">${optionsTemplate(budgetOptions)}</select>
          </label>
          <label><span>${t.form.message}</span><textarea name="message" rows="4" required></textarea></label>
          <input type="hidden" name="referralCode" data-referral-input value="${partner.code}" />
          <button class="primary-button form-button" type="submit">Send Partner Request</button>
          <p class="form-status" data-form-status hidden></p>
        </form>
      </section>
    </main>

    <footer class="footer">
      <span>BOOSTR x ${partner.name}</span>
      <span>${t.footer}</span>
    </footer>
  `;

  bindPage();
};

const render = () => {
  const linkRoute = getLinkRoute(window.location);
  if (linkRoute) {
    renderLinkExperience({
      route: linkRoute,
      mount: document.querySelector('#app'),
      submitLead,
      getReferralCode,
      setReferralCode
    });
    return;
  }

  const partner = getPartnerFromPath();
  if (partner) {
    renderPartnerPage(partner);
    return;
  }

  const routePath = window.location.pathname.replace(/\/$/, '') || '/';
  if (routePath === '/quote') {
    renderIntakePage();
    return;
  }
  if (routePath === '/admin') {
    renderDashboardPlaceholder('admin');
    return;
  }
  if (routePath === '/app') {
    renderAppLauncherPage();
    return;
  }
  if (routePath === '/login') {
    renderLoginPage();
    return;
  }

  const t = copy[language];

  document.querySelector('#app').innerHTML = `
    <header class="site-header" data-header>
      <nav class="nav-shell" aria-label="Primary navigation">
        <a class="brand" href="#top" aria-label="BOOSTR Labs home">
          <img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" />
        </a>
        <div class="nav-links">
          ${t.nav.map(([label, anchor]) => `<a href="#${anchor}">${label}</a>`).join('')}
        </div>
        <div class="nav-actions">
          <div class="language-toggle" aria-label="Language">
            <button type="button" data-language="es" class="${language === 'es' ? 'is-active' : ''}">ES</button>
            <button type="button" data-language="en" class="${language === 'en' ? 'is-active' : ''}">EN</button>
          </div>
          <a class="nav-cta" href="/quote">${t.start}</a>
        </div>
      </nav>
    </header>

    <main id="top">
      <section class="hero section-shell">
        <div class="hero-copy reveal">
          <p class="eyebrow">${t.heroEyebrow}</p>
          <h1>${t.heroTitle}</h1>
          <p class="hero-subtitle">${t.heroText}</p>
          <div class="hero-actions">
            <a class="primary-button" href="/quote" data-lead-intent="Start BOOSTR Build">${t.heroPrimary}</a>
            <a class="secondary-button" href="/quote" data-lead-intent="Request Custom OS Quote">${t.heroSecondary}</a>
          </div>
        </div>

        <div class="system-visual reveal" aria-label="BOOSTR operating system diagram">
          <div class="orbit-line line-one"></div>
          <div class="orbit-line line-two"></div>
          <div class="core-symbol">
            <img src="/assets/logos/boostr-logo-nav.png" alt="" aria-hidden="true" />
            <small>OS</small>
          </div>
          <article class="node-card node-leads"><span>01</span><strong>Website</strong></article>
          <article class="node-card node-crm"><span>02</span><strong>CRM</strong></article>
          <article class="node-card node-ai"><span>03</span><strong>Tools</strong></article>
          <article class="node-card node-auto"><span>04</span><strong>Automation</strong></article>
          <article class="node-card node-dash"><span>05</span><strong>Data</strong></article>
        </div>
      </section>

      <section class="section-shell intro-section" id="build">
        <div class="section-copy reveal">
          <p class="eyebrow">BOOSTR Labs</p>
          <h2>${t.introTitle}</h2>
          <p>${t.introText}</p>
        </div>
        <div class="signal-row reveal">
          ${t.introPoints.map((item) => `<span>${item}</span>`).join('')}
        </div>
      </section>

      <section class="section-shell services-section" id="what-we-build">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.servicesEyebrow}</p>
          <h2>${t.servicesTitle}</h2>
          <p>${t.servicesText}</p>
        </div>
        <div class="services-grid">
          ${t.services
            .map(
              ([title, text], index) => `
                <article class="service-card reveal">
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <h3>${title}</h3>
                  <p>${text}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section-shell builds-section" id="builds">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.buildsEyebrow}</p>
          <h2>${t.buildsTitle}</h2>
          <p>${t.buildsText}</p>
        </div>
        <div class="builds-grid">
          ${t.builds
            .map(
              (item) => `
                <article class="build-card reveal">
                  <div class="build-card-top">
                    <span>${item.name}</span>
                    <strong>${item.price}</strong>
                  </div>
                  <p>${item.text}</p>
                  <div class="build-detail">
                    <small>Ideal for</small>
                    <p>${item.ideal}</p>
                  </div>
                  <div class="build-columns">
                    <div>
                      <small>Includes</small>
                      ${listTemplate(item.includes)}
                    </div>
                    <div>
                      <small>Customizable</small>
                      ${listTemplate(item.custom)}
                    </div>
                  </div>
                  ${item.note ? `<p class="micro-note">${item.note}</p>` : ''}
                  <a class="mini-cta" href="/quote" data-lead-intent="${item.name === 'Custom OS' ? 'Request Custom OS Quote' : 'Start BOOSTR Build'}">${item.cta}</a>
                </article>
              `
            )
            .join('')}
        </div>
        <p class="section-note reveal">Basic hosting and standard domain setup included. Premium domains, paid tools, paid plugins or advanced integrations are quoted separately.</p>
      </section>

      <section class="section-shell os-section" id="custom-os">
        <div class="os-copy reveal">
          <p class="eyebrow">${t.osEyebrow}</p>
          <h2>${t.osTitle}</h2>
          <p>${t.osText}</p>
        </div>
        <div class="question-grid reveal">
          ${t.osQuestions.map((item) => `<span>${item}</span>`).join('')}
        </div>
      </section>

      <section class="section-shell process-section" id="process">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.processEyebrow}</p>
          <h2>${t.processTitle}</h2>
        </div>
        <div class="steps reveal">
          ${t.steps
            .map(
              ([number, title, text]) => `
                <article>
                  <span>${number}</span>
                  <strong>${title}</strong>
                  <p>${text}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section-shell industry-section" id="industries">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.industriesEyebrow}</p>
          <h2>${t.industriesTitle}</h2>
        </div>
        <div class="industry-grid">
          ${t.industries
            .map(
              ([title, text]) => `
                <article class="industry-card reveal">
                  <h3>${title}</h3>
                  <p>${text}</p>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section-shell essentials-section" id="essentials">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.essentialsEyebrow}</p>
          <h2>${t.essentialsTitle}</h2>
        </div>
        <div class="essentials-grid">
          ${t.essentials
            .map(
              ([name, price, text, cta]) => `
                <article class="essential-card reveal">
                  <span>${price}</span>
                  <h3>${name}</h3>
                  <p>${text}</p>
                  <a href="#contact" data-lead-intent="${name === 'Landing Page Audit' ? 'Free Audit' : name}">${cta}</a>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section-shell audit-section" id="audit">
        <div class="audit-panel reveal">
          <div>
            <p class="eyebrow">${t.campaignEyebrow}</p>
            <h2>${t.campaignTitle}</h2>
            <p>${t.campaignText}</p>
            <a class="secondary-button" href="#contact" data-lead-intent="Campaign Audit">${t.campaignCta}</a>
          </div>
          <div class="audit-list">
            ${t.campaignItems.map((item) => `<span>${item}</span>`).join('')}
          </div>
        </div>
      </section>

      <section class="section-shell interactive-section" id="scan">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.interactiveEyebrow}</p>
          <h2>${t.interactiveTitle}</h2>
        </div>
        <div class="interactive-grid">
          <article class="tool-card reveal">
            <p class="eyebrow">${t.scanTitle}</p>
            <h3>${t.scanTitle}</h3>
            <p>${t.scanText}</p>
            ${scanTemplate(t)}
          </article>
          <article class="tool-card reveal">
            <p class="eyebrow">${t.matchTitle}</p>
            <h3>${t.matchTitle}</h3>
            <p>${t.matchText}</p>
            ${matchTemplate(t)}
          </article>
        </div>
      </section>

      <section class="section-shell comparison-section" id="not-just-a-website">
        <div class="section-copy reveal">
          <p class="eyebrow">BOOSTR Build</p>
          <h2>${t.comparisonTitle}</h2>
        </div>
        ${comparisonTemplate(t)}
      </section>

      <section class="section-shell pulse-section" id="pulse">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.pulseEyebrow}</p>
          <h2>${t.pulseTitle}</h2>
          <p>${t.pulseText}</p>
        </div>
        ${pulseTemplate(t)}
      </section>

      <section class="section-shell upgrades-section" id="upgrades">
        ${upgradesTemplate(t)}
      </section>

      <section class="section-shell work-section" id="work">
        <div class="section-copy reveal">
          <p class="eyebrow">${t.workEyebrow}</p>
          <h2>${t.workTitle}</h2>
        </div>
        <div class="case-grid">
          ${t.cases
            .map(
              (item) => `
                <article class="case-card reveal">
                  ${mediaTemplate(item.media)}
                  <div class="case-content">
                    <div class="case-meta">
                      <span>${item.tag}</span>
                      <span>${item.status}</span>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.text}</p>
                    ${proofTemplate(item.proof)}
                    <a href="${item.url}" target="_blank" rel="noreferrer">${item.link}</a>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="section-shell partner-section" id="partner">
        <div class="partner-copy reveal">
          <p class="eyebrow">${t.partnerEyebrow}</p>
          <h2>${t.partnerTitle}</h2>
          <p>${t.partnerText}</p>
          <div class="partner-badges">
            ${t.partnerBullets.map((item) => `<span>${item}</span>`).join('')}
          </div>
        </div>
        <form class="contact-form partner-form reveal" data-managed-form data-form-kind="partner">
          <label><span>${t.partnerForm.name}</span><input name="name" autocomplete="name" required /></label>
          <label><span>${t.partnerForm.email}</span><input name="email" autocomplete="email" required /></label>
          <label><span>${t.partnerForm.phone}</span><input name="phone" autocomplete="tel" required /></label>
          <label><span>${t.partnerForm.business}</span><input name="businessProject" required /></label>
          <label><span>${t.partnerForm.link}</span><input name="link" /></label>
          <label>
            <span>${t.partnerForm.service}</span>
            <select name="serviceInterested" required>${optionsTemplate(serviceOptions, 'Apply as Partner')}</select>
          </label>
          <label>
            <span>${t.partnerForm.budget}</span>
            <select name="budgetRange">${optionsTemplate(budgetOptions)}</select>
          </label>
          <label><span>${t.partnerForm.work}</span><input name="work" required /></label>
          <label><span>${t.partnerForm.clients}</span><textarea name="clients" rows="3" required></textarea></label>
          <label><span>${t.partnerForm.interest}</span><input name="interest" required /></label>
          <label><span>${t.partnerForm.message}</span><textarea name="message" rows="3"></textarea></label>
          <input type="hidden" name="referralCode" data-referral-input />
          <button class="primary-button form-button" type="submit">${t.partnerCta}</button>
          <p class="form-status" data-form-status hidden></p>
        </form>
      </section>

      <section class="section-shell contact-section" id="contact">
        <div class="contact-copy reveal">
          <p class="eyebrow">${t.contactEyebrow}</p>
          <h2>${t.contactTitle}</h2>
          <p>${config.contactEmail}</p>
          <p>WhatsApp placeholder</p>
        </div>
        <form class="contact-form reveal" data-managed-form data-form-kind="lead">
          <label><span>${t.form.name}</span><input name="name" autocomplete="name" required /></label>
          <label><span>${t.form.email}</span><input name="email" type="email" autocomplete="email" required /></label>
          <label><span>${t.form.phone}</span><input name="phone" autocomplete="tel" required /></label>
          <label><span>${t.form.business}</span><input name="businessProject" autocomplete="organization" required /></label>
          <label><span>${t.form.link}</span><input name="link" /></label>
          <label>
            <span>${t.form.industry}</span>
            <select name="industry" required>${optionsTemplate(industryOptions)}</select>
          </label>
          <label>
            <span>${t.form.service}</span>
            <select name="serviceInterested" data-service-select required>${optionsTemplate(serviceOptions)}</select>
          </label>
          <label>
            <span>${t.form.budget}</span>
            <select name="budgetRange">${optionsTemplate(budgetOptions)}</select>
          </label>
          <label>
            <span>${t.form.timeline}</span>
            <select name="timeline">${optionsTemplate(timelineOptions)}</select>
          </label>
          <label>
            <span>${t.form.websiteStatus}</span>
            <select name="websiteStatus">${optionsTemplate(websiteStatusOptions)}</select>
          </label>
          <label><span>${t.form.mainGoal}</span><textarea name="mainGoal" rows="3" required></textarea></label>
          <label><span>${t.form.message}</span><textarea name="message" rows="4" required></textarea></label>
          <input type="hidden" name="referralCode" data-referral-input />
          <button class="primary-button form-button" type="submit">${t.form.button}</button>
          <p class="form-status" data-form-status hidden></p>
        </form>
      </section>
    </main>

    <footer class="footer">
      <span>BOOSTR Labs</span>
      <span>${t.footer}</span>
    </footer>
  `;

  bindPage();
};

const bindPage = () => {
  const header = document.querySelector('[data-header]');

  const setHeaderState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      language = button.dataset.language;
      localStorage.setItem('boostr-language', language);
      render();
    });
  });

  document.querySelectorAll('[data-proof-showcase]').forEach((showcase) => {
    const preview = showcase.querySelector('[data-proof-preview]');
    const tabs = showcase.querySelectorAll('[data-proof-tab]');

    tabs.forEach((button) => {
      button.addEventListener('click', () => {
        preview.src = button.dataset.proofSrc;
        preview.alt = button.textContent.trim();
        tabs.forEach((tab) => tab.classList.toggle('is-active', tab === button));
      });
    });
  });

  document.querySelectorAll('[data-referral-input]').forEach((input) => {
    input.value = getReferralCode();
  });

  document.querySelectorAll('[data-lead-intent]').forEach((link) => {
    link.addEventListener('click', () => {
      const intent = link.dataset.leadIntent;
      const serviceSelect = document.querySelector('[data-service-select]');

      if (intent && serviceSelect) {
        serviceSelect.value = intent;
      }
    });
  });

  document.querySelectorAll('[data-match-tool]').forEach((tool) => {
    const industrySelect = tool.querySelector('[data-match-industry]');
    const goalSelect = tool.querySelector('[data-match-goal]');
    const stageSelect = tool.querySelector('[data-match-stage]');
    const result = tool.querySelector('[data-match-result]');

    const updateMatch = () => {
      const industry = industrySelect.value;
      const goal = goalSelect.value;
      const stage = stageSelect.value;
      let key = 'local';

      if (industry === 'Automotive') key = 'automotive';
      if (industry === 'Artist / Creator') key = 'creative';
      if (goal.includes('brand')) key = 'brand';
      if (goal.includes('Campaign')) key = 'campaign';
      if (goal.includes('Internal') || stage.includes('Scaling') || industry === 'Other Business') key = 'custom';

      const match = matchResults[key];
      result.innerHTML = `
        <span>${match.price}</span>
        <h3>${match.offer}</h3>
        <p>${match.why}</p>
        <a href="/quote" data-lead-intent="${match.offer === 'Custom OS' ? 'Request Custom OS Quote' : match.offer}">${match.cta}</a>
      `;

      const cta = result.querySelector('[data-lead-intent]');
      cta.addEventListener('click', () => {
        const serviceSelect = document.querySelector('[data-service-select]');
        if (serviceSelect) {
          serviceSelect.value = cta.dataset.leadIntent;
        }
      });
    };

    [industrySelect, goalSelect, stageSelect].forEach((select) => select.addEventListener('change', updateMatch));
    updateMatch();
  });

  document.querySelectorAll('[data-intake-form]').forEach((form) => {
    const steps = [...form.querySelectorAll('[data-intake-step]')];
    const navButtons = [...form.querySelectorAll('[data-intake-nav]')];
    const previousButton = form.querySelector('[data-intake-prev]');
    const nextButton = form.querySelector('[data-intake-next]');
    const submitButton = form.querySelector('[data-intake-submit]');
    const statusMessage = form.querySelector('[data-form-status]');
    let currentStep = 0;

    const setStep = (index) => {
      currentStep = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === currentStep));
      navButtons.forEach((button, stepIndex) => button.classList.toggle('is-active', stepIndex === currentStep));
      previousButton.hidden = currentStep === 0;
      nextButton.hidden = currentStep === steps.length - 1;
      submitButton.hidden = currentStep !== steps.length - 1;
    };

    const currentStepIsValid = () => {
      const fields = [...steps[currentStep].querySelectorAll('input, select, textarea')];
      const invalid = fields.find((field) => !field.checkValidity());

      if (invalid) {
        invalid.reportValidity();
        return false;
      }

      return true;
    };

    navButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (index > currentStep && !currentStepIsValid()) return;
        setStep(index);
      });
    });

    previousButton.addEventListener('click', () => setStep(currentStep - 1));
    nextButton.addEventListener('click', () => {
      if (!currentStepIsValid()) return;
      setStep(currentStep + 1);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      statusMessage.hidden = true;
      statusMessage.classList.remove('is-error', 'is-success');
      submitButton.disabled = true;

      try {
        await submitIntake(serializeForm(form));
        form.reset();
        setStep(0);
        statusMessage.textContent = 'Intake received. BOOSTR will review this as a lead/project record.';
        statusMessage.classList.add('is-success');
      } catch (error) {
        statusMessage.textContent = 'Something went wrong. Please try again or contact BOOSTR directly.';
        statusMessage.classList.add('is-error');
      } finally {
        statusMessage.hidden = false;
        submitButton.disabled = false;
      }
    });

    setStep(0);
  });

  document.querySelectorAll('[data-managed-form]').forEach((form) => {
    const statusMessage = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    const isPartnerForm = form.dataset.formKind === 'partner';
    const isScanForm = form.dataset.formKind === 'scan';
    const successText = isScanForm ? copy[language].scanSuccess : isPartnerForm ? copy[language].partnerForm.success : copy[language].form.success;
    const errorText = isPartnerForm ? copy[language].partnerForm.error : copy[language].form.error;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      statusMessage.hidden = true;
      statusMessage.classList.remove('is-error', 'is-success');
      submitButton.disabled = true;

      try {
        await submitLead(serializeForm(form));
        form.reset();
        form.querySelectorAll('[data-referral-input]').forEach((input) => {
          input.value = getReferralCode();
        });
        statusMessage.textContent = successText;
        statusMessage.classList.add('is-success');
      } catch (error) {
        statusMessage.textContent = errorText;
        statusMessage.classList.add('is-error');
      } finally {
        statusMessage.hidden = false;
        submitButton.disabled = false;
      }
    });
  });
};

captureReferralFromUrl();
render();
