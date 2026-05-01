importScripts('/firebase-messaging-sw.js');

const cacheName = 'ittihad-cache-v1';
const assetsToCache = [
  '/',
  'https://raw.githubusercontent.com/Omarmagedugm/-/main/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      // Ignore cache errors in case of missing assets
      return cache.addAll(assetsToCache).catch(err => {
        console.warn('Failed to cache assets', err);
      });
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
