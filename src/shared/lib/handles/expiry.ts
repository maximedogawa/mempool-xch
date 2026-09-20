/**
 * How long a handle has left. The registry treats the last 30 days as the window in which a
 * handle is "expiring soon" (its own /expiring?view=soon directory), so the same threshold marks
 * a watched handle as needing attention.
 */

const DAY_MS = 86_400_000;
export const EXPIRING_SOON_DAYS = 30;

export interface ExpiryInfo {
  /** Whole days left; negative once the term has passed. */
  days: number;
  /** "in 11 months", "in 6 days", "5 days ago". */
  text: string;
  /** Inside the registry's 30-day window, but not yet past. */
  soon: boolean;
  expired: boolean;
}

function span(days: number): string {
  if (days < 1) return "less than a day";
  if (days === 1) return "1 day";
  if (days < 45) return `${days} days`;
  // Years and months are rounded down, never up: a term always reads as at least as short as it
  // is, which is the safe direction for a deadline.
  if (days < 365) return `${Math.floor(days / 30)} months`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"}`;
}

/** `expiration` is unix seconds, as both registries report it. */
export function describeExpiry(expiration: number, nowMs = Date.now()): ExpiryInfo {
  const remainingMs = expiration * 1000 - nowMs;
  const days = Math.floor(remainingMs / DAY_MS);
  const expired = remainingMs <= 0;
  return {
    days,
    text: expired
      ? `${span(Math.floor(-remainingMs / DAY_MS))} ago`
      : `in ${span(Math.floor(remainingMs / DAY_MS))}`,
    soon: !expired && days < EXPIRING_SOON_DAYS,
    expired,
  };
}
