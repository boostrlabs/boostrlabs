(function(){
  const baseAdminModule=window.adminModule;
  const safeJSON=(value,fallback={})=>{try{return typeof value==='string'&&value?JSON.parse(value):value||fallback}catch{return fallback}};
  const chipList=(items)=>Array.isArray(items)&&items.length?`<div class="app-chips">${items.map(x=>`<span class="app-chip">${esc(x)}</span>`).join('')}</div>`:'<span class="muted">No indicado</span>';
  const field=(label,value,full=false)=>`<div class="app-field${full?' full':''}"><small>${esc(label)}</small><span>${value===undefined||value===null||value===''?'No indicado':esc(value)}</span></div>`;
  const bodyContext=async()=>{
    const r=typeof route==='function'?route():(location.hash.replace(/^#/,'')||'/');
    const isAdmin=r.startsWith('/admin');
    const isAgent=r.startsWith('/agent/');
    document.body.classList.toggle('boostr-context-admin',isAdmin);
    document.body.classList.toggle('boostr-context-agent',isAgent&&!isAdmin);
    let bar=document.querySelector('#boostrContextBar');
    if(!isAdmin&&!isAgent){bar?.remove();return}
    if(!bar){bar=document.createElement('div');bar.id='boostrContextBar';document.body.prepend(bar)}
    let sessionText='';
    try{const current=await api('/api/auth/me');if(current?.user){sessionText=`<span class="session-pill">sesión activa · ${esc(current.user.name||current.user.email||'usuario')}</span>`}}catch{}
    bar.innerHTML=`<div class="context-brand"><span>boostr</span><small>${isAdmin?'admin':'agent'}</small></div><div class="context-right">${sessionText}${isAdmin||r.startsWith('/agent/dashboard')?'<a href="#/" class="context-back">volver a boostr</a>':''}</div>`;
  };

  if(typeof baseAdminModule==='function'){
    window.adminModule=async function(m){
      if(m!=='apps') return baseAdminModule(m);
      const h=document.querySelector('#adminMain');
      h.innerHTML='<div class="dashhero">Cargando aplicaciones...</div>';
      const rows=await api('/api/admin/applications');
      const cards=rows.map(x=>{
        const profile=safeJSON(x.devices,{});
        const availability=safeJSON(x.availability,{});
        const origin=profile.origin_country||'';
        const residence=profile.residence_country||x.country||'';
        const status=(x.status||'NEW').toLowerCase();
        const languages=profile.languages||[];
        const channels=profile.channels||[];
        const devices=profile.devices||[];
        const days=profile.days||availability.days||[];
        const industries=profile.industries||[];
        const payments=profile.payment_methods||[];
        return `<article class="admin-app-card">
          <div class="admin-app-top"><div><span class="app-status ${esc(status)}">${esc(x.status||'NEW')}</span><h3>${esc(x.name)}</h3><div class="muted">${esc(x.email||'')} · ${esc(x.whatsapp||'')}</div></div></div>
          <div class="app-profile-grid" style="margin-top:16px">
            ${field('de dónde es',origin)}${field('dónde reside',residence)}${field('ciudad',x.city)}${field('rango de edad',profile.age_range)}
            ${field('instagram',x.instagram)}${field('tiktok',x.tiktok)}
          </div>
          <details class="app-details"><summary>ver aplicación completa ↓</summary>
            <div class="app-detail-section"><h4>idiomas y comunicación</h4><div class="app-profile-grid">
              <div class="app-field full"><small>idiomas</small>${chipList(languages)}</div>${field('nivel de inglés',x.english_level)}${field('otro idioma / detalle',profile.language_notes)}
              <div class="app-field full"><small>canales cómodos</small>${chipList(channels)}</div>${field('llamadas',profile.call_comfort)}${field('videollamadas',profile.video_comfort)}
            </div></div>
            <div class="app-detail-section"><h4>experiencia y herramientas</h4><div class="app-profile-grid">
              ${field('experiencia en ventas',x.sales_experience)}${field('atención al cliente',x.service_experience)}
              <div class="app-field full"><small>dispositivos / setup</small>${chipList(devices)}</div>
            </div></div>
            <div class="app-detail-section"><h4>disponibilidad</h4><div class="app-profile-grid">
              ${field('zona horaria',profile.timezone||availability.timezone)}${field('horas por semana',profile.hours||availability.hours)}${field('puede empezar',profile.start_when||availability.start_when)}${field('horario preferido',profile.daypart||availability.daypart)}
              <div class="app-field full"><small>días disponibles</small>${chipList(days)}</div>${field('meta semanal',profile.weekly_goal)}
            </div></div>
            <div class="app-detail-section"><h4>fit comercial</h4><div class="app-profile-grid">
              <div class="app-field full"><small>industrias</small>${chipList(industries)}</div>${field('motivación',profile.motivation,true)}${field('fortalezas',profile.strengths,true)}
              <div class="app-field full"><small>métodos para recibir pagos</small>${chipList(payments)}</div>
            </div></div>
          </details>
          <div class="app-actions">${x.status==='NEW'?`<button class="btn dark approve-v3" data-id="${esc(x.id)}">aprobar después de entrevista</button>`:x.invite_path?`<button class="btn light copy-v3" data-copy="${esc(location.origin+x.invite_path)}">copiar link de cuenta</button>`:''}<a class="btn light" href="/agent-interview/" target="_blank">abrir panel de entrevista ↗</a></div>
        </article>`;
      }).join('');
      h.innerHTML=`<div class="dashhero"><div class="eyebrow">boostr agent · candidatos</div><h2>conoce a la persona antes de aprobarla.</h2><p>La aplicación completa queda aquí para preparar la entrevista, detectar fortalezas y adaptar el entrenamiento.</p></div><div class="admin-app-grid">${cards||'<div class="adminpanel"><p>No hay aplicaciones todavía.</p></div>'}</div>`;
      document.querySelectorAll('.approve-v3').forEach(b=>b.onclick=async()=>{const r=await api(`/api/admin/applications/${b.dataset.id}/approve`,{method:'POST'});await navigator.clipboard.writeText(location.origin+r.invite_path);alert('Aprobado. Link privado de creación de cuenta copiado.');window.adminModule('apps')});
      document.querySelectorAll('.copy-v3').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy||'');const old=b.textContent;b.textContent='copiado';setTimeout(()=>b.textContent=old,1000)});
    };
  }

  const refreshContext=()=>setTimeout(bodyContext,0);
  window.addEventListener('hashchange',refreshContext);
  window.addEventListener('load',refreshContext);
  refreshContext();
})();
