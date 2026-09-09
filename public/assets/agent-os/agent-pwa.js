(()=>{
  const isAgentRoute=()=>location.hash.startsWith('#/agent')||location.hash.startsWith('#/admin');
  let deferredPrompt=null;

  function ensureMeta(name,content){
    let el=document.querySelector(`meta[name="${name}"][data-agent-pwa]`);
    if(!el){el=document.createElement('meta');el.name=name;el.dataset.agentPwa='1';document.head.appendChild(el);}
    el.content=content;
  }

  function enable(){
    if(!document.querySelector('link[rel="manifest"][data-agent-pwa]')){
      const link=document.createElement('link');
      link.rel='manifest';link.href='/agent-manifest.webmanifest';link.dataset.agentPwa='1';document.head.appendChild(link);
    }
    ensureMeta('theme-color','#ffffff');
    ensureMeta('apple-mobile-web-app-capable','yes');
    ensureMeta('apple-mobile-web-app-status-bar-style','default');
    ensureMeta('apple-mobile-web-app-title','BOOSTR Agent');
    if('serviceWorker' in navigator){navigator.serviceWorker.register('/agent-sw.js',{scope:'/'}).catch(()=>{});}
    document.documentElement.dataset.agentWebapp='1';
  }

  function disableManifest(){
    document.querySelectorAll('link[data-agent-pwa],meta[data-agent-pwa]').forEach(el=>el.remove());
    delete document.documentElement.dataset.agentWebapp;
  }

  function sync(){isAgentRoute()?enable():disableManifest();}
  addEventListener('hashchange',sync);
  addEventListener('DOMContentLoaded',sync);
  addEventListener('beforeinstallprompt',event=>{if(!isAgentRoute())return;event.preventDefault();deferredPrompt=event;window.BOOSTRAgentInstall=async()=>{if(!deferredPrompt)return false;deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;return choice.outcome==='accepted';};});
  sync();
})();
