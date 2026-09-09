(function(){
  const baseAgentModule = window.agentModule;
  const baseAdminModule = window.adminModule;

  const tempLabel = t => ({FRIO:'❄️ Frío',TIBIO:'🌤️ Tibio',CALIENTE:'🔥 Caliente'}[t] || t || 'Sin temperatura');
  const statusLabel = s => ({AVAILABLE:'Disponible',CLAIMED:'Tomado',CONTACTED:'Contactado',CLOSED:'Cerrado'}[s] || s || 'Disponible');

  if(typeof baseAgentModule === 'function'){
    window.agentModule = async function(m){
      await baseAgentModule(m);
      const host = document.querySelector('#agentMain');
      if(!host) return;

      if(m==='overview'){
        const hero = host.querySelector('.dashhero');
        if(hero && !hero.querySelector('.security-shortcut')){
          const box = document.createElement('div');
          box.className='security-shortcut';
          box.innerHTML='<div><span class="security-kicker">ACCESO RÁPIDO</span><strong>Configura tu PIN de 6 dígitos</strong><p>Después podrás entrar a BOOSTR Agent con tu email + PIN.</p></div><button class="btn light" id="goPin">Configurar PIN</button>';
          hero.appendChild(box);
          box.querySelector('#goPin').onclick=()=>{
            document.querySelectorAll('.side button[data-m]').forEach(x=>x.classList.toggle('active',x.dataset.m==='profile'));
            window.agentModule('profile');
          };
        }
      }

      if(m==='profile'){
        const hero=host.querySelector('.dashhero');
        if(hero){
          hero.classList.add('security-hero');
          hero.querySelector('.eyebrow')?.replaceChildren(document.createTextNode('Seguridad · acceso'));
          const h2=hero.querySelector('h2'); if(h2) h2.textContent='Contraseña + PIN';
          const p=hero.querySelector('p'); if(p) p.textContent='Tu PIN es opcional, pero te permite entrar mucho más rápido desde tu teléfono.';
        }
        const card=host.querySelector('.card.full');
        if(card){
          card.classList.add('pin-card');
          const title=card.querySelector('h3'); if(title) title.textContent='Configurar o cambiar PIN de 6 dígitos';
          const input=card.querySelector('input[name="pin"]');
          if(input){input.setAttribute('autocomplete','one-time-code');input.setAttribute('placeholder','••••••');input.setAttribute('aria-label','PIN de 6 dígitos');}
        }
      }
    };
  }

  if(typeof baseAdminModule === 'function'){
    window.adminModule = async function(m){
      if(m!=='pool') return baseAdminModule(m);
      const h=document.querySelector('#adminMain');
      h.innerHTML='<div class="dashhero">Cargando Lead Pool...</div>';
      const rows=await api('/api/admin/pool');
      const available=rows.filter(x=>x.status==='AVAILABLE').length;
      const claimed=rows.filter(x=>x.status!=='AVAILABLE').length;
      const hot=rows.filter(x=>x.temperature==='CALIENTE').length;
      const warm=rows.filter(x=>x.temperature==='TIBIO').length;
      const cold=rows.filter(x=>x.temperature==='FRIO').length;

      const cards = rows.length ? rows.map(x=>`<article class="admin-lead-card ${esc((x.temperature||'FRIO').toLowerCase())}">
        <div class="lead-card-top"><span class="temp ${esc(x.temperature||'FRIO')}">${tempLabel(x.temperature)}</span><span class="lead-status ${esc((x.status||'AVAILABLE').toLowerCase())}">${statusLabel(x.status)}</span></div>
        <h3>${esc(x.business_name)}</h3>
        <p class="lead-meta">${esc(x.industry||'Industria no indicada')} · ${esc([x.city,x.country].filter(Boolean).join(', ')||'Ubicación pendiente')}</p>
        <div class="lead-product"><span>Producto recomendado</span><b>${esc(x.suggested_product||'Oportunidad BOOSTR')}</b></div>
        ${x.opportunity_summary?`<p class="lead-summary">${esc(x.opportunity_summary)}</p>`:''}
        <div class="lead-contact-grid">
          ${x.contact_name?`<span><small>Contacto</small>${esc(x.contact_name)}${x.contact_role?` · ${esc(x.contact_role)}`:''}</span>`:''}
          ${x.preferred_channel?`<span><small>Mejor canal</small>${esc(x.preferred_channel)}</span>`:''}
          ${x.phone||x.whatsapp?`<span><small>Teléfono / WhatsApp</small>${esc(x.whatsapp||x.phone)}</span>`:''}
          ${x.instagram?`<span><small>Instagram</small>${esc(x.instagram)}</span>`:''}
        </div>
        ${x.recommended_opener?`<details><summary>Rompehielo sugerido</summary><p>${esc(x.recommended_opener)}</p></details>`:''}
        ${x.closing_notes?`<details><summary>Notas para cerrar</summary><p>${esc(x.closing_notes)}</p></details>`:''}
      </article>`).join('') : '<div class="adminpanel"><h3>No hay leads todavía.</h3><p>Usa “Agregar lead” para cargar la primera oportunidad.</p></div>';

      h.innerHTML=`<div class="dashhero leadpool-hero"><div class="eyebrow">BOOSTR Lead Pool</div><h2 style="font-size:52px">Oportunidades listas para repartir.</h2><p>Primero ves el inventario actual. Agregar un nuevo lead es una acción aparte.</p>
        <div class="leadpool-stats"><div><b>${rows.length}</b><span>Total</span></div><div><b>${available}</b><span>Disponibles</span></div><div><b>${claimed}</b><span>Tomados</span></div><div><b>${hot}</b><span>🔥 Calientes</span></div></div>
      </div>
      <div class="pool-tabs"><button class="pool-tab active" data-view="list">Lead Pool <span>${rows.length}</span></button><button class="pool-tab" data-view="add">+ Agregar lead</button></div>
      <section id="poolListView" class="pool-view active">
        <div class="pool-toolbar"><div><b>${available} disponibles</b><span> · ❄️ ${cold} · 🌤️ ${warm} · 🔥 ${hot}</span></div><input id="poolSearch" type="search" placeholder="Buscar negocio, ciudad, industria..."></div>
        <div class="admin-lead-grid" id="adminLeadGrid">${cards}</div>
      </section>
      <section id="poolAddView" class="pool-view">
        <div class="adminpanel add-lead-panel"><div class="panel-title"><div><div class="eyebrow">Nuevo lead</div><h3>Agregar oportunidad a BOOSTR</h3></div><p>Mientras más contexto agregues, menos improvisa el agente.</p></div>
        <form id="poolForm" class="formgrid">
          <label>Negocio<input name="business_name" required></label><label>Temperatura<select name="temperature"><option>FRIO</option><option>TIBIO</option><option>CALIENTE</option></select></label>
          <label>Industria<input name="industry"></label><label>Producto recomendado<select name="suggested_product">${catalog.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
          <label>Contacto<input name="contact_name"></label><label>Cargo<input name="contact_role"></label><label>Teléfono<input name="phone"></label><label>WhatsApp<input name="whatsapp"></label>
          <label>Instagram<input name="instagram"></label><label>Facebook URL<input name="facebook"></label><label>Email<input name="email"></label><label>Website<input name="website"></label>
          <label>Ciudad<input name="city"></label><label>País<input name="country"></label><label>Idioma<input name="language"></label><label>Mejor canal<input name="preferred_channel" placeholder="WhatsApp / llamada / IG..."></label>
          <label style="grid-column:1/-1">Oportunidad<textarea name="opportunity_summary" placeholder="Qué detectamos y por qué puede comprar"></textarea></label>
          <label style="grid-column:1/-1">Rompehielo recomendado<textarea name="recommended_opener" placeholder="Mensaje inicial recomendado para este negocio"></textarea></label>
          <label style="grid-column:1/-1">Notas para cerrar<textarea name="closing_notes" placeholder="Objeciones probables, presupuesto, detalles importantes..."></textarea></label>
          <button class="btn dark" style="grid-column:1/-1">Agregar a la piscina</button>
        </form></div>
      </section>`;

      document.querySelectorAll('.pool-tab').forEach(btn=>btn.onclick=()=>{
        document.querySelectorAll('.pool-tab').forEach(x=>x.classList.toggle('active',x===btn));
        document.querySelector('#poolListView').classList.toggle('active',btn.dataset.view==='list');
        document.querySelector('#poolAddView').classList.toggle('active',btn.dataset.view==='add');
      });
      const search=document.querySelector('#poolSearch');
      if(search) search.oninput=()=>{
        const q=search.value.toLowerCase().trim();
        document.querySelectorAll('.admin-lead-card').forEach(card=>card.style.display=card.textContent.toLowerCase().includes(q)?'':'none');
      };
      document.querySelector('#poolForm').onsubmit=async e=>{
        e.preventDefault();
        const btn=e.target.querySelector('button'); btn.disabled=true; btn.textContent='Agregando...';
        try{await api('/api/admin/pool',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});window.adminModule('pool');}
        catch(err){alert(err.message);btn.disabled=false;btn.textContent='Agregar a la piscina';}
      };
    };
  }
})();