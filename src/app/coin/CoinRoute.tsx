"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { EmptyState } from "@/shared/ui";
import { CoinPage } from "@/widgets/coin/CoinPage";

export function CoinRoute() {
  const raw = useDetailId("coin") ?? "";
  const id = normaliseId32(raw);
  if (raw && !id) {
    return (
      <EmptyState
        tone="danger"
        title="Invalid coin id"
        description="A coin id is 32 bytes of hex, with or without a 0x prefix."
      />
    );
  }
  return <CoinPage id={id} />;
}
