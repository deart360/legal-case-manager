const CACHE_NAME = 'legal-case-manager-v99';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './styles/main.css',
    './styles/sidebar.css',
    './styles/case_view.css',
    './styles/tasks_view.css',
    './styles/image_viewer.css',
    './styles/animations.css',
    './styles/promotions_view.css',
    './styles/folder_view.css',
    './js/app.js',
    './js/router.js',
    './js/store.js',
    './js/utils.js',
    './js/config.js',
    './js/firebase_config.js',
    './js/components/sidebar.js',
    './js/components/navbar.js',
    './js/views/dashboard.js',
    './js/views/case_view.js',
    './js/views/tasks_view.js',
    './js/views/image_viewer.js',
    './js/views/promotions_view.js',
    './js/views/folder_view.js',
    './js/views/calendar_view.js',
    './js/services/auth.js',
    './js/services/ai_service.js',
    './assets/icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Ignore Firestore/Firebase requests to let SDK handle them
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
