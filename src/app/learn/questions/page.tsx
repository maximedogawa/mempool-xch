import type { Metadata } from "next";
import { Questions } from "@/widgets/learn/articles/Questions";

export const metadata: Metadata = { title: "Common questions" };

export default function Page() {
  return <Questions />;
}
