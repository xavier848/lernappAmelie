// Client-Logik fuer Push-Benachrichtigungen: Service Worker registrieren,
// Erlaubnis holen, beim Push-Dienst anmelden und das Abo an den Server geben.
// iOS: funktioniert NUR in der zum Home-Bildschirm hinzugefuegten App (nicht
// in Safari) und erst ab iOS 16.4.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushState =
  | "unsupported" // Browser/Geraet kann kein Push
  | "default" // noch nicht gefragt
  | "granted" // Erlaubnis da, ggf. schon abonniert
  | "denied"; // Erlaubnis verweigert

/** Prueft, ob Push in diesem Browser grundsaetzlich moeglich ist. */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushPermission(): PushState {
  if (!pushSupported()) return "unsupported";
  return Notification.permission as PushState;
}

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

/** Service Worker registrieren (idempotent). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

/**
 * Fragt nach Erlaubnis und meldet das Geraet beim Push-Dienst an. Gibt true
 * zurueck, wenn am Ende ein aktives Abo besteht.
 */
export async function enablePush(profile: string): Promise<boolean> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
  const reg = await registerServiceWorker();
  if (!reg) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        profile,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
