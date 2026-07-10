const injection = String.raw`
<style id="janko-admin-patch-v071">
  .janko-brand-hub{display:grid;gap:8px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.24);border-radius:22px;padding:10px}
  .janko-brand-hub__label{font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.15em;text-transform:uppercase;color:rgba(247,245,239,.48)}
  .janko-brand-hub__logos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .janko-brand-logo{min-height:54px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025));border-radius:15px;padding:8px;display:grid;place-items:center;text-decoration:none;transition:transform .18s ease,border-color .18s ease,background .18s ease}
  .janko-brand-logo:hover,.janko-brand-logo:focus-visible{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 48%,rgba(255,255,255,.12));background:color-mix(in srgb,var(--accent) 8%,rgba(255,255,255,.04));outline:none}
  .janko-brand-logo img{display:block;width:100%;height:28px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.45))}
  .janko-session-actions{display:grid;gap:7px;margin-top:10px}
  .janko-logout{width:100%;min-height:42px;border:1px solid rgba(255,105,105,.24);background:rgba(255,69,69,.07);color:#ffaaaa;border-radius:16px;padding:0 12px;font:900 11px/1 Inter,Arial,sans-serif;cursor:pointer;transition:.18s ease}
  .janko-logout:hover,.janko-logout:focus-visible{background:rgba(255,69,69,.14);border-color:rgba(255,105,105,.44);outline:none}
  .janko-logout[disabled]{opacity:.55;cursor:wait}
  .janko-session-note{color:rgba(247,245,239,.44);font-size:9px;line-height:1.35;text-align:center}
  .janko-profile-brand-section{grid-column:1/-1}
  .janko-profile-brand-section .janko-brand-hub{background:rgba(255,255,255,.025)}
  @media(max-width:980px){
    .janko-brand-hub--rail{display:none}
  }
  @media(max-width:620px){
    .janko-brand-hub__logos{grid-template-columns:1fr 1fr 1fr}
    .janko-brand-logo{min-height:50px;padding:7px}
    .janko-brand-logo img{height:24px}
  }
</style>
<script id="janko-admin-patch-v071">
(() => {
  const brands = [
    { name:'BOOSTR Labs', href:'/home', src:'/assets/logos/boostr-logo-nav.png' },
    { name:'JANKO', href:'/jankodiorr', src:'/assets/link/janko/janko-logo-white-hd.png' },
    { name:'WESTDETRO', href:'/jankodiorr#westdetro-world', src:'/assets/link/janko/westdetro-logo-white-hd.png' }
  ];

  const brandHubMarkup = (extraClass='') => `
    <section class="janko-brand-hub ${extraClass}" aria-label="Janko brand hub">
      <div class="janko-brand-hub__label">Tus compañías y productos</div>
      <div class="janko-brand-hub__logos">
        ${brands.map(brand => `<a class="janko-brand-logo" href="${brand.href}" title="${brand.name}" aria-label="Abrir ${brand.name}"><img src="${brand.src}" alt="${brand.name}"></a>`).join('')}
      </div>
    </section>`;

  function installRailHub(){
    const rail = document.querySelector('.rail');
    const profile = rail?.querySelector('.profile-mini');
    if(!rail || !profile || rail.querySelector('.janko-brand-hub--rail')) return;
    profile.insertAdjacentHTML('afterend', brandHubMarkup('janko-brand-hub--rail'));

    const foot = rail.querySelector('.rail-foot');
    if(foot && !rail.querySelector('.janko-session-actions')){
      foot.insertAdjacentHTML('beforebegin', `
        <div class="janko-session-actions">
          <button type="button" class="janko-logout" data-janko-logout>Cerrar sesión</button>
          <div class="janko-session-note">Revoca esta sesión y vuelve a BOOSTR Login.</div>
        </div>`);
    }
  }

  function installProfileHub(){
    const profileContent = document.getElementById('profileContent');
    if(!profileContent) return;
    const mount = () => {
      if(profileContent.querySelector('.janko-profile-brand-section')) return;
      profileContent.insertAdjacentHTML('afterbegin', `
        <section class="section janko-profile-brand-section">
          <h3>Brand Hub</h3>
          ${brandHubMarkup('janko-brand-hub--profile')}
          <div class="janko-session-actions">
            <button type="button" class="janko-logout" data-janko-logout>Cerrar sesión</button>
          </div>
        </section>`);
    };
    mount();
    new MutationObserver(() => requestAnimationFrame(mount)).observe(profileContent,{childList:true});
  }

  async function logout(button){
    if(button) { button.disabled = true; button.textContent = 'Cerrando sesión…'; }
    const token = localStorage.getItem('boostr_auth_token') || '';
    try{
      await fetch('/api/session',{
        method:'DELETE',
        credentials:'same-origin',
        headers: token ? { Authorization:`Bearer ${token}` } : {}
      });
    }catch{}
    [
      'boostr_auth_token','boostr_session','boostr_janko_mode','boostr_janko_lang',
      'boostr_founder_bootstrap_closed'
    ].forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    location.replace('/login/?logout=1');
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-janko-logout]');
    if(button){ event.preventDefault(); logout(button); }
  });

  const boot = () => { installRailHub(); installProfileHub(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
</script>`;

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const html = await response.text();
  const patched = html.includes('janko-admin-patch-v071')
    ? html
    : html.replace('</body>', `${injection}</body>`);

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.delete('Content-Length');
  return new Response(patched, { status: response.status, statusText: response.statusText, headers });
}
