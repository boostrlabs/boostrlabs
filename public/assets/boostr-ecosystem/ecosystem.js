(() => {
  const translations = {
    es: {
      accessLink: 'Ya tengo acceso', openWorkspace: 'Abrir mi workspace', sessionActive: 'Sesión activa', languageLabel: 'Idioma',
      back: 'Volver', restart: 'Empezar de nuevo', resultLabel: 'TU MAPA BOOSTR', auditAction: 'Evaluar mi operación', portfolioAction: 'Ver sistemas reales',
      mapLabel: 'MAPA VIVO', mapListening: 'ESCUCHANDO', mapReady: 'CONECTADO', principle: 'Primero BOOSTR entiende. Después BOOSTR configura.',
      moduleIdentity: 'Identidad', moduleClients: 'Clientes', modulePayments: 'Pagos', moduleOperations: 'Operación', moduleData: 'Datos', moduleCommunication: 'Comunicación',
      detailLabel: 'SELECCIONA UN PUNTO', detailIdle: 'BOOSTR te mostrará cómo se relaciona cada parte de la operación.',
      questions: {
        intent: { kicker: 'ECOSISTEMA BOOSTR', question: '¿Qué quieres entender primero?', description: 'Dos decisiones son suficientes para mostrarte la parte correcta de BOOSTR.', a: ['Qué hace BOOSTR', 'Entender la función del sistema.'], b: ['Cómo conecta una operación', 'Ver la lógica funcionando.'] },
        situation: { kicker: 'TU OPERACIÓN', question: '¿Cómo trabajas hoy?', description: 'No importa qué herramientas usas. Importa cómo se conectan.', a: ['Uso herramientas separadas', 'Clientes, pagos y datos viven en lugares distintos.'], b: ['Ya tengo un sistema', 'Quiero mejorar, integrar o ampliar lo que existe.'] },
        focus: { kicker: 'PRIMERA CONEXIÓN', question: '¿Qué quieres conectar primero?', description: 'BOOSTR puede comenzar por la parte que hoy genera más fricción.', a: ['Ventas, clientes y pagos', 'Desde la oportunidad hasta el cobro.'], b: ['Equipo, operación y datos', 'Desde el trabajo diario hasta la decisión.'] }
      },
      results: {
        scattered: { title: 'BOOSTR conecta los puntos.', body: 'Una sola capa organiza clientes, pagos, operación, datos y comunicación sin obligarte a reconstruir todo.', modules: ['identity','clients','payments','operations','data','communication'] },
        existing: { title: 'BOOSTR amplía lo que ya funciona.', body: 'El sistema no borra tus herramientas útiles. Las conecta, les añade contexto y crea una operación más clara.', modules: ['identity','operations','data','communication'] },
        revenue: { title: 'De la oportunidad al cobro.', body: 'BOOSTR conecta identidad, clientes, seguimiento, pagos y datos para que cada oportunidad conserve su contexto.', modules: ['identity','clients','payments','data','communication'] },
        operations: { title: 'De la actividad a la decisión.', body: 'BOOSTR organiza permisos, procesos, comunicación y datos para que el equipo sepa qué hacer y por qué.', modules: ['identity','operations','data','communication'] }
      },
      details: {
        identity: ['IDENTIDAD', 'Una cuenta puede operar con distintos roles, workspaces y permisos sin mezclar contextos.'],
        clients: ['CLIENTES', 'Cada lead, cliente o fan conserva origen, historial, estado y próxima acción.'],
        payments: ['PAGOS', 'Cobros, órdenes, enlaces y comprobantes se conectan con la persona y la operación correcta.'],
        operations: ['OPERACIÓN', 'Tareas, inventario, servicios, equipo y procesos viven en un flujo visible.'],
        data: ['DATOS', 'BOOSTR convierte actividad en señales útiles para decidir qué mantener, corregir o activar.'],
        communication: ['COMUNICACIÓN', 'Email, WhatsApp y seguimiento utilizan el contexto real de cada interacción.']
      }
    },
    en: {
      accessLink: 'I already have access', openWorkspace: 'Open my workspace', sessionActive: 'Active session', languageLabel: 'Language',
      back: 'Back', restart: 'Start again', resultLabel: 'YOUR BOOSTR MAP', auditAction: 'Evaluate my operation', portfolioAction: 'View real systems',
      mapLabel: 'LIVE MAP', mapListening: 'LISTENING', mapReady: 'CONNECTED', principle: 'First BOOSTR understands. Then BOOSTR configures.',
      moduleIdentity: 'Identity', moduleClients: 'Clients', modulePayments: 'Payments', moduleOperations: 'Operations', moduleData: 'Data', moduleCommunication: 'Communication',
      detailLabel: 'SELECT A POINT', detailIdle: 'BOOSTR will show how each part of the operation relates to the others.',
      questions: {
        intent: { kicker: 'BOOSTR ECOSYSTEM', question: 'What do you want to understand first?', description: 'Two decisions are enough to show you the right part of BOOSTR.', a: ['What BOOSTR does', 'Understand the system function.'], b: ['How it connects an operation', 'See the logic working.'] },
        situation: { kicker: 'YOUR OPERATION', question: 'How do you work today?', description: 'The tools matter less than how they connect.', a: ['I use separate tools', 'Clients, payments and data live in different places.'], b: ['I already have a system', 'I want to improve, integrate or expand what exists.'] },
        focus: { kicker: 'FIRST CONNECTION', question: 'What do you want to connect first?', description: 'BOOSTR can start where friction is highest today.', a: ['Sales, clients and payments', 'From opportunity to payment.'], b: ['Team, operations and data', 'From daily work to decisions.'] }
      },
      results: {
        scattered: { title: 'BOOSTR connects the dots.', body: 'One layer organizes clients, payments, operations, data and communication without forcing you to rebuild everything.', modules: ['identity','clients','payments','operations','data','communication'] },
        existing: { title: 'BOOSTR expands what already works.', body: 'The system does not erase useful tools. It connects them, adds context and creates a clearer operation.', modules: ['identity','operations','data','communication'] },
        revenue: { title: 'From opportunity to payment.', body: 'BOOSTR connects identity, clients, follow-up, payments and data so every opportunity keeps its context.', modules: ['identity','clients','payments','data','communication'] },
        operations: { title: 'From activity to decision.', body: 'BOOSTR organizes permissions, processes, communication and data so the team knows what to do and why.', modules: ['identity','operations','data','communication'] }
      },
      details: {
        identity: ['IDENTITY', 'One account can operate across roles, workspaces and permissions without mixing contexts.'],
        clients: ['CLIENTS', 'Every lead, client or fan keeps its source, history, status and next action.'],
        payments: ['PAYMENTS', 'Payments, orders, links and receipts connect to the correct person and operation.'],
        operations: ['OPERATIONS', 'Tasks, inventory, services, teams and processes live in a visible flow.'],
        data: ['DATA', 'BOOSTR turns activity into useful signals for deciding what to keep, fix or activate.'],
        communication: ['COMMUNICATION', 'Email, WhatsApp and follow-up use the real context of each interaction.']
      }
    }
  };

  const flows = {
    intent: {
      depth: 1,
      a: { next: 'situation', set: { path: 'understand' } },
      b: { next: 'focus', set: { path: 'connect' } }
    },
    situation: {
      depth: 2,
      a: { result: 'scattered', set: { situation: 'scattered' } },
      b: { result: 'existing', set: { situation: 'existing' } }
    },
    focus: {
      depth: 2,
      a: { result: 'revenue', set: { focus: 'revenue' } },
      b: { result: 'operations', set: { focus: 'operations' } }
    }
  };

  const root = document.documentElement;
  const guideStage = document.getElementById('guideStage');
  const resultStage = document.getElementById('resultStage');
  const ecoKicker = document.getElementById('ecoKicker');
  const ecoQuestion = document.getElementById('ecoQuestion');
  const ecoDescription = document.getElementById('ecoDescription');
  const choiceA = document.getElementById('ecoChoiceA');
  const choiceB = document.getElementById('ecoChoiceB');
  const choiceATitle = document.getElementById('ecoChoiceATitle');
  const choiceABody = document.getElementById('ecoChoiceABody');
  const choiceBTitle = document.getElementById('ecoChoiceBTitle');
  const choiceBBody = document.getElementById('ecoChoiceBBody');
  const stepCounter = document.getElementById('stepCounter');
  const progressBar = document.getElementById('progressBar');
  const backButton = document.getElementById('backButton');
  const resetButton = document.getElementById('resetButton');
  const resultTitle = document.getElementById('resultTitle');
  const resultBody = document.getElementById('resultBody');
  const systemMap = document.getElementById('systemMap');
  const mapStatus = document.getElementById('mapStatus');
  const moduleDetailLabel = document.getElementById('moduleDetailLabel');
  const moduleDetailText = document.getElementById('moduleDetailText');
  const auditLink = document.getElementById('auditLink');
  const accessLink = document.getElementById('accessLink');
  const sessionChip = document.getElementById('sessionChip');

  let language = resolveLanguage();
  let currentNode = 'intent';
  let currentResult = null;
  let profile = {};
  let history = [];
  let selectedModule = null;

  function resolveLanguage() {
    const saved = localStorage.getItem('boostr_language');
    if (saved === 'es' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  function copy() { return translations[language] || translations.es; }

  function safeRoute(value) {
    if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/app/';
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/app/';
    } catch {
      return '/app/';
    }
  }

  function setText(element, value) {
    if (element) element.textContent = value || '';
  }

  function applyLanguage(nextLanguage) {
    if (!translations[nextLanguage]) return;
    language = nextLanguage;
    localStorage.setItem('boostr_language', language);
    root.lang = language;
    document.querySelectorAll('[data-language]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = copy()[element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const value = copy()[element.dataset.i18nAriaLabel];
      if (value) element.setAttribute('aria-label', value);
    });
    document.title = language === 'es' ? 'BOOSTR Ecosystem — Entiende cómo funciona' : 'BOOSTR Ecosystem — Understand how it works';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = language === 'es'
      ? 'Explora cómo BOOSTR conecta clientes, pagos, operaciones, datos y herramientas en una sola experiencia.'
      : 'Explore how BOOSTR connects clients, payments, operations, data and tools in one experience.';
    render();
  }

  function animate(update) {
    const stage = currentResult ? resultStage : guideStage;
    stage.classList.add('leaving');
    window.setTimeout(() => {
      update();
      stage.classList.remove('leaving');
    }, 150);
  }

  function renderQuestion() {
    root.dataset.ecoView = 'guide';
    guideStage.hidden = false;
    resultStage.hidden = true;
    resetButton.hidden = true;
    const question = copy().questions[currentNode];
    const depth = flows[currentNode].depth;
    setText(ecoKicker, question.kicker);
    setText(ecoQuestion, question.question);
    setText(ecoDescription, question.description);
    setText(choiceATitle, question.a[0]);
    setText(choiceABody, question.a[1]);
    setText(choiceBTitle, question.b[0]);
    setText(choiceBBody, question.b[1]);
    stepCounter.textContent = `0${depth} / 02`;
    progressBar.style.width = depth === 1 ? '50%' : '100%';
    backButton.hidden = history.length === 0;
    mapStatus.textContent = copy().mapListening;
    renderMap([]);
    renderDetail(null);
  }

  function renderResult() {
    root.dataset.ecoView = 'result';
    guideStage.hidden = true;
    resultStage.hidden = false;
    resetButton.hidden = false;
    backButton.hidden = false;
    const result = copy().results[currentResult];
    setText(resultTitle, result.title);
    setText(resultBody, result.body);
    stepCounter.textContent = '02 / 02';
    progressBar.style.width = '100%';
    mapStatus.textContent = copy().mapReady;
    renderMap(result.modules);
    selectedModule = result.modules[0];
    renderDetail(selectedModule);
    const context = encodeURIComponent(currentResult);
    auditLink.href = `/audit/?source=ecosystem&context=${context}`;
    localStorage.setItem('boostr_ecosystem_profile', JSON.stringify({ ...profile, result: currentResult, updated_at: new Date().toISOString() }));
  }

  function render() {
    if (currentResult) renderResult();
    else renderQuestion();
  }

  function renderMap(activeModules) {
    const active = new Set(activeModules);
    systemMap.dataset.mapState = active.size ? 'connected' : 'idle';
    document.querySelectorAll('.map-node').forEach((node) => {
      const isActive = active.has(node.dataset.module);
      node.classList.toggle('active', isActive);
      node.classList.toggle('selected', isActive && node.dataset.module === selectedModule);
      node.disabled = !isActive;
      node.setAttribute('aria-disabled', String(!isActive));
    });
    document.querySelectorAll('.map-lines line').forEach((line) => line.classList.toggle('active', active.has(line.dataset.link)));
  }

  function renderDetail(module) {
    selectedModule = module;
    document.querySelectorAll('.map-node').forEach((node) => node.classList.toggle('selected', node.dataset.module === module));
    if (!module) {
      setText(moduleDetailLabel, copy().detailLabel);
      setText(moduleDetailText, copy().detailIdle);
      return;
    }
    const detail = copy().details[module];
    setText(moduleDetailLabel, detail[0]);
    setText(moduleDetailText, detail[1]);
  }

  function choose(key) {
    if (currentResult || !flows[currentNode]?.[key]) return;
    const action = flows[currentNode][key];
    history.push({ node: currentNode, profile: { ...profile } });
    profile = { ...profile, ...action.set };
    animate(() => {
      if (action.next) {
        currentNode = action.next;
        currentResult = null;
      } else {
        currentResult = action.result;
      }
      render();
    });
  }

  function goBack() {
    const previous = history.pop();
    if (!previous) return;
    currentNode = previous.node;
    profile = previous.profile;
    currentResult = null;
    selectedModule = null;
    render();
  }

  function reset() {
    currentNode = 'intent';
    currentResult = null;
    profile = {};
    history = [];
    selectedModule = null;
    localStorage.removeItem('boostr_ecosystem_profile');
    render();
  }

  choiceA.addEventListener('click', () => choose('a'));
  choiceB.addEventListener('click', () => choose('b'));
  backButton.addEventListener('click', goBack);
  resetButton.addEventListener('click', reset);
  document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
  document.querySelectorAll('.map-node').forEach((node) => node.addEventListener('click', () => {
    if (!node.classList.contains('active')) return;
    renderDetail(node.dataset.module);
  }));

  document.addEventListener('boostrSessionReady', (event) => {
    root.dataset.session = 'active';
    accessLink.href = safeRoute(window.BOOSTR_DASHBOARD || event.detail?.redirect);
    accessLink.textContent = copy().openWorkspace;
    sessionChip.hidden = false;
  });
  document.addEventListener('boostrSessionMissing', () => { root.dataset.session = 'guest'; });

  applyLanguage(language);
})();
