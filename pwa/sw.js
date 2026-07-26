/* Under360 PWA service worker — scope /pwa/ เท่านั้น
   กฎ: cache แค่ "เปลือกหน้า" (html/icon/manifest) — ข้อมูลออเดอร์ห้าม cache เด็ดขาด
   (ข้อมูลเก่าอันตรายกว่าไม่มีข้อมูล → request ไป Supabase ปล่อยผ่านทั้งหมด) */
var CACHE = "u360-orders-v1";
var SHELL = ["./orders_upcoming.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;              // Supabase / CDN → ปล่อยผ่าน สดเสมอ
  if (url.pathname.indexOf(self.registration.scope.replace(self.location.origin, "")) !== 0) return;

  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    // network-first: ได้โค้ดใหม่เสมอถ้าเน็ตมา, ไม่มีเน็ตค่อยใช้ของเก่า
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("./orders_upcoming.html"); });
      })
    );
    return;
  }
  // icon / manifest → cache-first
  e.respondWith(caches.match(req).then(function (m) { return m || fetch(req); }));
});
