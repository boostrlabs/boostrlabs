(()=>{
  const isAgentRoute=()=>location.hash.startsWith('#/agent');
  let deferredPrompt=null;
  let registrationStarted=false;

  function ensureMeta(name,content){
    let el=document.querySelector(`meta[name="${name}"][data-agent-pwa]`);
    if(!el){el=document.createElement('meta');el.name=name;el.dataset.agentPwa='1';document.head.appendChild(el);}
    el.content=content;
  }

  function ensureManifest(){
    if(document.querySelector('link[rel="manifest"][data-agent-pwa]'))return;
    const link=document.createElement('link');
    link.rel='manifest';link.href='/agent-manifest.webmanifest';link.dataset.agentPwa='1';document.head.appendChild(link);
  }

  function registerWorkerOnce(){
    if(registrationStarted||!('serviceWorker' in navigator))return;
    registrationStarted=true;
    navigator.serviceWorker.register('/agent-sw.js',{scope:'/'}).catch(()=>{registrationStarted=false});
  }

  function enable(){
    ensureManifest();
    ensureMeta('theme-color','#ffffff');
    ensureMeta('apple-mobile-web-app-capable','yes');
    ensureMeta('apple-mobile-web-app-status-bar-style','default');
    ensureMeta('apple-mobile-web-app-title','BOOSTR Agent');
    registerWorkerOnce();
    document.documentElement.dataset.agentWebapp='1';
  }

  function disable(){
    document.querySelectorAll('link[data-agent-pwa],meta[data-agent-pwa]').forEach(el=>el.remove());
    delete document.documentElement.dataset.agentWebapp;
  }

  function sync(){isAgentRoute()?enable():disable();}
  addEventListener('hashchange',sync);
  addEventListener('beforeinstallprompt',event=>{
    if(!isAgentRoute())return;
    event.preventDefault();
    deferredPrompt=event;
    window.BOOSTRAgentInstall=async()=>{
      if(!deferredPrompt)return false;
      deferredPrompt.prompt();
      const choice=await deferredPrompt.userChoice;
      deferredPrompt=null;
      return choice.outcome==='accepted';
    };
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();