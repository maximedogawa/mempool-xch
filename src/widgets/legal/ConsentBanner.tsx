"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ConsentCategory } from "@/shared/lib/consent/store";
import { routes } from "@/shared/lib/routes";
import { useT } from "@/shared/i18n/useT";
import { useConsent } from "@/shared/providers/ConsentProvider";
import { Button } from "@/shared/ui/Button";
import consentNs from "@/shared/i18n/messages/en/consent";

const CATEGORIES: ("necessary" | ConsentCategory)[] = ["necessary", "analytics", "advertising"];

/**
 * Consent panel: opens on the first visit and from "Cookie settings" in the footer.
 * Non-modal on purpose, so the explorer stays usable while it is open.
 */
export function ConsentBanner() {
  const consent = useConsent();
  if (!consent.panelOpen) return null;
  return <ConsentPanel />;
}

function ConsentPanel() {
  const { analytics, advertising, signal, undecided, save, closeSettings } = useConsent();
  const [choice, setChoice] = useState<Record<ConsentCategory, boolean>>({
    analytics,
    advertising,
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const t = useT(consentNs);

  // Opened on request from the footer: move focus into the panel. On a first visit leave focus alone.
  useEffect(() => {
    if (!undecided) headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-bg-elevated shadow-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !undecided) closeSettings();
      }}
    >
      <div className="mx-auto flex max-h-[70dvh] max-w-[1280px] flex-col gap-3 overflow-y-auto px-4 py-4 text-sm">
        <div>
          <h2
            id="consent-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-semibold text-fg outline-none"
          >
            {t("consent.title")}
          </h2>
          <p className="mt-1 text-fg-muted">
            {t("consent.intro")}{" "}
            <Link href={routes.legalCookies()} className="text-accent hover:underline">
              {t("consent.cookiePolicy")}
            </Link>
            {" · "}
            <Link href={routes.legalPrivacy()} className="text-accent hover:underline">
              {t("consent.privacyPolicy")}
            </Link>
          </p>
          {signal ? <p className="mt-1 text-fg-muted">{t("consent.signal")}</p> : null}
        </div>
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <legend className="sr-only">{t("consent.categoriesLegend")}</legend>
          {CATEGORIES.map((category) => {
            const necessary = category === "necessary";
            const checked = necessary ? true : choice[category as ConsentCategory];
            return (
              <label key={category} className="flex flex-1 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                  checked={checked}
                  disabled={necessary || signal}
                  onChange={(event) => {
                    if (necessary) return;
                    const id = category as ConsentCategory;
                    setChoice((prev) => ({ ...prev, [id]: event.target.checked }));
                  }}
                />
                <span>
                  <span className="font-medium text-fg">
                    {t(`consent.categories.${category}.label`)}
                  </span>
                  <span className="block text-xs text-fg-muted">
                    {t(`consent.categories.${category}.detail`)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button size="sm" onClick={() => save({ analytics: false, advertising: false })}>
            {t("consent.rejectAll")}
          </Button>
          <Button size="sm" onClick={() => save(choice)}>
            {t("consent.saveChoice")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={signal}
            onClick={() => save({ analytics: true, advertising: true })}
          >
            {t("consent.acceptAll")}
          </Button>
          {!undecided ? (
            <Button size="sm" variant="ghost" onClick={closeSettings}>
              {t("consent.close")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
