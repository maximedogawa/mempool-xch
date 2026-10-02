/**
 * Build-time feature flags. `NEXT_PUBLIC_*` values are inlined when the app is built, so
 * flipping one means a rebuild (Docker build arg or `.env`), never a runtime toggle a visitor
 * could reach. Accepted values: 1/true/on and 0/false/off; anything else keeps the default.
 */
export function parseFlag(value: string | undefined, fallback: boolean): boolean {
  const v = value?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return fallback;
}

export const FEATURES = {
  /**
   * The arcade21 catalogue and rooms on mainnet /gaming. The tracker no longer works reliably
   * on mainnet (TASK-100), so production builds leave it off; development keeps it on.
   */
  arcadeMainnet: parseFlag(
    process.env.NEXT_PUBLIC_FEATURE_ARCADE_MAINNET,
    process.env.NODE_ENV !== "production"
  ),
  /** Live testnet gaming from the nokitlan tracker on /gaming when Testnet11 is selected. */
  gamingTestnet: parseFlag(process.env.NEXT_PUBLIC_FEATURE_GAMING_TESTNET, true),
} as const;
