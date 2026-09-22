/** Byte-scale formatting for netspace: base-1024 units up to exbibytes. */
import { numberFormat } from "@/shared/i18n/number";

const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB"] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exp = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exp;
  const digits = value >= 100 || exp === 0 ? 0 : 2;
  const text = numberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(value);
  return `${text} ${UNITS[exp]}`;
}
