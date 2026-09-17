"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ConsentCategory } from "@/shared/lib/consent/store";
import { routes } from "@/shared/lib/routes";
import { useConsent } from "@/shared/providers/ConsentProvider";
import { Button } from "@/shared/ui/Button";

const CATEGORIES: { id: "necessary" | ConsentCategory; label: string; detail: string }[] = [
  { id: "necessary", label: "Strictly necessary", detail: "Your settings, caches and this choice, kept in your browser. Always on." },
  { id: "analytics", label: "Analytics", detail: "Anonymous usage statistics. Not used at the moment." },
  { id: "advertising", label: "Advertising", detail: "Ads and ad measurement. Not used at the moment." },
];

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
  const [choice, setChoice] = useState<Record<ConsentCategory, boolean>>({ analytics, advertising });
  const headingRef = useRef<HTMLHeadingElement>(null);

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
          <h2 id="consent-title" ref={headingRef} tabIndex={-1} className="font-semibold text-fg outline-none">
            Cookies and local storage
          </h2>
          <p className="mt-1 text-fg-muted">
            This site keeps only what it needs to work in your browser. Nothing for analytics or advertising loads unless you allow it here.{" "}
            <Link href={routes.legalCookies()} className="text-accent hover:underline">
              Cookie policy
            </Link>
            {" · "}
            <Link href={routes.legalPrivacy()} className="text-accent hover:underline">
              Privacy policy
            </Link>
          </p>
          {signal ? (
            <p className="mt-1 text-fg-muted">Your browser sends a Do Not Track or Global Privacy Control signal, so analytics and advertising stay off.</p>
          ) : null}
        </div>
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <legend className="sr-only">Categories</legend>
          {CATEGORIES.map((category) => {
            const necessary = category.id === "necessary";
            const checked = necessary ? true : choice[category.id as ConsentCategory];
            return (
              <label key={category.id} className="flex flex-1 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                  checked={checked}
                  disabled={necessary || signal}
                  onChange={(event) => {
                    if (necessary) return;
                    const id = category.id as ConsentCategory;
                    setChoice((prev) => ({ ...prev, [id]: event.target.checked }));
                  }}
                />
                <span>
                  <span className="font-medium text-fg">{category.label}</span>
                  <span className="block text-xs text-fg-muted">{category.detail}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button size="sm" onClick={() => save({ analytics: false, advertising: false })}>
            Reject all
          </Button>
          <Button size="sm" onClick={() => save(choice)}>
            Save my choice
          </Button>
          <Button size="sm" variant="primary" disabled={signal} onClick={() => save({ analytics: true, advertising: true })}>
            Accept all
          </Button>
          {!undecided ? (
            <Button size="sm" variant="ghost" onClick={closeSettings}>
              Close
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
