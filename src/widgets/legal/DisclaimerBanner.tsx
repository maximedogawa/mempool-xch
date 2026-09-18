"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getDisclaimerStore, type DisclaimerState } from "@/shared/lib/disclaimer/store";
import { routes } from "@/shared/lib/routes";

// SSR and the hydration render: assume dismissed so returning visitors never see a flash.
// First-time visitors see it appear right after hydration, once the browser store is read.
const SERVER_STATE: DisclaimerState = { dismissed: true };
const serverSnapshot = () => SERVER_STATE;

export function DisclaimerBanner() {
  const store = getDisclaimerStore();
  const { dismissed } = useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
  if (dismissed) return null;
  return (
    <div
      role="note"
      aria-label="Disclaimer"
      className="border-b border-border-strong bg-bg-elevated"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs text-fg-muted">
        <p className="min-w-[240px] flex-1">
          Alpha software, still changing a lot. Not financial advice — verify in your own wallet.{" "}
          <Link href={routes.legalTerms()} className="text-accent hover:underline">
            Terms of use
          </Link>
        </p>
        <button
          type="button"
          onClick={store.dismiss}
          aria-label="Dismiss disclaimer"
          className="shrink-0 rounded-sm px-1.5 py-0.5 text-fg-faint hover:bg-surface-2 hover:text-fg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
