"use client";

import { PrefarmTracker } from "@/widgets/prefarm/PrefarmTracker";
import { ChiaVaults } from "./ChiaVaults";

/** Vaults: Chia Network's prefarm custody vaults on top, Chia Vaults (lookup, live recovery) below. */
export function VaultsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PrefarmTracker />
      <ChiaVaults />
    </div>
  );
}
