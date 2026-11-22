// Keeps the app on the phone so it opens with no signal.
var CACHE='fcs-load-check-86b0ca34';
var SHELL=['./','index.html','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var url=new URL(r.url), font=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(/version\.txt$/.test(url.pathname)) return;
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
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus();}if(self.clients.openWindow)return self.clients.openWindow('./');}));
});
