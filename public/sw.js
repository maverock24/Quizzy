// Service Worker for Quizzy - Offline Support
const CACHE_NAME = 'quizzy-v2';
const RUNTIME_CACHE = 'quizzy-runtime-v2';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/_expo/static/js/web/entry.js',
  '/assets/quizzes_en.json',
  '/assets/quizzes_de.json',
  '/assets/quizzes_fi.json',
];

// File patterns that should be cached (for sounds, fonts, etc.)
const CACHEABLE_PATTERNS = [
  /\/assets\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
  /\/assets\/.*\.(mp3|wav|ogg)$/,
  /\/assets\/.*\.(woff|woff2|ttf|otf)$/,
  /\/assets\/.*\.json$/,
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })))
          .catch(() => {
            // Don't fail the entire installation if some resources fail
            return Promise.resolve();
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to check if URL should be cached
const shouldCache = (url) => {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
};

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache successful responses for cacheable resources
            if (shouldCache(event.request.url) || event.request.url.includes('/_expo/')) {
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch((error) => {
            // For offline scenarios, we already have cached responses
            // If nothing is cached, the error will propagate
            throw error;
          });
      })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_QUIZ_DATA') {
    // Cache quiz data when requested
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return cache.put('/quiz-data', new Response(JSON.stringify(event.data.payload)));
        })
    );
  }
});
