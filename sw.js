/* 旅程手帳 — Service Worker
   作用：把 APP 本身（HTML/圖示）存進瀏覽器的快取，讓你完全沒有網路
   （例如在國外飛機上、沒開漫遊）也能打開使用。
   注意：這裡快取的是「APP 程式本身」，你的行程資料是另外存在
   IndexedDB 裡的，跟這個檔案無關。 */

const CACHE = 'travelnote-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})          // 有檔案抓不到也不要讓安裝整個失敗
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 先用網路（這樣你更新 APP 後打開就會拿到新版），
  // 沒網路時再退回快取，所以離線也能用。
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
