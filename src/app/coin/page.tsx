import type { Metadata } from "next";
import { Suspense } from "react";
import { CoinRoute } from "./CoinRoute";

export const metadata: Metadata = { title: "Coin" };

export default function CoinPageRoute() {
  return (
    <Suspense fallback={null}>
      <CoinRoute />
    </Suspense>
  );
}
