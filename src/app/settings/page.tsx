import type { Metadata } from "next";
import { SettingsForm } from "@/features/settings/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm />
    </div>
  );
}
