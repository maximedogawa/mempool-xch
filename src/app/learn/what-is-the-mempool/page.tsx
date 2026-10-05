import type { Metadata } from "next";
import { WhatIsTheMempool } from "@/widgets/learn/articles/WhatIsTheMempool";

export const metadata: Metadata = { title: "What is the mempool?" };

export default function Page() {
  return <WhatIsTheMempool />;
}
