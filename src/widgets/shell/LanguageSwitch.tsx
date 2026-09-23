"use client";

import { Languages } from "lucide-react";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/shared/i18n/config";
import { useLocale, useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { useSettings } from "@/shared/providers/SettingsProvider";
import shellNs from "@/shared/i18n/messages/en/shell";

/** Header language picker; the choice persists in settings and applies without a reload. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { update } = useSettings();
  const locale = useLocale();
  const t = useT(shellNs);
  return (
    <label
      className={cn(
        "relative inline-flex h-9 items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg",
        className
      )}
      title={t("language")}
    >
      <span className="sr-only">{t("language")}</span>
      <Languages size={16} aria-hidden="true" className="pointer-events-none absolute left-2.5" />
      <select
        value={locale}
        onChange={(e) => update({ locale: e.target.value as Locale })}
        data-testid="language-switch"
        className="h-9 cursor-pointer appearance-none bg-transparent pl-8 pr-2.5 text-xs font-semibold uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
      >
        {LOCALES.map((id) => (
          <option key={id} value={id} lang={id} className="bg-bg text-fg normal-case">
            {id.toUpperCase()} · {LOCALE_NAMES[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
