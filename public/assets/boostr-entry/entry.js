(() => {
  const translations = {
    es: {
      status: 'BOOSTR ONLINE', routeLabel: 'ENCONTRANDO TU RUTA', back: 'Volver', install: 'Instalar',
      footer: 'Custom Operating Systems · Miami', memoryEmpty: 'Dos opciones. Una ruta correcta.',
      installEyebrow: 'BOOSTR PWA', installTitle: 'Instala BOOSTR en tu iPhone.',
      installBody: 'Abre esta página en Safari, toca Compartir y selecciona “Agregar a pantalla de inicio”.',
      installDone: 'Entendido', routeFound: 'Ruta encontrada.', opening: 'Abriendo BOOSTR…',
      sessionKicker: 'SESIÓN ACTIVA', sessionQuestion: '¿Qué quieres hacer?',
      sessionDescription: 'BOOSTR ya reconoció tu cuenta y contexto autorizado.',
      continueTitle: 'Continuar', continueBody: 'Abrir mi acceso autorizado.',
      auditAccountTitle: 'Hacer un Audit', auditAccountBody: 'Evaluar otra operación o proyecto.',
      memoryAccess: 'Acceso', memoryKnowledge: 'Conocimiento', memoryGoal: 'Objetivo',
      nodes: {
        start: {
          kicker: 'BOOSTR ENTRY', question: '¿Ya tienes acceso a BOOSTR?', description: 'Cuenta activa o invitación privada.',
          a: ['Sí', 'Tengo una cuenta o invitación.'], b: ['No', 'Todavía no pertenezco a BOOSTR.']
        },
        accessType: {
          kicker: 'ACCESO', question: '¿Qué tipo de acceso tienes?', description: 'Esto define la puerta correcta.',
          a: ['Una cuenta activa', 'Ya tengo usuario y clave.'], b: ['Una invitación', 'Me invitaron a un workspace o proyecto.']
        },
        auditStarted: {
          kicker: 'AUDIT', question: '¿Ya comenzaste un BOOSTR Audit?', description: 'Puedes continuar exactamente por esa ruta.',
          a: ['Sí, continuarlo', 'Ya empecé el diagnóstico.'], b: ['No, es mi primera vez', 'Todavía no he comenzado.']
        },
        knowledge: {
          kicker: 'CONOCIMIENTO', question: '¿Ya sabes qué hace BOOSTR?', description: 'No necesitas conocer términos técnicos.',
          a: ['Sí, ya lo conozco', 'Sé qué tipo de ayuda estoy buscando.'], b: ['No, guíame', 'Quiero entenderlo paso a paso.']
        },
        knownIntent: {
          kicker: 'OBJETIVO', question: '¿A dónde quieres ir?', description: 'Elige lo que quieres hacer ahora.',
          a: ['Evaluar mi operación', 'Comenzar el BOOSTR Audit.'], b: ['Ver lo que construyen', 'Explorar sistemas y trabajos reales.']
        },
        operation: {
          kicker: 'CONTEXTO', question: '¿Tienes algo activo hoy?', description: 'Negocio, marca, carrera, equipo o proyecto.',
          a: ['Sí, está activo', 'Ya opero, vendo, creo o atiendo clientes.'], b: ['Todavía no', 'Estoy explorando o comenzando.']
        },
        clarity: {
          kicker: 'CLARIDAD', question: '¿Sabes qué necesitas mejorar?', description: 'BOOSTR puede validar tu idea o descubrir el problema.',
          a: ['Sí, lo tengo claro', 'Quiero evaluar una necesidad específica.'], b: ['No, quiero descubrirlo', 'Necesito que BOOSTR detecte qué falta.']
        },
        explorePreference: {
          kicker: 'DESCUBRIMIENTO', question: '¿Qué quieres ver primero?', description: 'Te llevamos al contenido correcto, sin obligarte a hacer un Audit.',
          a: ['Cómo funciona BOOSTR', 'Entender el ecosistema y la lógica.'], b: ['Ejemplos reales', 'Ver proyectos, sistemas y resultados.']
        }
      }
    },
    en: {
      status: 'BOOSTR ONLINE', routeLabel: 'FINDING YOUR ROUTE', back: 'Back', install: 'Install',
      footer: 'Custom Operating Systems · Miami', memoryEmpty: 'Two options. One correct route.',
      installEyebrow: 'BOOSTR PWA', installTitle: 'Install BOOSTR on your iPhone.',
      installBody: 'Open this page in Safari, tap Share, then choose “Add to Home Screen”.',
      installDone: 'Got it', routeFound: 'Route found.', opening: 'Opening BOOSTR…',
      sessionKicker: 'ACTIVE SESSION', sessionQuestion: 'What do you want to do?',
      sessionDescription: 'BOOSTR already recognized your account and authorized context.',
      continueTitle: 'Continue', continueBody: 'Open my authorized access.',
      auditAccountTitle: 'Run an Audit', auditAccountBody: 'Evaluate another operation or project.',
      memoryAccess: 'Access', memoryKnowledge: 'Knowledge', memoryGoal: 'Goal',
      nodes: {
        start: {
          kicker: 'BOOSTR ENTRY', question: 'Do you already have BOOSTR access?', description: 'Active account or private invitation.',
          a: ['Yes', 'I have an account or invitation.'], b: ['No', 'I do not belong to BOOSTR yet.']
        },
        accessType: {
          kicker: 'ACCESS', question: 'What kind of access do you have?', description: 'This defines the correct door.',
          a: ['An active account', 'I already have a username and password.'], b: ['An invitation', 'I was invited to a workspace or project.']
        },
        auditStarted: {
          kicker: 'AUDIT', question: 'Have you already started a BOOSTR Audit?', description: 'You can continue through that exact route.',
          a: ['Yes, continue it', 'I already started the diagnosis.'], b: ['No, first time', 'I have not started yet.']
        },
        knowledge: {
          kicker: 'KNOWLEDGE', question: 'Do you already know what BOOSTR does?', description: 'You do not need to know technical terms.',
          a: ['Yes, I know it', 'I know the kind of help I am looking for.'], b: ['No, guide me', 'I want to understand it step by step.']
        },
        knownIntent: {
          kicker: 'GOAL', question: 'Where do you want to go?', description: 'Choose what you want to do now.',
          a: ['Evaluate my operation', 'Start the BOOSTR Audit.'], b: ['See what BOOSTR builds', 'Explore real systems and work.']
        },
        operation: {
          kicker: 'CONTEXT', question: 'Do you have something active today?', description: 'Business, brand, career, team or project.',
          a: ['Yes, it is active', 'I already operate, sell, create or serve clients.'], b: ['Not yet', 'I am exploring or just starting.']
        },
        clarity: {
          kicker: 'CLARITY', question: 'Do you know what needs improvement?', description: 'BOOSTR can validate your idea or discover the problem.',
          a: ['Yes, it is clear', 'I want to evaluate a specific need.'], b: ['No, help me discover it', 'I need BOOSTR to detect what is missing.']
        },
        explorePreference: {
          kicker: 'DISCOVERY', question: 'What do you want to see first?', description: 'We will take you to the right content without forcing an Audit.',
          a: ['How BOOSTR works', 'Understand the ecosystem and logic.'], b: ['Real examples', 'See projects, systems and results.']
        }
      }
    }
  };

  const nodeMap = {
    start: {
      depth: 1,
      a: { next: 'accessType', set: { access: 'yes' } },
      b: { next: 'auditStarted', set: { access: 'no' } }
    },
    accessType: {
      depth: 2,
      a: { route: '/login/?source=official-entry', set: { accessType: 'account', intent: 'login' } },
      b: { route: '/accept-invite/?source=official-entry', set: { accessType: 'invitation', intent: 'invite' } }
    },
    auditStarted: {
      depth: 2,
      a: { route: '/audit/?source=official-entry&mode=resume', set: { auditStarted: true, intent: 'audit_resume' } },
      b: { next: 'knowledge', set: { auditStarted: false } }
    },
    knowledge: {
      depth: 3,
      a: { next: 'knownIntent', set: { knowledge: 'familiar' } },
      b: { next: 'operation', set: { knowledge: 'new' } }
    },
    knownIntent: {
      depth: 4,
      a: { route: '/audit/?source=official-entry&knowledge=familiar', set: { intent: 'audit' } },
      b: { route: '/portfolio/?source=official-entry&knowledge=familiar', set: { intent: 'portfolio' } }
    },
    operation: {
      depth: 4,
      a: { next: 'clarity', set: { operation: 'active' } },
      b: { next: 'explorePreference', set: { operation: 'exploring' } }
    },
    clarity: {
      depth: 5,
      a: { route: '/audit/?source=official-entry&knowledge=new&operation=active&clarity=clear', set: { clarity: 'clear', intent: 'audit' } },
      b: { route: '/audit/?source=official-entry&knowledge=new&operation=active&clarity=unknown', set: { clarity: 'unknown', intent: 'audit' } }
    },
    explorePreference: {
      depth: 5,
      a: { route: '/ecosystem/?source=official-entry&knowledge=new', set: { intent: 'ecosystem' } },
      b: { route: '/portfolio/?source=official-entry&knowledge=new', set: { intent: 'portfolio' } }
    }
  };

  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const launchedAsPwa = isStandalone || params.get('source') === 'pwa';
  const stage = document.getElementById('questionStage');
  const questionKicker = document.getElementById('questionKicker');
  const question = document.getElementById('entryQuestion');
  const description = document.getElementById('entryDescription');
  const choiceA = document.getElementById('choiceA');
  const choiceB = document.getElementById('choiceB');
  const choiceATitle = document.getElementById('choiceATitle');
  const choiceABody = document.getElementById('choiceABody');
  const choiceBTitle = document.getElementById('choiceBTitle');
  const choiceBBody = document.getElementById('choiceBBody');
  const backButton = document.getElementById('backButton');
  const stepCounter = document.getElementById('stepCounter');
  const progressBar = document.getElementById('progressBar');
  const routeMemory = document.getElementById('routeMemory');
  const routeTransition = document.getElementById('routeTransition');
  const routeTransitionTitle = document.getElementById('routeTransitionTitle');
  const routeTransitionBody = document.getElementById('routeTransitionBody');
  const installButton = document.getElementById('installButton');
  const installDialog = document.getElementById('installDialog');

  let currentLanguage = resolveLanguage();
  let currentNode = 'start';
  let history = [];
  let profile = {};
  let activeSession = null;
  let deferredInstallPrompt = null;

  function resolveLanguage() {
    const saved = localStorage.getItem('boostr_language');
    if (saved === 'es' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  function copy() { return translations[currentLanguage] || translations.es; }

  function applyLanguage(language) {
    if (!translations[language]) return;
    currentLanguage = language;
    localStorage.setItem('boostr_language', language);
    root.lang = language;
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = copy()[element.dataset.i18n];
      if (value) element.textContent = value;
    });
    document.title = language === 'es' ? 'BOOSTR Labs — Encuentra tu entrada' : 'BOOSTR Labs — Find your entry';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = language === 'es'
      ? 'Responde opciones A o B para encontrar la entrada correcta a BOOSTR Labs.'
      : 'Answer A or B to find the correct entry into BOOSTR Labs.';
    render();
  }

  function setText(target, value) { if (target) target.textContent = value || ''; }

  function animateStage(update) {
    stage.classList.add('leaving');
    window.setTimeout(() => {
      update();
      stage.classList.remove('leaving');
      stage.classList.add('entering');
      requestAnimationFrame(() => stage.classList.remove('entering'));
    }, 140);
  }

  function sessionContext(session) {
    return [session?.active_workspace?.name, session?.role].filter(Boolean).join(' · ');
  }

  function safeRoute(value) {
    if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/app/';
    try {
      const parsed = new URL(value, window.location.origin);
      return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/app/';
    } catch {
      return '/app/';
    }
  }

  function renderMemory() {
    const labels = [];
    if (profile.access) labels.push(`${copy().memoryAccess}: ${profile.access === 'yes' ? '✓' : '—'}`);
    if (profile.knowledge) labels.push(`${copy().memoryKnowledge}: ${profile.knowledge === 'familiar' ? (currentLanguage === 'es' ? 'conoce' : 'familiar') : (currentLanguage === 'es' ? 'nuevo' : 'new')}`);
    if (profile.intent) labels.push(`${copy().memoryGoal}: ${profile.intent.replace('_', ' ')}`);
    routeMemory.textContent = labels.length ? labels.join(' · ') : copy().memoryEmpty;
  }

  function renderGuestNode() {
    const nodeCopy = copy().nodes[currentNode];
    const config = nodeMap[currentNode];
    root.dataset.session = 'guest';
    setText(questionKicker, nodeCopy.kicker);
    setText(question, nodeCopy.question);
    setText(description, nodeCopy.description);
    setText(choiceATitle, nodeCopy.a[0]);
    setText(choiceABody, nodeCopy.a[1]);
    setText(choiceBTitle, nodeCopy.b[0]);
    setText(choiceBBody, nodeCopy.b[1]);
    stepCounter.textContent = String(config.depth).padStart(2, '0');
    progressBar.style.width = `${Math.min(100, 18 + (config.depth - 1) * 20)}%`;
    backButton.hidden = history.length === 0;
    renderMemory();
  }

  function renderSessionNode() {
    const dashboard = safeRoute(window.BOOSTR_DASHBOARD || activeSession?.redirect || '/app/');
    root.dataset.session = 'active';
    setText(questionKicker, copy().sessionKicker);
    setText(question, copy().sessionQuestion);
    setText(description, sessionContext(activeSession) || copy().sessionDescription);
    setText(choiceATitle, copy().continueTitle);
    setText(choiceABody, copy().continueBody);
    setText(choiceBTitle, copy().auditAccountTitle);
    setText(choiceBBody, copy().auditAccountBody);
    stepCounter.textContent = '✓';
    progressBar.style.width = '100%';
    backButton.hidden = true;
    routeMemory.textContent = sessionContext(activeSession) || copy().sessionDescription;
    choiceA.dataset.route = dashboard;
    choiceB.dataset.route = '/audit/?source=official-entry&account=active';
  }

  function render() {
    if (activeSession) renderSessionNode();
    else renderGuestNode();
  }

  function persistProfile(route) {
    const payload = { ...profile, route, source: 'official-entry', completedAt: new Date().toISOString(), version: 1 };
    localStorage.setItem('boostr_entry_profile', JSON.stringify(payload));
    sessionStorage.setItem('boostr_entry_profile', JSON.stringify(payload));
  }

  function openRoute(route) {
    const target = safeRoute(route);
    persistProfile(target);
    routeTransitionTitle.textContent = copy().routeFound;
    routeTransitionBody.textContent = copy().opening;
    routeTransition.hidden = false;
    window.setTimeout(() => window.location.assign(target), 320);
  }

  function choose(side) {
    if (activeSession) {
      openRoute(side === 'a' ? choiceA.dataset.route : choiceB.dataset.route);
      return;
    }
    const action = nodeMap[currentNode]?.[side];
    if (!action) return;
    history.push({ node: currentNode, profile: { ...profile } });
    profile = { ...profile, ...(action.set || {}) };
    if (action.route) {
      openRoute(action.route);
      return;
    }
    animateStage(() => {
      currentNode = action.next;
      render();
    });
  }

  choiceA.addEventListener('click', () => choose('a'));
  choiceB.addEventListener('click', () => choose('b'));
  backButton.addEventListener('click', () => {
    const previous = history.pop();
    if (!previous) return;
    animateStage(() => {
      currentNode = previous.node;
      profile = previous.profile;
      render();
    });
  });

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.language));
  });

  function configureInstall() {
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isStandalone && (isiOS || deferredInstallPrompt)) installButton.hidden = false;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    configureInstall();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  installButton.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }
    installDialog.showModal();
  });

  document.getElementById('installClose').addEventListener('click', () => installDialog.close());
  document.getElementById('installDone').addEventListener('click', () => installDialog.close());
  installDialog.addEventListener('click', (event) => { if (event.target === installDialog) installDialog.close(); });

  document.addEventListener('boostrSessionReady', (event) => {
    activeSession = event.detail;
    render();
    if (launchedAsPwa && params.get('stay') !== '1') {
      const dashboard = safeRoute(window.BOOSTR_DASHBOARD || activeSession?.redirect || '/app/');
      routeTransition.hidden = false;
      window.setTimeout(() => window.location.replace(dashboard), 320);
    }
  });
  document.addEventListener('boostrSessionMissing', () => {
    activeSession = null;
    render();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  root.classList.toggle('boostr-standalone', isStandalone);
  applyLanguage(currentLanguage);
  configureInstall();
})();
