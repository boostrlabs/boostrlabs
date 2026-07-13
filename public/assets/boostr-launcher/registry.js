(function (global) {
  'use strict';

  const PARTNERS = {
    boostr: { id: 'boostr', name: 'BOOSTR Labs', logo: '/assets/logos/boostr-logo-nav.png', tone: 'dark' },
    omni: { id: 'omni', name: 'OMNI JR Parking', logo: '/assets/omni-jr/omni-jr-logo-black.svg', tone: 'light' },
    hummus: { id: 'hummus', name: 'Hummus Mediterranean Food', logo: '/assets/boostr-launcher/hummus-wordmark.svg', tone: 'light' },
    janko: { id: 'janko', name: 'JANKO', logo: '/assets/link/janko/janko-logo-white-hd.png', tone: 'dark' },
    angel82: { id: 'angel82', name: '82NGEL', logo: '/assets/link/82ngel/logo.png', tone: 'dark' }
  };

  const SYSTEMS = [
    {
      id: 'core',
      name: 'BOOSTR LABS',
      symbol: 'core',
      accent: 'violet',
      memberOnly: true,
      moduleSlugs: ['manager-os', 'boostr-audit'],
      workspaceTerms: ['boostr labs'],
      partners: ['boostr']
    },
    {
      id: 'worker',
      name: 'BOOSTR WORKER OS',
      symbol: 'worker',
      accent: 'blue',
      guestState: 'login',
      partners: ['boostr']
    },
    {
      id: 'parking',
      name: 'PARKING OS',
      symbol: 'parking',
      accent: 'cyan',
      guestState: 'public',
      publicRoute: '/parking/omni-jr/',
      moduleSlugs: ['parking-os', 'smart-checkout'],
      workspaceTerms: ['omni', 'parking'],
      partners: ['omni']
    },
    {
      id: 'restaurant',
      name: 'RESTAURANT OS',
      symbol: 'restaurant',
      accent: 'amber',
      guestState: 'locked',
      moduleSlugs: ['restaurant-os', 'manager-os'],
      workspaceTerms: ['hummus', 'restaurant'],
      partners: ['hummus']
    },
    {
      id: 'automotive',
      name: 'AUTOMOTIVE OS',
      symbol: 'automotive',
      accent: 'indigo',
      guestState: 'soon',
      moduleSlugs: ['automotive-os'],
      workspaceTerms: ['automotive', 'dealer', 'honda', 'toyota', 'cars'],
      partners: []
    },
    {
      id: 'artist',
      name: 'ARTIST OS',
      symbol: 'artist',
      accent: 'rose',
      guestState: 'soon',
      moduleSlugs: ['artist-os'],
      workspaceTerms: ['artist', 'janko', '82ngel', 'westdetro'],
      partners: []
    },
    {
      id: 'payments',
      name: 'PAYMENTS OS',
      symbol: 'payments',
      accent: 'green',
      guestState: 'soon',
      moduleSlugs: ['smart-checkout', 'smart-payment-link', 'payments-os'],
      workspaceTerms: [],
      partners: ['boostr']
    },
    {
      id: 'beauty',
      name: 'BEAUTY OS',
      symbol: 'beauty',
      accent: 'pink',
      guestState: 'soon',
      moduleSlugs: ['beauty-os'],
      workspaceTerms: ['beauty', 'omg beauty', 'nail'],
      partners: []
    }
  ];

  const clean = (value) => String(value || '').trim().toLowerCase();
  const unique = (values) => [...new Set(values.filter(Boolean))];

  function contextFor(session) {
    const user = session?.user || {};
    const email = clean(user.email);
    const roles = unique([session?.role, user.role, ...(session?.roles || [])].map(clean));
    const workspaces = (session?.workspaces || []).map((workspace) => ({
      ...workspace,
      haystack: clean([workspace.name, workspace.type, workspace.slug, workspace.role].filter(Boolean).join(' '))
    }));
    const personas = (session?.personas || []).map((persona) => clean([persona.persona_type, persona.display_name, persona.status].join(' ')));
    const modules = (session?.visible_modules || []).map((module) => ({
      ...module,
      slug: clean(module.slug),
      status: clean(module.status)
    }));
    const founder = email === 'janko@boostrlabs.com';
    const johanka = email === 'johanka@boostrlabs.com';
    const elevated = founder || roles.some((role) => ['admin', 'ceo', 'founder'].includes(role));
    return { session, user, email, roles, workspaces, personas, modules, founder, johanka, elevated };
  }

  function hasWorkspace(context, terms) {
    if (!terms?.length) return false;
    return context.workspaces.some((workspace) => terms.some((term) => workspace.haystack.includes(clean(term))));
  }

  function hasActiveModule(context, slugs) {
    if (!slugs?.length) return false;
    return context.modules.some((module) => slugs.includes(module.slug) && ['active', 'available', 'enabled'].includes(module.status));
  }

  function canOpen(system, context) {
    if (!context?.session) return false;
    if (system.id === 'worker') return true;
    if (system.id === 'core') return context.elevated;
    if (context.elevated) return true;
    if (system.id === 'artist' && context.personas.some((persona) => persona.includes('artist'))) return true;
    return hasWorkspace(context, system.workspaceTerms) || hasActiveModule(context, system.moduleSlugs);
  }

  function routeFor(system, context) {
    if (!context?.session) {
      if (system.id === 'worker') return '/login/';
      return system.publicRoute || '';
    }

    const sessionRedirect = typeof context.session.redirect === 'string' && context.session.redirect.startsWith('/') && !context.session.redirect.startsWith('//')
      ? context.session.redirect
      : '/app/workspace/';

    if (system.id === 'worker') return sessionRedirect;
    if (system.id === 'core') return context.founder ? '/app/janko/' : '/admin/';
    if (system.id === 'parking') return hasWorkspace(context, system.workspaceTerms) || context.elevated ? '/app/parking/omni-jr/' : '/parking/omni-jr/';
    if (system.id === 'restaurant') {
      if (context.founder) return '/hummusfl/manager-missions/';
      if (context.johanka) return '/hummusfl/creative-missions/';
      return '/partner-dashboard/';
    }
    if (system.id === 'artist') {
      if (context.founder) return '/app/janko/';
      if (context.johanka) return '/app/82ngel/';
      return '/partner-dashboard/';
    }
    if (system.id === 'payments') return '/smart-payment-link/';
    return '/partner-dashboard/';
  }

  function partnersFor(system, context) {
    const ids = [...(system.partners || [])];
    if (system.id === 'artist' && context?.session) {
      if (context.founder) ids.push('janko');
      if (context.johanka) ids.push('angel82');
      if (!context.founder && !context.johanka && canOpen(system, context)) {
        if (hasWorkspace(context, ['82ngel'])) ids.push('angel82');
        if (hasWorkspace(context, ['janko', 'westdetro'])) ids.push('janko');
      }
    }
    return unique(ids).map((id) => PARTNERS[id]).filter(Boolean);
  }

  function resolveSystems(session) {
    const context = session ? contextFor(session) : null;
    return SYSTEMS
      .filter((system) => !system.memberOnly || Boolean(session))
      .map((system) => {
        const memberAccess = canOpen(system, context);
        const guestState = system.guestState || 'locked';
        const state = session
          ? (memberAccess || system.publicRoute ? 'active' : guestState === 'soon' ? 'soon' : 'locked')
          : guestState;
        return {
          ...system,
          state,
          route: state === 'active' || state === 'public' || state === 'login' ? routeFor(system, context) : '',
          partners: partnersFor(system, context),
          memberAccess
        };
      });
  }

  global.BOOSTR_OS_LAUNCHER = Object.freeze({
    systems: SYSTEMS,
    partners: PARTNERS,
    contextFor,
    resolveSystems
  });
})(window);
