import type { Metadata } from "next";
import { CookiesContent } from "@/widgets/legal/CookiesContent";

export const metadata: Metadata = { title: "Cookie policy" };

export default function CookiesPage() {
  return <CookiesContent />;
}
