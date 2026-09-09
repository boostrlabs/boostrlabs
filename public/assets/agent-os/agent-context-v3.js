(function(){
  const $=s=>document.querySelector(s);
  const originalHeader=$('.topin');
  if(!originalHeader)return;
  const publicHeaderHTML=originalHeader.innerHTML;
  let lastContext='';

  async function getSession(){
    try{
      const r=await fetch('/api/agent-os/auth/me',{credentials:'include'});
      if(!r.ok)return null;
      const d=await r.json();
      return d&&d.user?d.user:null;
    }catch{return null}
  }

  function contextForRoute(){
    const r=location.hash.replace(/^#/,'')||'/';
    if(r.startsWith('/admin'))return 'admin';
    if(r.startsWith('/agent/'))return 'agent';
    return '';
  }

  async function applyContext(){
    const ctx=contextForRoute();
    document.body.classList.toggle('agent-context',!!ctx);
    if(!ctx){
      if(lastContext){originalHeader.innerHTML=publicHeaderHTML;}
      document.body.classList.remove('logged-in');
      lastContext='';
      return;
    }
    const user=await getSession();
    document.body.classList.toggle('logged-in',!!user);

    if(ctx==='agent' && location.hash.startsWith('#/agent/login') && user){
      location.hash=user.role==='ADMIN'?'#/admin':'#/agent/dashboard';
      return;
    }

    const label=ctx==='admin'?'boostr admin':'boostr agent';
    const userText=user?(user.name||user.email||user.role):'acceso';
    originalHeader.innerHTML=`
      <a class="logo logoasset" href="${ctx==='admin'?'#/admin':'#/agent/dashboard'}"><img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs"><span class="logofallback" style="display:none">boostr<small>labs</small></span></a>
      <div class="actions" style="margin:0">
        <span class="context-badge">${label}</span>
        ${user?`<span class="context-user">sesión activa · ${escapeHtml(userText)}</span>`:`<a class="context-back" href="#/">volver a boostr</a>`}
      </div>`;
    lastContext=ctx;
  }

  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  window.addEventListener('hashchange',()=>setTimeout(applyContext,0));
  window.addEventListener('pageshow',applyContext);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyContext()});
  setTimeout(applyContext,0);
})();
