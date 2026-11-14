// sw.js (the "service worker")
// A small helper the browser runs in the background. It keeps a copy of
// the app's files on the device, so the app still opens without internet.
//
// Strategy: "network first". When online, always fetch the newest files
// and refresh the saved copy. When offline, use the saved copy instead.

const CACHE_NAME = "pdf-merger-v1";

// Everything the app needs to start
const APP_FILES = [
  "./",
  "index.html",
  "vendor/pdf-lib.min.js",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// First install: save all the app files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // "reload": download fresh copies, never ones the browser kept from before
      cache.addAll(APP_FILES.map((file) => new Request(file, { cache: "reload" })))
    )
  );
  self.skipWaiting(); // start working straight away
});

// When a new version takes over, delete saved copies from old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// Every file request: try the internet first, fall back to the saved copy
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return; // only our own files

  event.respondWith(
    // "no-cache": always ask GitHub whether the file changed, so an update
    // never mixes new and old files. (If nothing changed, the answer is quick.)
    fetch(event.request.url, { cache: "no-cache" })
      .then((response) => {
        // Keep the saved copy up to date (only for good answers)
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
