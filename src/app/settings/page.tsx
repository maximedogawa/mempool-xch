import type { Metadata } from "next";
import { SettingsPage as SettingsBody } from "@/features/settings/SettingsPage";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsBody />;
}
