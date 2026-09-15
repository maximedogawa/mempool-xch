import type { Metadata } from "next";
import { Suspense } from "react";
import { TransactionRoute } from "./TransactionRoute";

export const metadata: Metadata = { title: "Transaction" };

export default function TxPage() {
  return (
    <Suspense fallback={null}>
      <TransactionRoute />
    </Suspense>
  );
}
