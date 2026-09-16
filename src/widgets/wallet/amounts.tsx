"use client";

import { formatAmount } from "@/shared/lib/chia/amounts";
import type { WalletCoinRef } from "@/shared/lib/sage/wallet";
import { CatRef } from "@/shared/ui";

export function kindOf(ref: WalletCoinRef): "xch" | "cat" | "nft" | "did" | "unknown" {
  const k = ref.assetKind.toLowerCase();
  if (k.includes("nft")) return "nft";
  if (k.includes("did")) return "did";
  if (k.includes("cat") || k.includes("token")) return "cat";
  if (k.includes("xch") || (!ref.assetId && k !== "unknown")) return "xch";
  return ref.assetId ? "cat" : "xch";
}

export function catUnits(ref: WalletCoinRef): string {
  const p = BigInt(10) ** BigInt(ref.precision);
  const whole = ref.amount / p;
  const frac = (ref.amount % p).toString().padStart(ref.precision, "0").replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${frac ? `.${frac}` : ""}`;
}

/** One wallet coin amount in its own unit; CATs resolve ticker and icon through the token registry. */
export function WalletAmount({ refItem, sign }: { refItem: WalletCoinRef; sign: "+" | "−" }) {
  const kind = kindOf(refItem);
  const cls = sign === "+" ? "block text-primary" : "block text-danger";
  if (kind === "cat" && refItem.assetId) {
    return <CatRef assetId={refItem.assetId} iconUrl={refItem.iconUrl} amountText={`${sign}${catUnits(refItem)}`} size={14} className={cls} />;
  }
  const text = kind === "xch" ? formatAmount(refItem.amount) : kind === "nft" || kind === "did" ? `1 ${kind.toUpperCase()}` : `${catUnits(refItem)} ${refItem.ticker ?? "CAT"}`;
  return (
    <span className={cls}>
      {sign}
      {text}
    </span>
  );
}
