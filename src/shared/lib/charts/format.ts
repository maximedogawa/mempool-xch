/** Byte-scale formatting for netspace (TASK-058): base-1024 units up to exbibytes. */
const UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB"] as const;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exp = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exp;
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(exp === 0 ? 0 : 2)} ${UNITS[exp]}`;
}
