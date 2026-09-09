(()=>{
  const prevAgent=window.agentModule;
  const prevAdmin=window.adminModule;
  if(typeof prevAgent!=='function') return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const req=async(path,opt={})=>{const r=await fetch(path,{credentials:'include',cache:'no-store',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'No se pudo completar'),{status:r.status});return d};

  function cleanSupportLinks(){
    const side=document.querySelector('#agent .side');if(!side)return;
    const links=[...side.querySelectorAll('a,button')];
    const sup=links.find(x=>x.textContent.trim().toLowerCase()==='supervisora');
    const ceo=links.find(x=>x.textContent.trim().toLowerCase()==='hablar con el fundador');
    if(sup&&ceo&&sup.tagName==='A'&&ceo.tagName==='A'){const a=sup.getAttribute('href'),b=ceo.getAttribute('href');if(a&&b&&a!==b){sup.setAttribute('href',b);ceo.setAttribute('href',a)}}
  }

  function humanizeOverview(host){
    const hero=host.querySelector('.dashhero');if(hero){const p=hero.querySelector('p');if(p)p.textContent='leads, seguimiento y ventas';}
    const cards=[...host.querySelectorAll('.card')];
    cards.forEach(card=>{
      const t=card.textContent.toLowerCase();
      if(t.includes('tu objetivo')){card.querySelector('.eyebrow')?.replaceChildren(document.createTextNode('siguiente paso'));const h=card.querySelector('h2,h3');if(h)h.textContent='lleva la conversación a llamada';const p=card.querySelector('p');if(p)p.textContent='cuando haya interés, agenda la llamada y deja que BOOSTR cierre contigo';}
      if(t.includes('close rate')||t.includes('abre oportunidades')){card.querySelector('.eyebrow')?.replaceChildren(document.createTextNode('lead pool'));const h=card.querySelector('h2,h3');if(h)h.textContent='hasta 10 leads BOOSTR por semana';const p=card.querySelector('p');if(p)p.textContent='tus leads propios no tienen límite';}
      if(t.includes('tu dinero, claro')){const h=card.querySelector('h2,h3');if(h)h.textContent='comisiones';const p=card.querySelector('p');if(p)p.textContent='pendiente · pagado · historial';}
    });
  }

  function humanizeStarter(host){
    const hero=host.querySelector('.dashhero');if(hero){const h=hero.querySelector('h2');if(h)h.textContent='starter kit';const p=hero.querySelector('p');if(p)p.textContent='precios, mensajes y reglas';}
    const msgSection=[...host.querySelectorAll('.card,.adminpanel')].find(x=>x.textContent.toLowerCase().includes('cliente que escribe primero'));
    if(msgSection&&!msgSection.querySelector('.human-sales-guide')){
      const guide=document.createElement('div');guide.className='human-sales-guide';guide.innerHTML=`<div class="human-kicker">iniciar chat · romper el hielo</div><h3>entra como cliente primero</h3><p>busca algo real que falte y pregunta por eso. una página que no aparece, información incompleta, reservas por DM, precios difíciles de encontrar o servicios que no se entienden.</p><div class="human-script-grid">
      ${[
        ['no encuentro su web','hola! estaba buscando el link de su página para ver bien los productos y servicios que ofrecen pero no lo consigo, ¿tienen website?'],
        ['google no explica el negocio','hola! estaba buscando más información sobre ustedes pero google no me muestra mucho, ¿cuántos años llevan trabajando?'],
        ['reservas por mensaje','hola! quería reservar pero no vi un link directo, ¿las reservas las manejan por aquí?'],
        ['precios / servicios poco claros','hola! vi su perfil pero no conseguí una lista clara de servicios y precios, ¿me la pueden enviar?']
      ].map(([t,s])=>`<article><b>${t}</b><p>${s}</p><button class="human-copy" data-copy="${esc(s)}">copiar</button></article>`).join('')}</div>`;
      msgSection.prepend(guide);
      guide.querySelectorAll('.human-copy').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy||'');const o=b.textContent;b.textContent='copiado';setTimeout(()=>b.textContent=o,900)});
    }
  }

  function cleanContent(host){
    [...host.querySelectorAll('article,.card')].forEach(card=>{if(card.textContent.toLowerCase().includes('trabajo remoto latam'))card.remove()});
    const hero=host.querySelector('.dashhero');if(hero){const h=hero.querySelector('h2');if(h)h.textContent='flyers & contenido';const p=hero.querySelector('p');if(p)p.textContent='material oficial listo para publicar';}
  }

  async function renderPool(host){
    host.innerHTML='<div class="dashhero"><div class="eyebrow">lead pool</div><h2>oportunidades BOOSTR</h2></div><div class="adminpanel">cargando...</div>';
    try{
      const [rows,requests]=await Promise.all([req('/api/agent-os/agent/pool'),req('/api/agent-os/agent/lead-requests').catch(()=>[])]);
      const map=new Map(requests.map(x=>[x.lead_id,x.status]));
      host.innerHTML=`<div class="dashhero human-compact"><div class="eyebrow">lead pool</div><h2>oportunidades BOOSTR</h2><p>solicita el lead. BOOSTR aprueba antes de liberar la información de contacto.</p></div><div class="human-lead-grid">${rows.length?rows.map(x=>{const st=map.get(x.id);return `<article class="human-lead"><div class="human-lead-top"><span>${esc(x.temperature||'')}</span><small>${esc([x.city,x.country].filter(Boolean).join(', '))}</small></div><h3>${esc(x.business_name)}</h3><p>${esc(x.industry||'')}</p>${x.opportunity_summary?`<div class="human-opportunity">${esc(x.opportunity_summary)}</div>`:''}<button class="btn dark request-lead" data-id="${esc(x.id)}" ${st?'disabled':''}>${st==='PENDING'?'solicitud pendiente':st==='APPROVED'?'aprobado':st==='REJECTED'?'solicitar de nuevo':'solicitar lead'}</button></article>`}).join(''):'<div class="adminpanel">no hay leads disponibles ahora mismo</div>'}</div>`;
      host.querySelectorAll('.request-lead:not([disabled])').forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent='enviando...';try{await req('/api/agent-os/agent/lead-requests',{method:'POST',body:JSON.stringify({lead_id:b.dataset.id})});b.textContent='solicitud pendiente'}catch(e){b.disabled=false;b.textContent='solicitar lead';alert(e.message)}});
    }catch(e){
      if(e.status===403)host.innerHTML=`<div class="dashhero human-compact"><div class="eyebrow">lead pool</div><h2>acceso pendiente</h2><p>${esc(e.message)}</p></div>`;
      else host.innerHTML=`<div class="dashhero human-compact"><div class="eyebrow">lead pool</div><h2>no pudimos cargar los leads</h2><button class="btn light" id="retryPool">reintentar</button></div>`;
      host.querySelector('#retryPool')?.addEventListener('click',()=>renderPool(host));
    }
  }

  function enhanceProfile(host){
    const hero=host.querySelector('.dashhero');if(hero){const p=hero.querySelector('p');if(p)p.remove();}
    const pinCard=[...host.querySelectorAll('.card,.adminpanel')].find(x=>x.textContent.toLowerCase().includes('pin de acceso'));
    if(pinCard&&!host.querySelector('.profile-photo-card')){
      const card=document.createElement('section');card.className='card full profile-photo-card';card.innerHTML='<div class="eyebrow">foto de perfil</div><h3>foto profesional</h3><p>rostro visible, buena luz y fondo limpio. esta será la foto de tu credencial pública.</p><div class="profile-photo-row"><div class="profile-photo-preview">foto</div><label class="btn light">seleccionar foto<input id="agentPhotoFile" type="file" accept="image/*" hidden></label></div><small>la carga permanente se habilitará junto con la credencial pública</small>';
      pinCard.before(card);
      card.querySelector('#agentPhotoFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);const p=card.querySelector('.profile-photo-preview');p.style.backgroundImage=`url(${url})`;p.textContent='';};
    }
  }

  window.agentModule=async function(m){
    const host=document.querySelector('#agentMain');
    if(m==='pool'&&host){await renderPool(host);cleanSupportLinks();return;}
    await prevAgent(m);
    if(!host)return;
    if(m==='overview')humanizeOverview(host);
    if(m==='starter')humanizeStarter(host);
    if(m==='content')cleanContent(host);
    if(m==='profile')enhanceProfile(host);
    cleanSupportLinks();
  };

  if(typeof prevAdmin==='function')window.adminModule=async function(m){
    await prevAdmin(m);
    if(m!=='pool')return;
    const host=document.querySelector('#adminMain');if(!host||host.querySelector('#leadRequestQueue'))return;
    let rows=[];try{rows=await req('/api/agent-os/admin/lead-requests')}catch{return}
    const pending=rows.filter(x=>x.status==='PENDING');
    const box=document.createElement('section');box.id='leadRequestQueue';box.className='adminpanel human-request-queue';box.innerHTML=`<div class="panel-title"><div><div class="eyebrow">solicitudes</div><h3>acceso a leads</h3></div><b>${pending.length} pendientes</b></div>${pending.length?pending.map(x=>`<article class="human-request"><div><b>${esc(x.agent_name||x.agent_email||'agente')}</b><span>${esc(x.business_name||'lead')}</span><small>${esc([x.city,x.country].filter(Boolean).join(', '))}</small></div><div><button class="btn dark lr-action" data-id="${esc(x.id)}" data-action="APPROVE">aprobar</button><button class="btn light lr-action" data-id="${esc(x.id)}" data-action="REJECT">rechazar</button></div></article>`).join(''):'<p>sin solicitudes pendientes</p>'}`;
    host.prepend(box);
    box.querySelectorAll('.lr-action').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await req('/api/agent-os/admin/lead-requests',{method:'POST',body:JSON.stringify({request_id:b.dataset.id,action:b.dataset.action})});window.adminModule('pool')}catch(e){alert(e.message);b.disabled=false}});
  };
})();