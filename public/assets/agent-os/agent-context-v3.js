(function(){
  const originalHeader=document.querySelector('.topin');
  if(!originalHeader)return;
  const publicHeaderHTML=originalHeader.innerHTML;
  let lastContext='';
  let sessionCache=null;
  let sessionAt=0;
  let applying=false;

  async function getSession(force=false){
    const now=Date.now();
    if(!force&&now-sessionAt<15000)return sessionCache;
    try{
      const r=await fetch('/api/agent-os/auth/me',{credentials:'include',cache:'no-store'});
      sessionCache=r.ok?(await r.json()).user||null:null;
    }catch{sessionCache=null}
    sessionAt=now;
    return sessionCache;
  }

  function route(){return location.hash.replace(/^#/,'')||'/'}
  function contextForRoute(){const r=route();if(r.startsWith('/admin'))return'admin';if(r.startsWith('/agent/'))return'agent';return''}
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));}

  async function applyContext(force=false){
    if(applying)return;
    applying=true;
    try{
      const ctx=contextForRoute();
      document.body.classList.toggle('agent-context',!!ctx);
      if(!ctx){
        if(lastContext)originalHeader.innerHTML=publicHeaderHTML;
        document.body.classList.remove('logged-in');
        lastContext='';
        return;
      }

      const user=await getSession(force);
      document.body.classList.toggle('logged-in',!!user);
      const r=route();

      if(r.startsWith('/agent/login')&&user){
        location.hash=user.role==='ADMIN'?'#/admin':'#/agent/dashboard';
        return;
      }
      if(r.startsWith('/admin')&&user&&user.role!=='ADMIN'){
        location.hash='#/agent/dashboard';
        return;
      }

      const label=ctx==='admin'?'boostr admin':'boostr agent';
      const userText=user?(user.name||user.email||user.role):'acceso';
      originalHeader.innerHTML=`<a class="logo logoasset" href="${ctx==='admin'?'#/admin':'#/agent/dashboard'}"><img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs"><span class="logofallback" style="display:none">boostr<small>labs</small></span></a><div class="actions" style="margin:0"><span class="context-badge">${label}</span>${user?`<span class="context-user">sesión activa · ${escapeHtml(userText)}</span>`:`<a class="context-back" href="#/">volver a boostr</a>`}</div>`;
      lastContext=ctx;

      // Repair mismatched protected view once, without observers or polling.
      if(ctx==='admin'&&user?.role==='ADMIN'&&!document.querySelector('#admin.active')){
        if(typeof window.admin==='function')await window.admin();
      }
      if(ctx==='agent'&&user?.role!=='ADMIN'&&r.startsWith('/agent/dashboard')&&!document.querySelector('#agent.active')){
        if(typeof window.agent==='function')await window.agent();
      }
    }finally{applying=false}
  }

  window.addEventListener('hashchange',()=>requestAnimationFrame(()=>applyContext(false)));
  window.addEventListener('pageshow',()=>applyContext(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyContext(true)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>applyContext(true),{once:true});else applyContext(true);
})();