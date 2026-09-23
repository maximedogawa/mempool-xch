"use client";

import { useT } from "@/shared/i18n/useT";
import { useConsent } from "@/shared/providers/ConsentProvider";
import { Button } from "@/shared/ui/Button";

export function CookieSettingsButton() {
  const { openSettings } = useConsent();
  const t = useT("legal");
  return (
    <Button size="sm" onClick={openSettings}>
      {t("consent.settingsButton")}
    </Button>
  );
}
