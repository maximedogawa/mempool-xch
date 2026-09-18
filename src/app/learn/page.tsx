import type { Metadata } from "next";
import { LearnIndex } from "@/widgets/learn/LearnIndex";

export const metadata: Metadata = { title: "Learn" };

export default function Page() {
  return <LearnIndex />;
}
