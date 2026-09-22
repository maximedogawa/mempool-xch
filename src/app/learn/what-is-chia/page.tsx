import type { Metadata } from "next";
import { WhatIsChia } from "@/widgets/learn/articles/WhatIsChia";

export const metadata: Metadata = { title: "What is Chia?" };

export default function Page() {
  return <WhatIsChia />;
}
