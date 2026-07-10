// Service Worker fuer Push-Benachrichtigungen (Amelies Lernapp).
// Zeigt eintreffende Push-Nachrichten an und oeffnet die App beim Tippen.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Amelies Lernapp 🐴";
  const options = {
    body: data.body || "Zeit für eine kleine Übung!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    lang: "de",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Wenn die App schon offen ist, dorthin fokussieren.
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
