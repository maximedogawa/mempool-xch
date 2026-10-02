import type { Metadata } from "next";
import { DocsContent } from "@/widgets/docs/DocsContent";

export const metadata: Metadata = { title: "Help" };

export default function DocsPage() {
  return <DocsContent />;
}
