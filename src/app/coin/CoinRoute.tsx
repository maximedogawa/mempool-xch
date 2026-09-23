"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { CoinPage } from "@/widgets/coin/CoinPage";
import appNs from "@/shared/i18n/messages/en/app";

export function CoinRoute() {
  const t = useT(appNs);
  const raw = useDetailId("coin") ?? "";
  const id = normaliseId32(raw);
  if (raw && !id) {
    return (
      <EmptyState
        tone="danger"
        title={t("invalidCoin.title")}
        description={t("invalidCoin.description")}
      />
    );
  }
  return <CoinPage id={id} />;
}
