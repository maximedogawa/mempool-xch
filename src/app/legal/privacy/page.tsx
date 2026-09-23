import type { Metadata } from "next";
import { PrivacyContent } from "@/widgets/legal/PrivacyContent";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <PrivacyContent />;
}
