// Service worker mínimo a propósito: lo único que necesitamos de verdad
// es (a) que exista, porque un manifest sin service worker no cumple el
// criterio de instalabilidad en Chrome/Android, y (b) que sepa mostrar
// una notificación push cuando llega una. No cacheamos rutas ni armamos
// soporte offline todavía — eso es una feature aparte, no un requisito
// para que aparezca el cartel de "instalar app".

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "Torneame", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

// Al tocar la notificación, abre (o enfoca) la pestaña de la app en la
// URL relevante en vez de una pestaña nueva en blanco
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});
