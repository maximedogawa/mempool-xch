import type { Metadata } from "next";
import { TokensPage } from "@/widgets/tokens/TokensPage";

export const metadata: Metadata = { title: "Tokens" };

export default function Page() {
  return <TokensPage />;
}
