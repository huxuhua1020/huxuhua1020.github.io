var CACHE = 'liaotai-v2';
var ASSETS = ['./icon-192.png', './icon-512.png', './manifest.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var req = e.request;
  var isHTML = (req.mode === 'navigate') || ((req.headers.get('accept') || '').indexOf('text/html') >= 0);
  if (isHTML) {
    // HTML 始终优先联网，保证更新即时生效
    e.respondWith(
      fetch(req).then(function (resp) {
        var cp = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }
  // 其他静态资源：缓存优先
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (resp) {
        var cp = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return resp;
      });
    })
  );
});
