import type { Metadata } from "next";
import { WalletPage } from "@/widgets/wallet/WalletPage";

export const metadata: Metadata = { title: "My wallet" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl">
      <WalletPage />
    </div>
  );
}
