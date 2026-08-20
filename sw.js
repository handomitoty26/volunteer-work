/* 기숙사 봉사활동·캠페인 신청 — 서비스워커
   ※ 파일을 고칠 때마다 아래 CACHE 뒤 숫자를 반드시 올려주세요. (예: v1 → v2) */
var CACHE = 'bongsa-v2';

var SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './manifest-admin.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/admin-192.png',
  './icons/admin-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () { return null; });
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = req.url;
  // 신청 데이터(Apps Script)와 외부 CDN 은 절대 캐시하지 않습니다 — 항상 최신값이어야 합니다.
  if (url.indexOf('script.google.com') >= 0 ||
      url.indexOf('script.googleusercontent.com') >= 0 ||
      url.indexOf('cdn.jsdelivr.net') >= 0) {
    return;
  }

  // 화면 파일은 네트워크 우선 → 실패 시 캐시 (업데이트가 바로 반영되도록)
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
