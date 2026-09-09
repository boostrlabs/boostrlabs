const CACHE='boostr-agent-v12';
const STATIC_PREFIXES=['/assets/agent-os/','/assets/logos/','/assets/icons/'];

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('boostr-agent-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'||url.pathname==='/'||url.pathname.startsWith('/api/'))return;
  if(!STATIC_PREFIXES.some(prefix=>url.pathname.startsWith(prefix)))return;

  event.respondWith(
    fetch(req).then(res=>{
      if(res&&res.ok){
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
      }
      return res;
    }).catch(async()=>{
      const hit=await caches.match(req);
      return hit||Response.error();
    })
  );
});