const C='gymlog-v4';
const F=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const timeout=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  if(req.mode==='navigate'){
    // network first (so updates show on the next open), cache when offline or slow
    e.respondWith(timeout(fetch(req,{cache:'no-store'}),3500).then(r=>{
      if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp))}
      return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>null);
    return hit||(await net)||(await c.match('./index.html'));
  }));
});
