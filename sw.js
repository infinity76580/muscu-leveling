const CACHE = "gl-20261117-173156";
const DATA = {"aliments": "aliments-1476f37b0d.json", "marques": "marques-74ed9c5319.json"};   // content-hashed food tables: kept across app updates, refreshed only when they change
const SHELL = ["./", "index.html", DATA.aliments, "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const isData = p => /\/(aliments|marques)-[0-9a-f]{10}\.json$/.test(p);
const IMGV = {"body": "249e0962", "chest_closed": "4795cef1", "chest_open": "8f4d39fc", "gate_DB": "8a76bd1a", "gate_DB_2": "bcc44b03", "gate_DB_3": "d4d89598", "gate_DB_4": "e46b1b33", "gate_DP": "cb80ead7", "gate_DP_2": "2ac4ce50", "gate_DP_3": "229eba9c", "gate_DP_4": "22c35fb7", "gate_EB": "bf848f7d", "gate_EB_2": "b7f29b3a", "gate_EB_3": "55d4f85c", "gate_EB_4": "5c6a1efa", "gate_EP": "b384ab9a", "gate_EP_2": "645f7dda", "gate_EP_3": "ca412e2c", "gate_EP_4": "5be19e67", "gate_J": "19e0d29f", "gate_J_2": "33b2a54d", "gate_J_3": "f5a27d28", "gate_J_4": "c246123a", "gate_PT": "225bc137", "gate_PT_2": "358a10f1", "gate_PT_3": "65e682e7", "gate_PT_4": "361f79d1", "hero_status": "cd4b1ac6", "levelup": "b225a816", "meals": "7e7eadc9", "penalty": "4e1d153a", "rw_accessoire": "499127c8", "rw_bain": "412147d5", "rw_bar": "f7f45862", "rw_bbq": "5a43eac6", "rw_bonbons": "45cd374a", "rw_bowling": "7d463927", "rw_brunch": "4508ea6f", "rw_bubbletea": "add6288f", "rw_burger": "ee3c467c", "rw_burger_maison": "68953941", "rw_cafe": "02e839f9", "rw_cappuccino": "76ecc245", "rw_ceinture": "07937200", "rw_chaussures": "8b2d7efc", "rw_cinema": "7bf3b90f", "rw_concert": "460da810", "rw_creatine": "7c0d49ad", "rw_crepe": "f65b0f73", "rw_default": "a7ffbddd", "rw_dessert": "fa5df27d", "rw_donut": "19b22d2d", "rw_ecouteurs": "de1470e1", "rw_entrecote": "5becd558", "rw_fastfood": "ebe99f31", "rw_festin": "a890a9bd", "rw_film": "ceadfd2e", "rw_glace": "08cdda3c", "rw_grasse_mat": "73ac70cc", "rw_jeu": "373b4a73", "rw_jeu_deluxe": "67b695b6", "rw_jeu_heure": "5f72a88b", "rw_kebab": "9656f910", "rw_maillot": "06350f56", "rw_massage": "5aa91b12", "rw_milkshake": "eaa4982e", "rw_monster": "c5b19fc7", "rw_montre": "0350fc84", "rw_parc": "3986c575", "rw_pates": "6b8480b6", "rw_pizza": "036f9e2d", "rw_pizzeria": "08ed0b67", "rw_raclette": "2b9772b8", "rw_repas": "eb408edc", "rw_resto": "7abbbe52", "rw_sac": "83b38b3b", "rw_sangles": "5e3cff09", "rw_shaker": "ccfae668", "rw_skip": "88d8069f", "rw_soiree_jeux": "18c3d8c7", "rw_sortie": "9aa0783f", "rw_sushi": "2d4dffa8", "rw_tenue": "aa20b9b2", "rw_tshirt": "9f784c8f", "rw_ultime": "1526145f", "rw_weekend": "b0aec23d", "rw_whey": "c3b1f4ba", "rw_wings": "56ecdb65", "shop": "9d768a63"};   // 16 Nov: picture name -> content hash; pictures live in "gl-img" and survive app updates
const isImg = p => /\/img\/[^/]+\.webp$/.test(p);
const isFont = h => h === "fonts.googleapis.com" || h === "fonts.gstatic.com";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== "gl-data" && k !== "gl-img" && k !== "gl-font").map(k => caches.delete(k))))
  .then(() => caches.open("gl-data")).then(c => c.keys().then(rs => Promise.all(rs.filter(r => !Object.values(DATA).some(n => r.url.endsWith("/" + n))).map(r => c.delete(r)))))
  .then(() => caches.open("gl-img")).then(c => c.keys().then(rs => Promise.all(rs.filter(r => { const u = new URL(r.url), n = u.pathname.split("/").pop().replace(/\.webp$/, ""); return IMGV[n] !== u.searchParams.get("v"); }).map(r => c.delete(r)))))
  .then(() => self.clients.claim())); });
const cacheFirst = (name, req) => caches.open(name).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (isFont(url.hostname)) { e.respondWith(cacheFirst("gl-font", e.request).catch(() => Response.error())); return; }   // 16 Nov: fonts work offline too
  if (url.origin !== location.origin) return;
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isPage) {                                   // 16 Nov: newest version when the network answers within 3 s, else the saved one (weak signal at the gym)
    const net = fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); } return r; });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(new Promise(res => {
      let done = false; const give = r => { if (!done && r) { done = true; res(r); } };
      const saved = () => caches.match("index.html");
      const t = setTimeout(() => saved().then(give), 3000);
      net.then(r => { clearTimeout(t); give(r); }, () => { clearTimeout(t); saved().then(hit => give(hit || Response.error())); });
    }));
  } else if (isData(url.pathname)) {
    e.respondWith(cacheFirst("gl-data", e.request));
  } else if (isImg(url.pathname)) {
    e.respondWith(cacheFirst("gl-img", e.request));
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
