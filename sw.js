const VERSION='ly10-v4';
const CORE=`${VERSION}-core`;
const RUNTIME=`${VERSION}-runtime`;
const IMAGE_CACHE=`${VERSION}-images`;
const BASE=new URL('./',self.location.href).pathname;
const coreFiles=['./','./index.html','./style.css','./extras.css','./pro.css','./app.css','./living.css','./refactor.css','./script.js','./pro.js','./data.js','./app.js','./data-service.js','./site.webmanifest','./favicon.svg','./404.html'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CORE);
    await Promise.allSettled(coreFiles.map(file=>cache.add(new Request(file,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep=new Set([CORE,RUNTIME,IMAGE_CACHE]);
    await Promise.all((await caches.keys()).filter(k=>!keep.has(k)).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

const networkWithTimeout=async(request,ms=4500)=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{return await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}
};

const networkFirst=async request=>{
  const cache=await caches.open(RUNTIME);
  try{
    const response=await networkWithTimeout(request);
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request)) || (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
  }
};

const staleWhileRevalidate=async request=>{
  const cache=await caches.open(RUNTIME);
  const cached=await cache.match(request);
  const refresh=fetch(request).then(response=>{
    if(response&&(response.ok||response.type==='opaque'))cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || refresh || Response.error();
};

const cacheImage=async request=>{
  const cache=await caches.open(IMAGE_CACHE);
  const cached=await cache.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response&&(response.ok||response.type==='opaque'))cache.put(request,response.clone());
    return response;
  }catch{return Response.error()}
};

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request));
    return;
  }
  if(request.destination==='image'){
    event.respondWith(cacheImage(request));
    return;
  }
  if(url.origin===self.location.origin && ['style','script','manifest','font'].includes(request.destination)){
    event.respondWith(staleWhileRevalidate(request));
  }
});
