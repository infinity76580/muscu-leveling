const CACHE = "gl-20261112-224140";
const DATA = {"aliments": "aliments-1476f37b0d.json", "marques": "marques-74ed9c5319.json"};   // content-hashed food tables: kept across app updates, refreshed only when they change
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
// Notifications from the Système (sent by notifications/envoyer.py): show them, and a tap opens the app on the tab they name
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "Muscu Leveling", {body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "gl", data: {url: d.url || "./"}}));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope), go = url.hash.slice(1);
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(ws => {
    const w = ws.find(c => c.url.startsWith(self.registration.scope));
    if (w) { if (go) w.postMessage({go}); return w.focus(); }
    return self.clients.openWindow(url.href);
  }));
});
