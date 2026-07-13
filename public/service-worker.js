const CACHE_VERSION = 'boostr-pwa-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/pwa.css',
  '/assets/boostr-entry/entry.css?v=1.1.0',
  '/assets/boostr-entry/entry.js?v=1.1.0',
  '/assets/icons/09.-b-star-favicon.png',
  '/assets/logos/boostr-logo-nav.png'
];
const SENSITIVE_PREFIXES = [
  '/api/', '/functions/', '/login', '/admin', '/manager', '/partner-dashboard',
  '/app', '/pay', '/checkout', '/orders', '/leads', '/accept-invite'
];
function isSensitiveRequest(request,url){if(SENSITIVE_PREFIXES.some(prefix=>url.pathname.startsWith(prefix)))return true;if(url.searchParams.has('pin')||url.searchParams.has('token'))return true;if(request.headers.has('authorization')||request.headers.has('x-manager-pin'))return true;return false}
function isStaticAsset(request,url){if(!url.pathname.startsWith('/assets/')&&!['/pwa.css','/pwa-register.js'].includes(url.pathname))return false;return['style','script','image','font'].includes(request.destination)}
async function networkFirst(request,cacheName){const cache=await caches.open(cacheName);try{const response=await fetch(request);const cacheControl=response.headers.get('cache-control')||'';if(response.ok&&response.type==='basic'&&!cacheControl.toLowerCase().includes('no-store'))await cache.put(request,response.clone());return response}catch(error){const cached=await cache.match(request);if(cached)return cached;throw error}}
self.addEventListener('install',event=>{event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(PRECACHE_URLS)))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('boostr-pwa-')&&key!==STATIC_CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(isSensitiveRequest(request,url)){event.respondWith(fetch(request));return}if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await (await caches.open(STATIC_CACHE)).match(OFFLINE_URL)));return}if(isStaticAsset(request,url))event.respondWith(networkFirst(request,STATIC_CACHE))});
