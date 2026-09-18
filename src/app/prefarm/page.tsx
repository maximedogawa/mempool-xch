import type { Metadata } from "next";
import { PrefarmTracker } from "@/widgets/prefarm/PrefarmTracker";

export const metadata: Metadata = { title: "Prefarm tracker" };

export default function Page() {
  return <PrefarmTracker />;
}
