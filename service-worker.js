/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Service Worker PWA
 *  service-worker.js
 *
 *  Permet de jouer hors-ligne après la première visite.
 *  Stratégie : Cache First pour les assets, Network First
 *  pour les données dynamiques.
 * ════════════════════════════════════════════════════════════
 */
 
const CACHE_VERSION = 2;
const CACHE_NAME    = `pixelreader-v${CACHE_VERSION}`;
 
// Fichiers à mettre en cache lors de l'installation
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/config/GameConfig.js',
  './src/scenes/BootScene.js',
  './src/scenes/WorldScene.js',
  './src/scenes/UIScene.js',
  './src/scenes/BookScene.js',
  './src/systems/SaveSystem.js',
  './src/systems/BookTracker.js',
  './src/systems/BuildingSystem.js',
  './src/systems/RewardSystem.js',
  './src/data/books.json',
  './src/data/buildings.json',
  './src/data/world-state.json',
  './assets/tilemaps/world.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // Phaser est servi via CDN → mis en cache au premier accès
  'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
  // Police Google Fonts (mise en cache au premier accès)
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
];
 
// ── Installation : mise en cache initiale ────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du service worker...');
 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-cache des assets...');
      // On ignore les erreurs individuelles pour ne pas bloquer l'install
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Impossible de cacher :', url, err.message)
          )
        )
      );
    }).then(() => {
      console.log('[SW] ✅ Installation terminée.');
      // Prendre le contrôle immédiatement sans attendre le rechargement
      return self.skipWaiting();
    })
  );
});
 
// ── Activation : nettoyage des anciens caches ─────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
 
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Suppression ancien cache :', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] ✅ Activation terminée. Contrôle des clients.');
      return self.clients.claim();
    })
  );
});
 
// ── Interception des requêtes ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url         = new URL(request.url);
 
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
 
  // Ignorer les extensions Chrome
  if (url.protocol === 'chrome-extension:') return;
 
  // ── Stratégie : Cache First (assets statiques) ───────────
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalider en arrière-plan (stale-while-revalidate)
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {/* Silencieux en hors-ligne */});
 
        return cachedResponse;
      }
 
      // Pas en cache → aller chercher sur le réseau
      return fetch(request).then((networkResponse) => {
        // Mettre en cache la réponse pour les prochains accès
        if (networkResponse && networkResponse.status === 200 &&
            networkResponse.type !== 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Hors-ligne et pas en cache
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
        console.warn('[SW] Ressource indisponible hors-ligne :', url.pathname);
      });
    })
  );
});
 
// ── Message depuis le client (pour forcer la mise à jour) ─────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});