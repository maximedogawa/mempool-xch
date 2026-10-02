import type { Metadata } from "next";
import { TermsContent } from "@/widgets/legal/TermsContent";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return <TermsContent />;
}
