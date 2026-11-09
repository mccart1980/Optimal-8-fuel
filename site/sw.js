// Keeps the app on the phone so it opens with no signal. Shows the saved copy straight away
// and quietly fetches any new version for next time.
var CACHE='fcs-load-check-0b81ca14d3';
var SHELL=['./','index.html','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var url=new URL(r.url), font=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(url.origin!==location.origin&&!font) return;
  var key=r.mode==='navigate'?'./':r;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(key,{ignoreSearch:true}).then(function(hit){
      var net=fetch(r).then(function(res){if(res&&(res.ok||res.type==='opaque'))c.put(key,res.clone());return res;});
      if(hit){e.waitUntil(net.catch(function(){}));return hit;}
      return net;
    });
  }));
});
