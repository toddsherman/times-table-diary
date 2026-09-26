// Times Table Diary moved to https://www.todd.sh/timesTableDiary/App.
//
// It used to run from the root of times-table-diary.vercel.app, where a service worker at /sw.js
// answered every visit from its cache, so the server's redirect to the new address would never be
// seen. Browsers look for a newer /sw.js whenever the old app opens and get this worker instead:
// it clears the old caches, unregisters itself, and reloads open pages, which then reach the
// redirect in vercel.json.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)))
      await self.registration.unregister()
      const pages = await self.clients.matchAll({ type: 'window' })
      await Promise.all(pages.map((page) => page.navigate(page.url).catch(() => {})))
    })(),
  )
})
