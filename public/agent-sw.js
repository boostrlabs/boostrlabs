const CACHE='boostr-agent-v1';
const SHELL=[
  '/',
  '/assets/agent-os/styles.css',
  '/assets/agent-os/mobile.css',
  '/assets/agent-os/app.js?v=login-fix-1',
  '/assets/logos/boostr-logo-nav.png',
  '/assets/icons/09.-b-star-favicon.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  if(url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(req).then(res=>{
    const copy=res.clone();
    caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
    return res;
  }).catch(()=>caches.match(req).then(hit=>hit||caches.match('/'))));
});
