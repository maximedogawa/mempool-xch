/**
 * Thin wrapper around the browser Notification API (used by the watchlist). Opt-in only: nothing
 * here requests permission on its own, and every call is a no-op where Notification does not
 * exist (SSR, unsupported browsers, the Sage in-app webview).
 */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Fires a notification if the browser supports it and permission was already granted. */
export function sendNotification(title: string, body?: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, body ? { body, icon: "/icons/icon-192.png" } : { icon: "/icons/icon-192.png" });
  } catch {
    // Some browsers (mobile Safari, in-app webviews) throw even when the API is present.
  }
}
