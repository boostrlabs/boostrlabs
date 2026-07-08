const linkAssets = '/assets/link/janko';
const angelAssets = '/assets/link/82ngel';

const previewPresets = {
  artist: {
    slug: 'artist-demo',
    type: 'Artist Preview',
    name: 'Artist Preview',
    universe: 'Release / booking / fan path',
    headline: 'Turn profile traffic into a premium artist front door.',
    intro: 'A personalized smart link demo for releases, visuals, booking and fan capture.',
    accent: '#9aa4ff',
    heroImage: `${linkAssets}/janko_10_nne_press_microphones.jpg`,
    primaryAction: 'Request Artist Preview',
    modules: ['Latest release', 'Platform buttons', 'Booking', 'Press kit', 'Fan capture'],
    actions: ['Listen', 'Watch', 'Book', 'Press Kit']
  },
  beauty: {
    slug: 'beauty-demo',
    type: 'Beauty / Local Service Preview',
    name: 'Beauty Business Preview',
    universe: 'Booking / services / WhatsApp flow',
    headline: 'A premium booking path for local service businesses.',
    intro: 'A personalized demo for services, appointment flow, proof, location and contact.',
    accent: '#c78d94',
    heroImage: '/assets/cases/omg-hero.png',
    primaryAction: 'Request Local Build',
    modules: ['Services', 'Booking CTA', 'WhatsApp flow', 'Portfolio', 'Policies'],
    actions: ['Book Now', 'Services', 'Instagram', 'Location']
  },
  auto: {
    slug: 'car-business-demo',
    type: 'Auto Business Preview',
    name: 'Auto Business Preview',
    universe: 'Inventory / leads / documents',
    headline: 'A lead path for car businesses that need more than a link.',
    intro: 'A personalized demo for inventory, credit routes, WhatsApp, intake and secure next steps.',
    accent: '#d5b364',
    heroImage: '/assets/cases/solve-finance.png',
    primaryAction: 'Request Auto Preview',
    modules: ['Inventory', 'Lead intake', 'Credit route', 'Document flow', 'Reports'],
    actions: ['View Inventory', 'Get Pre-Approved', 'WhatsApp', 'Trade-In']
  }
};

const jankoLink = {
  slug: 'janko',
  type: 'Flagship BOOSTR Link',
  name: 'JANKO DIORR',
  universe: 'WESTDETRO',
  subtitle: 'Artist / Producer / Creative Direction',
  bookingEmail: 'jankofeats@gmail.com',
  fullWebsiteUrl: '',
  accent: '#f5f5f5',
  logo: `${linkAssets}/janko-logo-white-hd.png`,
  navLogo: `${linkAssets}/janko-navbar-white.png`,
  favicon: `${linkAssets}/favicon-janko.ico`,
  mark: `${linkAssets}/janko-o-star-white.png`,
  westdetroLogo: `${linkAssets}/westdetro-logo-white-hd.png`,
  westdetroLogoGlow: `${linkAssets}/westdetro-logo-white-glow-hd.png`,
  westdetroNav: `${linkAssets}/westdetro-navbar-white.png`,
  westdetroMark: `${linkAssets}/westdetro-w-circle-white.png`,
  westdetroFooter: `${linkAssets}/westdetro-footer-white.png`,
  heroImage: `${linkAssets}/janko_10_nne_press_microphones.jpg`,
  latestImage: `${linkAssets}/late-night-cover.png`,
  worldImage: `${linkAssets}/janko_13_cap_mask_close.jpg`,
  proofImage: `${linkAssets}/janko-camp-pr-olmeda-4tueny.jpg`,
  headline: 'WESTDETRO IN ONE LINK.',
  intro: '',
  latestRelease: {
    title: 'LATE NIGHT',
    label: 'STREAM LATEST RELEASE',
    description: 'Primer single del album WESTDETRO. Prod, beat, mix & master by JANKO.',
    url: 'https://open.spotify.com/album/2pyeIgVOnx28Qm0Oq2zAH4?si=IxLQi1HcQfCiKEwJZRy8mw'
  },
  actions: [
    { label: 'Spotify', icon: 'spotify', url: 'https://open.spotify.com/artist/4Ft2k88AyQucZ1IXYtLHpu', featured: true },
    { label: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/@jankodiorr' },
    { label: 'YouTube Music', icon: 'music', url: 'https://music.youtube.com/channel/UC3_wczMzOK8JW1IOrng0oFA' },
    { label: 'Apple Music', icon: 'apple', url: 'https://music.apple.com/us/artist/janko-diorr/1652790817' },
    { label: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/jankodiorr/' },
    { label: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/jankodiorr/' },
    { label: 'Deezer', icon: 'deezer', url: 'https://www.deezer.com/en/artist/188923287' },
    { label: 'Booking', icon: 'mail', url: 'mailto:jankofeats@gmail.com' },
    { label: 'Beat Store', icon: 'wave', url: '', info: 'Beats by JANKO. Store coming soon on the official WESTDETRO site.' },
    { label: 'Merch', icon: 'star', url: '', panel: 'clothing' },
    { label: 'WESTDETRO', icon: 'globe', url: '', info: 'The full JANKO DIORR / WESTDETRO universe is being built inside the BOOSTR ecosystem.' }
  ],
  essentials: [
    { title: 'CATALOG', meta: 'Top tracks', image: `${linkAssets}/janko-camp-pr-olmeda-4tueny.jpg`, url: '#janko-playlist' },
    { title: 'WESTDETRO', meta: 'World', image: `${linkAssets}/janko_09_westdetro_article_poster.jpg`, url: '#westdetro-world' },
    { title: 'NNE', meta: 'Visual identity', image: `${linkAssets}/janko_11_nne_text_black_white.jpg`, url: '', info: 'NNE is part of the WESTDETRO visual language and creative world.' },
    { title: 'LIVE', meta: 'Performance / booking', image: `${linkAssets}/janko_26_performance_bw.jpg`, url: '#link-capture' }
  ],
  modules: ['Latest release', 'Music platforms', 'Booking', 'Creative direction', 'Full website'],
  comingSoon: [
    { label: 'WESTDETRO Merch', icon: 'star', info: 'Merch drop coming later: apparel, physical pieces and WESTDETRO visuals.' },
    { label: 'Beat Store', icon: 'wave', info: 'Beats and production packs by JANKO. Store coming soon.' },
    { label: 'Sample Pack', icon: 'music', info: 'Original sounds and textures from the WESTDETRO universe.' }
  ],
  clothing: {
    label: 'Coming soon',
    title: 'WESTDETRO x NNE',
    description: 'Clothing pieces from the WESTDETRO universe. Oversized silhouettes, black and white graphics, MCBObang energy.',
    cta: 'Notify me',
    items: [
      {
        title: 'Rapperâ€™s Delight oversized tee',
        image: `${linkAssets}/westdetro-nne-oversized-tee.png`
      },
      {
        title: 'MCBOGANG tee mockup',
        image: `${linkAssets}/mcbogang-westdetro-tee-mockup.png`
      },
      {
        title: 'MCBOGANG graphic',
        image: `${linkAssets}/mcbogang-westdetro-tee-art.png`
      }
    ]
  },
  playlist: [
    {
      title: 'NONONO',
      meta: 'GEMESE x JANKO DIORR',
      primary: 'https://www.youtube.com/watch?v=cFqbEkmLDwU',
      secondary: 'https://open.spotify.com/album/70gHiYhdDM3NGEnWMHKSc1?si=osFQ2eU5R7Cjzc0XBvV6KA'
    },
    {
      title: 'GALERIA',
      meta: 'JANKO DIORR',
      primary: 'https://open.spotify.com/album/7q8gFUsTE15g8pshR1uQeY?si=shBqUL-_SL6YLithNQJxxA',
      secondary: 'https://music.apple.com/us/song/galeria/1773451248'
    },
    {
      title: 'WESTDETRO (INTRO)',
      meta: 'JANKO DIORR',
      primary: 'https://open.spotify.com/album/4vqwSq9ZkntFcOPRe1k1iM?si=PgEFQGbHQF267C-BpRhEjQ',
      secondary: 'https://music.apple.com/us/song/westdetro-intro/1873201967'
    },
    {
      title: 'VOS SABEI',
      meta: 'XIAM x JANKO DIORR x GEMESE x BEATS PER MINUTES',
      video: 'https://www.youtube.com/watch?v=nZ63L353WcM',
      primary: 'https://open.spotify.com/album/1O3CNGna51wJOKjzxIgBiy?si=QWSuW_huToOLWunha6MaLw'
    },
    {
      title: 'LATE NIGHT',
      meta: 'JANKO DIORR',
      primary: 'https://open.spotify.com/album/2pyeIgVOnx28Qm0Oq2zAH4?si=IxLQi1HcQfCiKEwJZRy8mw'
    },
    {
      title: 'TUSSIPUSSI',
      meta: 'LEXXTER x JANKO DIORR',
      primary: 'https://open.spotify.com/album/5Azb9QQwgSG5hM3ip1vnVe?si=1AOYXidJRKCE1PIbyakGLw'
    },
    {
      title: 'AMSTERDAM',
      meta: 'JANKO DIORR x JOHN THEIS',
      video: 'https://www.youtube.com/watch?v=xt4tTgUzTOU',
      primary: 'https://open.spotify.com/album/39Hg2OkUHDxKCTJHA9y1UD?si=Of-QF5dYTpm3sl7jVsqP2w',
      secondary: 'https://music.apple.com/us/album/amsterdam-single/1869957822'
    },
    {
      title: 'STALKEO RMX',
      meta: 'XIAM x JOHN THEIS x SALINAS + MORE',
      video: 'https://www.youtube.com/watch?v=qTIk46WWAdA',
      primary: 'https://open.spotify.com/album/5gTdwXzVOF4JgXVPVtnAXe?si=H3Zfr5FkQjKwxdlMNXgHDQ'
    },
    {
      title: 'LOVEU',
      meta: 'JANKO DIORR x ROYALLIVE',
      primary: 'https://open.spotify.com/album/6T1kIksfnG94tPY8MPzLpl?si=-hYW_RzYTnmlCBfSR7NJUQ',
      secondary: 'https://music.apple.com/us/album/loveu-single/1728499992'
    },
    {
      title: 'VOS SABEI RMX',
      meta: '1.0 / 2.0',
      videos: ['https://www.youtube.com/watch?v=13cLVIr53GU', 'https://www.youtube.com/watch?v=mxeBWmZAZpc'],
      primary: 'https://music.apple.com/us/album/vos-sabei-remix-1-0-feat-moffa-gemese-janko-diorr-larousse/1885007605',
      secondary: 'https://music.apple.com/us/album/vos-sabei-remix-2-0-feat-gemese-janko-diorr-larousse/1890260114'
    }
  ]
};

const jankoCollaborators = [
  'GEMESE',
  'XIAM',
  'LEXXTER',
  'JOHN THEIS',
  'ROYALLIVE',
  'SALINAS',
  'LAROUSSE',
  'MOFFA',
  'DRY',
  'HIRA',
  'JOTAERRE',
  'BASKIAT',
  '82NGEL',
  'FABRIELL LMH',
  'JLUZ',
  'LEMUELL'
];

const angelLink = {
  slug: '82ngel',
  name: '82NGEL',
  universe: '82',
  accent: '#ff1717',
  bookingEmail: 'boostrlabs@gmail.com',
  assets: {
    background: `${angelAssets}/bg-real.jpg`,
    logo: `${angelAssets}/logo.png`,
    figure: `${angelAssets}/girl-red.png`,
    communityOne: `${angelAssets}/girl-gun-white.jpg`,
    communityTwo: `${angelAssets}/dj.jpg`,
    doriPoster: `${angelAssets}/dori-poster.jpg`,
    doriVideo: `${angelAssets}/dori-preview.mp4`
  },
  actions: [
    { label: 'TikTok', icon: 'tiktok', url: '', info: 'TikTok link pending.' },
    { label: 'Apple Music', icon: 'apple', url: '', info: 'Apple Music link pending.' },
    { label: 'Spotify', icon: 'spotify', url: '', info: 'Spotify link pending.' },
    { label: 'Instagram', icon: 'instagram', url: '', info: 'Instagram link pending.' },
    { label: 'Contact', icon: 'mail', url: 'mailto:boostrlabs@gmail.com' }
  ],
  gallery: [
    { title: 'REPLAY', image: `${angelAssets}/cover-replay.jpg` },
    { title: 'ARCHIVES', image: `${angelAssets}/cover-archives.jpg` },
    { title: '82 WEST', image: `${angelAssets}/cover-82west.jpg` },
    { title: 'DORI', image: `${angelAssets}/cover-dori.jpg` }
  ]
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const normalizeSlug = (slug = '') =>
  slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getHostnameRoute = (location) => {
  const host = location.hostname.toLowerCase();
  const subdomain = host.split('.')[0];

  if (['janko', 'jankodiorr', 'westdetro'].includes(subdomain)) {
    return { kind: 'smart-link', slug: 'janko' };
  }

  if (['82ngel', 'johanka'].includes(subdomain)) {
    return { kind: 'smart-link', slug: '82ngel' };
  }

  if (subdomain === 'preview') {
    const slug = normalizeSlug(location.pathname.split('/').filter(Boolean)[0] || 'demo');
    return { kind: 'preview', slug };
  }

  return null;
};

export const getLinkRoute = (location) => {
  const hostnameRoute = getHostnameRoute(location);
  if (hostnameRoute) return hostnameRoute;

  const path = location.pathname.replace(/\/+$/, '') || '/';

  if (['/janko', '/jankodiorr', '/westdetro'].includes(path)) {
    return { kind: 'smart-link', slug: 'janko' };
  }

  if (['/82ngel', '/johanka'].includes(path)) {
    return { kind: 'smart-link', slug: '82ngel' };
  }

  const previewMatch = path.match(/^\/preview\/([^/]+)/);
  if (previewMatch) {
    return { kind: 'preview', slug: normalizeSlug(previewMatch[1]) };
  }

  return null;
};

const getPreviewConfig = (slug) => {
  if (previewPresets[slug]) return previewPresets[slug];
  if (slug.includes('beauty') || slug.includes('nail') || slug.includes('service')) return previewPresets.beauty;
  if (slug.includes('auto') || slug.includes('car') || slug.includes('dealer')) return previewPresets.auto;
  if (slug.includes('artist') || slug.includes('music') || slug.includes('creator')) return previewPresets.artist;

  const title = slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Client Preview';

  return {
    ...previewPresets.artist,
    slug,
    type: 'Client Preview',
    name: `${title} Preview`,
    universe: 'Personalized BOOSTR demo',
    headline: 'A private preview for your business system.',
    intro: 'This page is a demo path for outreach calls. It can become a smart link, website, landing page or Custom OS entry point.',
    primaryAction: 'Request This Preview'
  };
};

const actionUrl = (action, fallback = '#link-capture') => action.url || fallback;

const linkAttributes = (item, fallback = '#') => {
  const href = item.url || item.primary || fallback;
  if (String(href).startsWith('#')) return '';
  return 'target="_blank" rel="noreferrer"';
};

const getPlatformLink = (url = '') => {
  const value = String(url).toLowerCase();
  if (value.includes('youtube.com') || value.includes('youtu.be')) {
    return { label: 'WATCH', platform: 'YouTube', icon: 'youtube' };
  }
  if (value.includes('music.apple.com')) {
    return { label: 'PLAY', platform: 'Apple Music', icon: 'apple' };
  }
  if (value.includes('spotify.com')) {
    return { label: 'PLAY', platform: 'Spotify', icon: 'spotify' };
  }
  if (value.includes('deezer.com')) {
    return { label: 'PLAY', platform: 'Deezer', icon: 'deezer' };
  }
  return { label: 'PLAY', platform: 'Music', icon: 'music' };
};

const renderTrackPlatformButtons = (track) =>
  [...(track.videos || []), track.video, track.primary, track.secondary]
    .filter(Boolean)
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .map((url) => {
      const platform = getPlatformLink(url);
      return `<a class="track-platform" href="${url}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(`${track.title} on ${platform.platform}`)}" title="${escapeHtml(platform.platform)}">${iconTemplate(platform.icon)}<span>${platform.label}</span></a>`;
    })
    .join('');

const iconTemplate = (name) => {
  const icons = {
    spotify:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M7.5 9.4c3.2-1 6.4-.7 9.2.8"></path><path d="M8 12c2.5-.7 5.1-.5 7.3.6"></path><path d="M8.7 14.4c1.9-.5 3.9-.4 5.6.4"></path></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6.5" width="17" height="11" rx="3"></rect><path d="M10.5 9.5v5l4.2-2.5z"></path></svg>',
    music:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="16" r="2"></circle></svg>',
    apple:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5c-.8.5-1.4 1.4-1.3 2.3 1-.1 1.8-.8 2.2-1.5.3-.5.5-1 .5-1.4-.5 0-1 .2-1.4.6z"></path><path d="M18 16.4c-.4.9-.7 1.3-1.3 2.1-.8 1.1-1.8 2.4-3.1 2.4-1.2 0-1.5-.7-3-.7s-1.9.7-3 .7c-1.3 0-2.3-1.2-3.1-2.3-1.7-2.5-1.9-5.5-.9-7.1.7-1.2 1.9-1.9 3.1-1.9 1.2 0 2 .8 3 .8 1 0 1.6-.8 3-.8 1.1 0 2.2.6 2.9 1.6-2.5 1.4-2.1 4.9.4 5.2z"></path></svg>',
    tiktok:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.3a4 4 0 1 1-3.4-4v3a1.4 1.4 0 1 0 1 1.4V4z"></path><path d="M14 4c.5 2.7 2.1 4.4 4.7 4.8"></path></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="4.2"></rect><circle cx="12" cy="12" r="3.4"></circle><circle cx="16.7" cy="7.3" r=".6"></circle></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h2V5h-2c-2.2 0-3.5 1.3-3.5 3.5V11H8v3h2.5v6H14v-6h2.4l.6-3h-3z"></path></svg>',
    deezer:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15h3v4H4z"></path><path d="M8.5 12h3v7h-3z"></path><path d="M13 9h3v10h-3z"></path><path d="M17.5 6h3v13h-3z"></path></svg>',
    mail:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="m5 7 7 6 7-6"></path></svg>',
    wave:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13c2.2-5 4.4-5 6.6 0s4.4 5 6.6 0"></path><path d="M17.2 13c1-2.3 2-3.6 2.8-3.9"></path></svg>',
    star:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 6.1 6.4.6-4.8 4.2 1.5 6.3L12 16.9l-5.7 3.3 1.5-6.3L3 9.7l6.4-.6z"></path></svg>',
    globe:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M4 12h16"></path><path d="M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8"></path><path d="M12 4c-2 2.2-3 4.9-3 8s1 5.8 3 8"></path></svg>'
  };

  return icons[name] || icons.star;
};

const renderJanko = (config, referralCode) => `
  <div class="link-page janko-link" style="--link-accent: ${config.accent}">
    <header class="link-nav">
      <a href="/" class="link-powered"><img src="${config.mark}" alt="" />Powered by <strong>BOOSTR Labs</strong></a>
      <a href="${config.fullWebsiteUrl || '#full-website'}" class="link-nav-action" ${config.fullWebsiteUrl ? '' : 'data-coming-soon data-info="The full WESTDETRO universe is being built."'}>WESTDETRO Universe</a>
    </header>

    <main>
      <section class="link-hero">
        <img class="link-ambient-mark" src="${config.westdetroMark}" alt="" />
        <div class="link-hero-copy">
          <h1 class="link-sr-title">${config.name} / ${config.universe}</h1>
          <div class="janko-hero-lockup">
            <p class="janko-hero-label">JANKO DIORR</p>
            <img class="janko-official-logo" src="${config.logo}" alt="${config.name}" />
            <span class="hero-divider"></span>
            <strong>WESTDETRO</strong>
            <small>Official smart link</small>
          </div>
        </div>
        <div class="link-hero-media">
          <img src="${config.heroImage}" alt="${config.name}" />
        </div>
      </section>

      <section class="collab-marquee" aria-label="JANKO collaborators">
        <div class="collab-marquee-track">
          ${[...jankoCollaborators, ...jankoCollaborators].map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
        </div>
      </section>

      <section class="link-actions" aria-label="JANKO actions">
        ${config.actions
          .map(
            (action) =>
              `<a class="${action.featured ? 'is-featured' : ''}" href="${action.panel === 'clothing' ? '#westdetro-merch' : actionUrl(action, '#')}" ${
                action.panel === 'clothing'
                  ? 'data-open-clothing'
                  : action.url
                    ? 'target="_blank" rel="noreferrer"'
                    : `data-coming-soon data-info="${escapeHtml(action.info || `${action.label} coming soon.`)}"`
              }>${iconTemplate(action.icon)}<span>${action.label}</span></a>`
          )
          .join('')}
      </section>

      <section class="link-feature">
        <div>
          <span>${config.latestRelease.label}</span>
          <h2>${config.latestRelease.title}</h2>
          <p>${config.latestRelease.description}</p>
          <a class="release-link" href="${config.latestRelease.url}" target="_blank" rel="noreferrer">Stream on Spotify</a>
        </div>
        <img src="${config.latestImage}" alt="${config.latestRelease.title}" />
      </section>

      <section class="link-section" id="janko-playlist">
        <div class="link-section-heading">
          <span>Catalog</span>
          <h2>JANKO DIORR.</h2>
        </div>
        <div class="track-list">
          ${config.playlist
            .map(
              (track, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>${escapeHtml(track.title)}</strong>
                    <small>${escapeHtml(track.meta)}</small>
                  </div>
                  <div class="track-platforms">
                    ${renderTrackPlatformButtons(track)}
                  </div>
                </article>`
            )
            .join('')}
        </div>
      </section>

      <section class="link-section">
        <div class="link-section-heading">
          <span>Selected</span>
          <h2>WESTDETRO.</h2>
        </div>
        <div class="link-card-row">
          ${config.essentials
            .map(
              (item) => `
                <a class="link-card" href="${actionUrl(item, '#')}" ${
                  item.url ? linkAttributes(item, item.url) : `data-coming-soon data-info="${escapeHtml(item.info || `${item.title} coming soon.`)}"`
                }>
                  <img src="${item.image}" alt="${item.title}" />
                  <strong>${item.title}</strong>
                  <span>${item.meta}</span>
                </a>`
            )
            .join('')}
        </div>
      </section>

      <section class="link-world" id="westdetro-world">
        <img src="${config.worldImage}" alt="WESTDETRO world" />
        <div>
          <span class="westdetro-world-kicker">WESTDETRO</span>
          <h2 class="westdetro-world-title">Entra al universo.</h2>
          <p>La identidad, los sonidos, los visuales y las ideas que construyen este mundo.</p>
          <a href="${config.fullWebsiteUrl || '#full-website'}" ${config.fullWebsiteUrl ? 'target="_blank" rel="noreferrer"' : 'data-coming-soon data-info="The full WESTDETRO universe is being built."'}>Entra al universo WESTDETRO</a>
        </div>
      </section>

      <section class="link-coming">
        ${config.comingSoon
          .map(
            (item) =>
              `<button type="button" ${item.label.includes('Merch') ? 'data-open-clothing' : `data-coming-soon data-info="${escapeHtml(item.info)}"`}>${iconTemplate(item.icon)}<span>${escapeHtml(item.label)}</span></button>`
          )
          .join('')}
      </section>

      <section class="link-capture" id="link-capture">
        <div>
          <span>Contact</span>
          <h2>Contact WESTDETRO.</h2>
          <p>Shows, beats, production, creative direction and serious collabs.</p>
        </div>
        <form class="link-form" data-link-form data-form-kind="janko-smart-link">
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <select name="serviceInterested" required>
            <option>Shows / Booking</option>
            <option>Beat inquiry</option>
            <option>Production</option>
            <option>Collab / creative direction</option>
          </select>
          <textarea name="message" rows="3" placeholder="What do you want to create?" required></textarea>
          <input type="hidden" name="businessProject" value="JANKO DIORR / WESTDETRO" />
          <input type="hidden" name="referralCode" data-referral-input value="${escapeHtml(referralCode)}" />
          <button type="submit">Contact WESTDETRO</button>
          <p data-link-status hidden></p>
        </form>
      </section>

    </main>

    <footer class="link-footer">
      <span><img src="${config.westdetroFooter}" alt="${config.universe}" /></span>
      <a href="/">Powered by BOOSTR Labs</a>
    </footer>
    <div class="clothing-panel" data-clothing-panel hidden>
      <div class="clothing-panel-card" role="dialog" aria-modal="true" aria-labelledby="westdetro-merch-title">
        <button class="clothing-panel-close" type="button" data-close-clothing aria-label="Close">Close</button>
        <div class="clothing-copy">
          <span>${escapeHtml(config.clothing.label)}</span>
          <h2 id="westdetro-merch-title">${escapeHtml(config.clothing.title)}</h2>
          <p>${escapeHtml(config.clothing.description)}</p>
          <button type="button" data-coming-soon data-info="WESTDETRO x NNE clothing is being prepared. Drop details coming soon.">${escapeHtml(config.clothing.cta)}</button>
        </div>
        <div class="clothing-grid">
          ${config.clothing.items
            .map(
              (item) => `
                <article>
                  <img src="${item.image}" alt="${escapeHtml(item.image.includes('oversized') ? "Rapper's Delight oversized tee" : item.title)}" />
                  <strong>${escapeHtml(item.image.includes('oversized') ? "Rapper's Delight oversized tee" : item.title)}</strong>
                </article>`
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="link-info-panel" data-link-toast hidden>
          <button type="button" data-close-info aria-label="Close">Close</button>
      <p data-info-text></p>
    </div>
  </div>
`;

const renderAngelAction = (action) =>
  action.url
    ? `<a class="angel-social-button" href="${action.url}" target="_blank" rel="noreferrer">${iconTemplate(action.icon)}<span>${escapeHtml(action.label)}</span></a>`
    : `<button class="angel-social-button" type="button" data-coming-soon data-info="${escapeHtml(action.info)}">${iconTemplate(action.icon)}<span>${escapeHtml(action.label)}</span></button>`;

const renderAngel = (config, referralCode) => `
  <div class="link-page angel-link" style="--link-accent: ${config.accent}; --angel-bg: url('${config.assets.background}')">
    <header class="link-nav angel-nav">
      <a href="#angel-home" class="link-powered">82NGEL</a>
      <a href="#angel-socials" class="link-nav-action">Contact</a>
    </header>

    <main class="angel-stage">
      <section class="angel-card-frame angel-intro" id="angel-home">
        <div class="angel-card-inner">
        <h1>82NGEL</h1>
        <p>is a Venezuelan singer, content creator, creative, and emerging artist blending emotional melodies with alternative sounds</p>
        <img class="angel-figure" src="${config.assets.figure}" alt="82NGEL visual mark" />
        <p>Passionate about fashion and art, she creates music and visuals that reflect her unique aesthetic and creative vision</p>
        <span class="angel-red-star" aria-hidden="true">&#9733;</span>
        <p>Focused on long-term artistry, 82NGEL is building a brand where music, fashion, and creativity evolve together as one identity</p>
          <a class="angel-corner-star" href="#angel-community" aria-label="Next card">&#9734;</a>
        </div>
      </section>

      <a class="angel-star-link" href="#angel-community" aria-label="Community">&#9734;</a>

      <section class="angel-card-frame angel-community" id="angel-community">
        <div class="angel-card-inner">
        <img class="angel-mini-logo" src="${config.assets.logo}" alt="82NGEL" />
        <h2>82</h2>
        <p class="angel-community-copy">has built a growing community of</p>
        <strong>70k+ followers,<br />1.3M+ likes,<br />and over 3.7 million</strong>
        <span class="angel-red-star" aria-hidden="true">&#9733;</span>
        <p>video views across TikTok, connecting through music, fashion, and creative content</p>
          <a class="angel-corner-star" href="#angel-gallery" aria-label="Next card">&#9734;</a>
        </div>
      </section>

      <section class="angel-card-frame angel-photo-card" aria-label="82NGEL community visuals">
        <div class="angel-card-inner">
          <div class="angel-community-grid">
            <img src="${config.assets.communityOne}" alt="82NGEL visual" />
            <img src="${config.assets.communityTwo}" alt="82NGEL creative visual" />
            <img src="${config.gallery[0].image}" alt="${config.gallery[0].title}" />
            <img src="${config.gallery[3].image}" alt="${config.gallery[3].title}" />
          </div>
        </div>
      </section>

      <a class="angel-star-link" href="#angel-gallery" aria-label="Gallery">&#9734;</a>

      <section class="angel-card-frame angel-gallery-title" id="angel-gallery">
        <div class="angel-card-inner">
          <h2>GALLERY</h2>
        </div>
      </section>

      <section class="angel-card-frame angel-gallery">
        <div class="angel-card-inner">
        <div class="angel-cover-grid">
          ${config.gallery
            .map(
              (item) => `
                <article>
                  <img src="${item.image}" alt="${escapeHtml(item.title)}" />
                  <span>${escapeHtml(item.title)}</span>
                </article>`
            )
            .join('')}
        </div>
        </div>
      </section>

      <section class="angel-card-frame angel-video-panel">
        <div class="angel-card-inner">
          <div class="angel-video-card">
          <video controls preload="metadata" poster="${config.assets.doriPoster}">
            <source src="${config.assets.doriVideo}" type="video/mp4" />
          </video>
          <strong>DORI</strong>
          <span>JANKO &amp; 82NGEL<br />#WESTDETRO</span>
          </div>
          <a class="angel-corner-star" href="#angel-socials" aria-label="Next card">&#9734;</a>
        </div>
      </section>

      <a class="angel-star-link" href="#angel-socials" aria-label="Socials">&#9734;</a>

      <section class="angel-card-frame angel-social-panel" id="angel-socials">
        <div class="angel-card-inner">
        <h2>SOCIALS</h2>
        <div class="angel-social-icons">
          ${config.actions.map(renderAngelAction).join('')}
        </div>
        <img class="angel-mini-logo" src="${config.assets.logo}" alt="" />
        <h3>CONTACT ME</h3>
        <a class="angel-mail" href="mailto:${escapeHtml(config.bookingEmail)}">mail</a>
        </div>
      </section>
    </main>

    <footer class="link-footer">
      <a href="/">Powered by BOOSTR Labs</a>
    </footer>
    <div class="link-info-panel" data-link-toast hidden>
      <button type="button" data-close-info aria-label="Close">Close</button>
      <p data-info-text></p>
    </div>
  </div>
`;

const renderPreview = (config, referralCode) => `
  <div class="link-page preview-link" style="--link-accent: ${config.accent}">
    <header class="link-nav">
      <a href="/" class="link-powered"><strong>BOOSTR Labs</strong> Preview System</a>
      <a href="#link-capture" class="link-nav-action">Request Build</a>
    </header>

    <main>
      <section class="link-hero">
        <div class="link-hero-copy">
          <p class="link-kicker">${escapeHtml(config.type)}</p>
          <h1>${escapeHtml(config.name)}</h1>
          <p class="link-universe">${escapeHtml(config.universe)}</p>
          <p>${escapeHtml(config.intro)}</p>
          <div class="link-proof-row">
            ${config.modules.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
          </div>
        </div>
        <div class="link-hero-media">
          <img src="${config.heroImage}" alt="${escapeHtml(config.name)}" />
        </div>
      </section>

      <section class="link-feature">
        <div>
          <span>Personalized Demo</span>
          <h2>${escapeHtml(config.headline)}</h2>
          <p>Built as a free preview before the outreach call. The same system can become a smart link, landing page or Custom OS entry point.</p>
        </div>
        <div class="preview-device">
          ${config.actions.map((item) => `<button type="button">${escapeHtml(item)}</button>`).join('')}
        </div>
      </section>

      <section class="link-section">
        <div class="link-section-heading">
          <span>BOOSTR Link System</span>
          <h2>One engine. Different client worlds.</h2>
        </div>
        <div class="preview-module-grid">
          ${config.modules
            .map(
              (item) => `
              <article>
                <span>${escapeHtml(item)}</span>
                <p>Designed to connect with lead capture, booking, contact flow or future system modules.</p>
              </article>`
            )
            .join('')}
        </div>
      </section>

      <section class="link-capture" id="link-capture">
        <div>
          <span>Preview Request</span>
          <h2>Want this built for your brand?</h2>
          <p>Send the project details. BOOSTR can turn this preview into a scoped system path.</p>
        </div>
        <form class="link-form" data-link-form data-form-kind="client-preview">
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="phone" placeholder="Phone" required />
          <input name="businessProject" placeholder="Business / project" required />
          <input name="link" placeholder="Website or Instagram" />
          <select name="serviceInterested" required>
            <option>${escapeHtml(config.primaryAction)}</option>
            <option>BOOSTR Link</option>
            <option>Landing Page</option>
            <option>Custom OS</option>
          </select>
          <textarea name="message" rows="3" placeholder="What should this help you capture, sell or organize?" required></textarea>
          <input type="hidden" name="referralCode" data-referral-input value="${escapeHtml(referralCode)}" />
          <button type="submit">${escapeHtml(config.primaryAction)}</button>
          <p data-link-status hidden></p>
        </form>
      </section>
    </main>

    <footer class="link-footer">
      <span>${escapeHtml(config.name)}</span>
      <a href="/">Powered by BOOSTR Labs</a>
    </footer>
    <a class="link-sticky" href="#link-capture">${escapeHtml(config.primaryAction)}</a>
    <div class="link-toast" data-link-toast hidden>Coming soon. Join the list.</div>
  </div>
`;

const bindLinkExperience = ({ submitLead, getReferralCode }) => {
  const toast = document.querySelector('[data-link-toast]');
  const toastText = document.querySelector('[data-info-text]');
  const closeInfo = document.querySelector('[data-close-info]');
  let toastTimer;

  document.querySelectorAll('[data-coming-soon]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      if (!toast) return;
      if (toastText) {
        toastText.textContent = item.dataset.info || 'Coming soon.';
      }
      toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.hidden = true;
      }, 5200);
    });
  });

  closeInfo?.addEventListener('click', () => {
    if (!toast) return;
    toast.hidden = true;
    window.clearTimeout(toastTimer);
  });

  const clothingPanel = document.querySelector('[data-clothing-panel]');
  const closeClothingPanel = () => {
    if (!clothingPanel) return;
    clothingPanel.hidden = true;
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-clothing]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      if (!clothingPanel) return;
      clothingPanel.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('[data-close-clothing]').forEach((item) => {
    item.addEventListener('click', closeClothingPanel);
  });

  clothingPanel?.addEventListener('click', (event) => {
    if (event.target === clothingPanel) closeClothingPanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && clothingPanel && !clothingPanel.hidden) {
      closeClothingPanel();
    }
  });

  document.querySelectorAll('[data-link-form]').forEach((form) => {
    const status = form.querySelector('[data-link-status]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const button = form.querySelector('button[type="submit"]');

      status.hidden = false;
      status.textContent = 'Sending...';
      button.disabled = true;

      try {
        await submitLead({
          ...payload,
          referralCode: payload.referralCode || getReferralCode(),
          pageUrl: window.location.href,
          submittedAt: new Date().toISOString()
        });
        status.textContent = 'Request received. BOOSTR will review the next move.';
        form.reset();
      } catch (error) {
        status.textContent = 'Something failed. Try again or contact BOOSTR directly.';
      } finally {
        button.disabled = false;
      }
    });
  });
};

const setPageIcon = (href) => {
  if (!href) return;
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = href;
};

export const renderLinkExperience = ({ route, mount, submitLead, getReferralCode, setReferralCode }) => {
  const isSmartLink = route.kind === 'smart-link';
  const isJanko = isSmartLink && route.slug === 'janko';
  const isAngel = isSmartLink && route.slug === '82ngel';
  const config = isJanko ? jankoLink : isAngel ? angelLink : getPreviewConfig(route.slug);

  if (route.kind === 'preview') {
    setReferralCode(`PREVIEW-${normalizeSlug(route.slug).toUpperCase()}`);
  }

  const referralCode = getReferralCode();
  mount.innerHTML = isJanko ? renderJanko(config, referralCode) : isAngel ? renderAngel(config, referralCode) : renderPreview(config, referralCode);
  document.title = isJanko
    ? 'JANKO DIORR / WESTDETRO | Powered by BOOSTR Labs'
    : isAngel
      ? '82NGEL | Powered by BOOSTR Labs'
      : `${config.name} | BOOSTR Preview`;
  if (isJanko) setPageIcon(config.favicon);

  bindLinkExperience({ submitLead, getReferralCode });
};
