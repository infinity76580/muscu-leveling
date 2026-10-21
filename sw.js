const CACHE = "gl-20261022-000628";
const DATA = {"aliments": "aliments-1476f37b0d.json", "marques": "marques-7e6b903f30.json"};   // content-hashed food tables: kept across app updates, refreshed only when they change
const SHELL = ["./", "index.html", DATA.aliments, "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const isData = p => /\/(aliments|marques)-[0-9a-f]{10}\.json$/.test(p);
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== "gl-data").map(k => caches.delete(k))))
  .then(() => caches.open("gl-data")).then(c => c.keys().then(rs => Promise.all(rs.filter(r => !Object.values(DATA).some(n => r.url.endsWith("/" + n))).map(r => c.delete(r)))))
  .then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isPage) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r; }).catch(() => caches.match("index.html")));
  } else if (isData(url.pathname)) {
    e.respondWith(caches.open("gl-data").then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })));
  }
});
