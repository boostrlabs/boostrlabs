(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const MARK='[BOOSTR_HIGH_POTENTIAL]';
const URLMARK='[PREVIEW_URL]';
const stripMeta=s=>String(s||'').replace(/\[BOOSTR_HIGH_POTENTIAL\]\s*/g,'').replace(/\[PREVIEW_URL\]\s*https?:\/\/\S+\s*/g,'').trim();
const previewUrl=s=>{const m=String(s||'').match(/\[PREVIEW_URL\]\s*(https?:\/\/\S+)/i);return m?m[1]:''};
const isHigh=s=>String(s||'').includes(MARK);

function addAdminFields(){
 const form=document.querySelector('#poolForm');if(!form||form.dataset.previewV8)return;form.dataset.previewV8='1';
 const opportunity=form.querySelector('textarea[name="opportunity_summary"]')?.closest('label');if(!opportunity)return;
 const box=document.createElement('section');box.className='preview-lead-v8';box.innerHTML=`
   <div class="preview-toggle-v8"><div><small>⭐ lead especial</small><h3>alto potencial + demo adelantado</h3><p>Úsalo cuando BOOSTR ya preparó una muestra visual del negocio para ayudar al agente a romper el hielo y cerrar.</p></div><label class="switch-v8"><input type="checkbox" name="high_potential"><span></span></label></div>
   <div class="preview-fields-v8" hidden>
    <label>🔗 link del demo<input name="preview_url" type="url" placeholder="https://..." autocomplete="off"></label>
    <label>📝 qué queremos demostrar<textarea name="preview_context" placeholder="Ej. reorganizamos el menú, mejoramos las fotos y simplificamos el flujo de pedido"></textarea></label>
    <div class="trust-note-v8"><b>primero confianza, después link.</b><p>El agente no debe mandar un enlace desconocido en el primer mensaje. Primero se presenta como agente oficial, ofrece su QR/credencial BOOSTR y pregunta si la persona quiere ver el demo.</p></div>
   </div>`;
 opportunity.before(box);
 const toggle=box.querySelector('input[name="high_potential"]'),fields=box.querySelector('.preview-fields-v8');
 toggle.onchange=()=>{fields.hidden=!toggle.checked};
}

document.addEventListener('submit',e=>{
 const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='poolForm')return;
 const high=form.querySelector('[name="high_potential"]')?.checked;if(!high)return;
 const url=String(form.querySelector('[name="preview_url"]')?.value||'').trim();
 if(!/^https:\/\//i.test(url)){e.preventDefault();e.stopImmediatePropagation();alert('Agrega un link https válido para el demo.');return}
 const context=String(form.querySelector('[name="preview_context"]')?.value||'').trim();
 const opp=form.querySelector('[name="opportunity_summary"]');
 const opener=form.querySelector('[name="recommended_opener"]');
 const closing=form.querySelector('[name="closing_notes"]');
 const baseOpp=stripMeta(opp?.value||'');
 if(opp)opp.value=`${MARK}\n${URLMARK} ${url}\n${context?`Demo preparado por BOOSTR: ${context}\n`:''}${baseOpp}`.trim();
 const trust=`hola! soy agente oficial de BOOSTR LATAM. estuve revisando su negocio y vimos una oportunidad clara para mejorar cómo se presenta online. antes de enviarle ningún enlace, si quiere puede verificar mi perfil oficial de BOOSTR con mi QR/credencial. nuestro equipo incluso preparó una muestra visual, sin compromiso, de cómo podría verse su negocio. ¿le gustaría verla?`;
 const existing=String(opener?.value||'').trim();if(opener&&!existing)opener.value=trust;
 if(closing)closing.value=`DEMO ADELANTADO · IMPORTANTE: no mandar el link de entrada. primero presentarse, ofrecer la credencial oficial BOOSTR y pedir permiso para compartir el demo. si la persona acepta, enviar: “perfecto, este es el demo que preparamos para su negocio: ${url}”${closing.value?`\n\n${closing.value}`:''}`;
},true);

function decorateAdminCards(){
 document.querySelectorAll('.admin-lead-card').forEach(card=>{
  if(card.dataset.previewV8)return;const sum=card.querySelector('.lead-summary');if(!sum||!isHigh(sum.textContent))return;card.dataset.previewV8='1';const raw=sum.textContent,url=previewUrl(raw);sum.textContent=stripMeta(raw);
  const top=card.querySelector('.lead-card-top');if(top){const b=document.createElement('span');b.className='high-badge-v8';b.textContent='⭐ alto potencial';top.appendChild(b)}
  if(url){const box=document.createElement('div');box.className='preview-tool-v8';box.innerHTML=`<div><small>🎨 demo adelantado</small><b>preview listo para ayudar a cerrar</b><p>El agente debe construir confianza antes de compartir este enlace.</p></div><a href="${esc(url)}" target="_blank" rel="noopener">abrir demo ↗</a>`;sum.after(box)}
 });
}

function decorateAgentCards(){
 const host=document.querySelector('#agentMain');if(!host)return;
 host.querySelectorAll('.leadcard').forEach(card=>{
  if(card.dataset.previewV8)return;const ps=[...card.querySelectorAll('p')];const p=ps.find(x=>isHigh(x.textContent));if(!p)return;card.dataset.previewV8='1';const raw=p.textContent,url=previewUrl(raw);p.textContent=stripMeta(raw);
  const badge=document.createElement('div');badge.className='agent-high-v8';badge.innerHTML=`<span>⭐ lead de alto potencial</span><b>BOOSTR ya preparó un demo para este negocio.</b>`;card.querySelector('h3')?.before(badge);
  if(url){const tool=document.createElement('div');tool.className='agent-preview-v8';tool.innerHTML=`<small>🎨 herramienta de cierre</small><h4>no empieces mandando el link.</h4><p>Primero preséntate, explica que eres agente oficial de BOOSTR y ofrece tu credencial/QR. Después pregunta si quiere ver la muestra que preparamos.</p><div class="preview-actions-v8"><button type="button" data-trust>copiar rompehielo</button><a href="${esc(url)}" target="_blank" rel="noopener">ver demo ↗</a></div>`;p.after(tool);
   tool.querySelector('[data-trust]').onclick=async()=>{const text='hola! soy agente oficial de BOOSTR LATAM. estuve revisando su negocio y vimos una oportunidad clara para mejorar cómo se presenta online. antes de enviarle ningún enlace, si quiere puede verificar mi perfil oficial de BOOSTR con mi QR/credencial. nuestro equipo incluso preparó una muestra visual, sin compromiso, de cómo podría verse su negocio. ¿le gustaría verla?';await navigator.clipboard.writeText(text);tool.querySelector('[data-trust]').textContent='copiado ✓'};
  }
 });
}

const previousAgent=window.agentModule;
if(typeof previousAgent==='function') window.agentModule=async function(m){await previousAgent(m);requestAnimationFrame(()=>decorateAgentCards())};

const previousAdmin=window.adminModule;
if(typeof previousAdmin==='function') window.adminModule=async function(m){await previousAdmin(m);if(m==='pool')requestAnimationFrame(()=>{addAdminFields();decorateAdminCards()})};

window.addEventListener('hashchange',()=>{
  const r=location.hash.replace(/^#/,'');
  if(r.startsWith('/admin')) setTimeout(()=>{addAdminFields();decorateAdminCards()},60);
  if(r.startsWith('/agent/')) setTimeout(decorateAgentCards,60);
});
setTimeout(()=>{addAdminFields();decorateAdminCards();decorateAgentCards()},200);
})();