(() => {
  const translations = {
    es: {
      status: 'BOOSTR ONLINE',
      eyebrow: 'BOOSTR LABS',
      title: 'Entra a BOOSTR.',
      lead: 'Inicia sesión si ya tienes acceso. Si todavía no sabes qué necesitas, comienza el BOOSTR Audit.',
      loginTitle: 'Iniciar sesión',
      loginBody: 'Para cuentas, equipos, partners y clientes con acceso.',
      auditTitle: 'Comenzar BOOSTR Audit',
      auditBody: 'Para descubrir qué necesita tu operación.',
      invite: 'Recibí una invitación',
      resume: 'Continuar Audit',
      explore: 'Explorar BOOSTR',
      sessionDetected: 'Sesión activa detectada.',
      sessionReady: 'Tu acceso autorizado está listo.',
      mapLabel: 'MAPA DE ENTRADA',
      nodeAccount: 'CUENTA',
      nodeWorkspace: 'AUTORIZADO',
      nodeDiagnosis: 'OPERACIÓN',
      identityLabel: 'IDENTIDAD',
      identityValue: 'Una cuenta',
      pathsLabel: 'RUTAS',
      pathsValue: 'Acceso o Audit',
      resultLabel: 'RESULTADO',
      resultValue: 'Contexto correcto',
      principle: 'Quien ya pertenece a BOOSTR inicia sesión. Quien necesita orientación comienza el Audit.',
      install: 'Instalar BOOSTR',
      footer: 'Custom Operating Systems · Miami',
      installEyebrow: 'BOOSTR PWA',
      installTitle: 'Instala BOOSTR en tu iPhone.',
      installBody: 'Abre esta página en Safari, toca Compartir y selecciona “Agregar a pantalla de inicio”.',
      installDone: 'Entendido',
      opening: 'Abriendo tu acceso autorizado…',
      activeTitle: 'Continúa en BOOSTR.',
      activeLead: 'Tu sesión está activa. Entra directamente al contexto autorizado de tu cuenta.',
      activeChoice: 'Continuar',
      activeFallback: 'Acceso autorizado',
      activeNote: 'Sesión activa',
      installNative: 'Instalar app'
    },
    en: {
      status: 'BOOSTR ONLINE',
      eyebrow: 'BOOSTR LABS',
      title: 'Enter BOOSTR.',
      lead: 'Sign in if you already have access. If you do not know what you need yet, start the BOOSTR Audit.',
      loginTitle: 'Sign in',
      loginBody: 'For accounts, teams, partners and clients with access.',
      auditTitle: 'Start BOOSTR Audit',
      auditBody: 'To discover what your operation needs.',
      invite: 'I received an invitation',
      resume: 'Continue Audit',
      explore: 'Explore BOOSTR',
      sessionDetected: 'Active session detected.',
      sessionReady: 'Your authorized access is ready.',
      mapLabel: 'ENTRY MAP',
      nodeAccount: 'ACCOUNT',
      nodeWorkspace: 'AUTHORIZED',
      nodeDiagnosis: 'OPERATION',
      identityLabel: 'IDENTITY',
      identityValue: 'One account',
      pathsLabel: 'PATHS',
      pathsValue: 'Access or Audit',
      resultLabel: 'RESULT',
      resultValue: 'Correct context',
      principle: 'People who already belong to BOOSTR sign in. People who need direction begin with the Audit.',
      install: 'Install BOOSTR',
      footer: 'Custom Operating Systems · Miami',
      installEyebrow: 'BOOSTR PWA',
      installTitle: 'Install BOOSTR on your iPhone.',
      installBody: 'Open this page in Safari, tap Share, then choose “Add to Home Screen”.',
      installDone: 'Got it',
      opening: 'Opening your authorized access…',
      activeTitle: 'Continue in BOOSTR.',
      activeLead: 'Your session is active. Go directly to the authorized context for your account.',
      activeChoice: 'Continue',
      activeFallback: 'Authorized access',
      activeNote: 'Active session',
      installNative: 'Install app'
    }
  };

  const root = document.documentElement;
  const loginChoice = document.getElementById('loginChoice');
  const loginTitle = loginChoice?.querySelector('.choice-content strong');
  const loginBody = loginChoice?.querySelector('.choice-content small');
  const title = document.getElementById('entryTitle');
  const lead = document.getElementById('entryLead');
  const sessionNote = document.getElementById('sessionNote');
  const sessionNoteTitle = document.getElementById('sessionNoteTitle');
  const sessionNoteBody = document.getElementById('sessionNoteBody');
  const pwaTransition = document.getElementById('pwaTransition');
  const installButton = document.getElementById('installButton');
  const installDialog = document.getElementById('installDialog');
  const params = new URLSearchParams(window.location.search);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const launchedAsPwa = isStandalone || params.get('source') === 'pwa';
  let currentLanguage = resolveLanguage();
  let activeSession = null;
  let deferredInstallPrompt = null;

  function resolveLanguage() {
    const saved = localStorage.getItem('boostr_language');
    if (saved === 'es' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  function dictionary() {
    return translations[currentLanguage] || translations.es;
  }

  function applyLanguage(language) {
    if (!translations[language]) return;
    currentLanguage = language;
    localStorage.setItem('boostr_language', language);
    root.lang = language;

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      const value = translations[language][key];
      if (value) element.textContent = value;
    });

    document.querySelectorAll('[data-language]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });

    document.title = language === 'es'
      ? 'BOOSTR Labs — Acceso o Audit'
      : 'BOOSTR Labs — Access or Audit';

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = language === 'es'
        ? 'Inicia sesión en BOOSTR Labs o comienza el BOOSTR Audit para descubrir qué necesita tu operación.'
        : 'Sign in to BOOSTR Labs or start the BOOSTR Audit to discover what your operation needs.';
    }

    if (activeSession) paintActiveSession(activeSession);
  }

  function safeDashboard(value) {
    if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
      return '/app/';
    }
    try {
      const parsed = new URL(value, window.location.origin);
      if (parsed.origin !== window.location.origin) return '/app/';
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return '/app/';
    }
  }

  function sessionName(session) {
    return session?.user?.name || session?.username || session?.user?.email || '';
  }

  function sessionContext(session) {
    return [session?.active_workspace?.name, session?.role]
      .filter(Boolean)
      .join(' · ');
  }

  function paintActiveSession(session) {
    activeSession = session;
    root.dataset.session = 'active';
    const copy = dictionary();
    const dashboard = safeDashboard(window.BOOSTR_DASHBOARD || session.redirect);
    const context = sessionContext(session);
    const name = sessionName(session);

    if (title) title.textContent = name ? `${copy.activeTitle.replace('.', '')}, ${name.split(' ')[0]}.` : copy.activeTitle;
    if (lead) lead.textContent = copy.activeLead;
    if (loginChoice) loginChoice.href = dashboard;
    if (loginTitle) loginTitle.textContent = copy.activeChoice;
    if (loginBody) loginBody.textContent = context || copy.activeFallback;
    if (sessionNote) sessionNote.hidden = false;
    if (sessionNoteTitle) sessionNoteTitle.textContent = copy.activeNote;
    if (sessionNoteBody) sessionNoteBody.textContent = context || copy.sessionReady;

    if (launchedAsPwa && params.get('stay') !== '1') {
      if (pwaTransition) pwaTransition.hidden = false;
      window.setTimeout(() => window.location.replace(dashboard), 420);
    }
  }

  function paintGuest() {
    root.dataset.session = 'guest';
  }

  function configureInstall() {
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isStandalone) return;
    if (isiOS || deferredInstallPrompt) installButton.hidden = false;
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

  installButton?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }
    installDialog?.showModal();
  });

  document.getElementById('installClose')?.addEventListener('click', () => installDialog?.close());
  document.getElementById('installDone')?.addEventListener('click', () => installDialog?.close());
  installDialog?.addEventListener('click', (event) => {
    if (event.target === installDialog) installDialog.close();
  });

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.language));
  });

  document.addEventListener('boostrSessionReady', (event) => paintActiveSession(event.detail));
  document.addEventListener('boostrSessionMissing', paintGuest);

  document.getElementById('year').textContent = new Date().getFullYear();
  root.classList.toggle('boostr-standalone', isStandalone);
  applyLanguage(currentLanguage);
  configureInstall();
})();
