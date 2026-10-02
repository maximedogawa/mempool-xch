/** Relative and absolute time formatting shared by every list and detail page, in the UI language. */
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { plainT } from "@/shared/i18n/plain";
import formatNs from "@/shared/i18n/messages/en/format";

export function formatAge(fromMs: number, nowMs = Date.now()): string {
  const t = plainT(formatNs);
  const s = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (s < 5) return t("justNow");
  if (s < 60) return t("secondsAgo", { s });
  const m = Math.floor(s / 60);
  if (m < 60) return t("minutesAgo", { m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("hoursAgo", { h, m: m % 60 });
  const d = Math.floor(h / 24);
  if (d < 30) return t("daysAgo", { d, h: h % 24 });
  const mo = Math.floor(d / 30);
  if (mo < 12) return t("monthsAgo", { mo });
  return t("yearsAgo", { y: Math.floor(mo / 12) });
}

/** "~2 min", "~45 s", "~1.5 h" for ETAs. */
export function formatEta(seconds: number): string {
  const t = plainT(formatNs);
  if (!Number.isFinite(seconds) || seconds <= 0) return t("nextBlock");
  if (seconds < 60) return t("etaSeconds", { s: Math.round(seconds) });
  if (seconds < 3600) return t("etaMinutes", { m: Math.round(seconds / 60) });
  return t("etaHours", { h: formatFixed(seconds / 3600, 1) });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(intlTag(), {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function formatDuration(seconds: number): string {
  const t = plainT(formatNs);
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return t("durationSeconds", { s });
  const m = Math.floor(s / 60);
  if (m < 60) return t("durationMinutes", { m, s: s % 60 });
  const h = Math.floor(m / 60);
  return t("durationHours", { h, m: m % 60 });
}
