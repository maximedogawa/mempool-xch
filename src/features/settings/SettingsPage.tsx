"use client";

import { useT } from "@/shared/i18n/useT";
import { SettingsForm } from "./SettingsForm";
import settingsNs from "@/shared/i18n/messages/en/settings";

/** Body of /settings: the page heading and the form. */
export function SettingsPage() {
  const t = useT(settingsNs);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <SettingsForm />
    </div>
  );
}
