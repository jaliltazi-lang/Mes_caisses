// Mes dépenses : garde l'appli dans le téléphone pour qu'elle s'ouvre sans réseau.
// Changez le numéro de version à chaque mise à jour des fichiers.
var VERSION = 'mes-depenses-v6';
var FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  // Les échanges avec le Google Sheet passent toujours par le réseau.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Fichiers de l'appli : réseau si possible (pour avoir la dernière version), sinon copie du téléphone.
  e.respondWith(
    fetch(req).then(function (rep) {
      if (rep && rep.ok) {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
