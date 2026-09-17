"use client";

import { useConsent } from "@/shared/providers/ConsentProvider";
import { Button } from "@/shared/ui/Button";

export function CookieSettingsButton() {
  const { openSettings } = useConsent();
  return (
    <Button size="sm" onClick={openSettings}>
      Cookie settings
    </Button>
  );
}
