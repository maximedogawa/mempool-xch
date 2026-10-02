import type { Metadata } from "next";
import { ChangelogPage } from "@/widgets/changelog/ChangelogPage";

export const metadata: Metadata = { title: "Changelog" };

export default function Page() {
  return <ChangelogPage />;
}
