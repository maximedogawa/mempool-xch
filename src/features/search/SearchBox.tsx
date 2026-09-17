"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetIcon } from "@/shared/ui/AssetBadge";
import { useCatLabel } from "@/shared/ui/CatRef";
import { parseSearchInput } from "./parse";
import { directRoute, resolveHex32, type SearchMatch } from "./resolve";

function CandidateLabel({ match }: { match: SearchMatch }) {
  const ticker = useCatLabel(match.assetId);
  if (match.kind === "cat" && match.assetId) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium">
        <AssetIcon kind="cat" assetId={match.assetId} size={16} />
        {ticker}
      </span>
    );
  }
  return <span className="font-medium">{match.label}</span>;
}

export function SearchBox({
  className,
  autoFocus = false,
  size = "md",
  onFocusChange,
}: {
  className?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  /** Fires when the box gains or truly loses focus (a click on the clear button or a candidate does not count as losing it). */
  onFocusChange?: (focused: boolean) => void;
}) {
  const router = useRouter();
  const { client, endpoints } = useSettings();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<SearchMatch[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // "/" focuses the search box from anywhere, Escape clears it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = useCallback(() => {
    setValue("");
    setError(null);
    setCandidates(null);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setCandidates(null);
    const target = parseSearchInput(value);
    if (target.kind === "invalid") {
      setError(target.reason);
      return;
    }
    const direct = directRoute(target);
    if (direct) {
      router.push(direct);
      clear();
      return;
    }
    if (target.kind === "hex32") {
      setBusy(true);
      try {
        const matches = await resolveHex32(client, endpoints.network, target.hex);
        if (matches.length === 1) {
          router.push(matches[0]!.href);
          clear();
        } else {
          setCandidates(matches);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  const handleBlur = () => {
    if (!onFocusChange) return;
    // A click on the clear button or a candidate link moves focus within the form and should
    // not count as leaving the search box; only collapse once focus truly left it.
    window.setTimeout(() => {
      if (!formRef.current?.contains(document.activeElement)) onFocusChange(false);
    }, 0);
  };

  return (
    <form ref={formRef} role="search" onSubmit={submit} className={cn("relative w-full", className)}>
      <label htmlFor="global-search" className="sr-only">
        Search transactions, blocks, addresses, coins and assets
      </label>
      <div className="relative">
        <Search
          size={size === "lg" ? 18 : 16}
          aria-hidden="true"
          className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-muted", size === "lg" ? "left-4" : "left-3")}
        />
        <input
          ref={inputRef}
          id="global-search"
          type="search"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
            setCandidates(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              clear();
              (e.target as HTMLInputElement).blur();
            }
          }}
          onFocus={() => onFocusChange?.(true)}
          onBlur={handleBlur}
          placeholder={size === "lg" ? "Search tx, block, address, coin, CAT or NFT…" : "Search tx id, block, address, coin, CAT or NFT…"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "global-search-error" : undefined}
          className={cn(
            "w-full border bg-surface text-fg shadow-sm transition-colors placeholder:text-fg-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)] focus:outline-none",
            size === "lg" ? "h-11 rounded-full border-border-strong pl-11 pr-20 text-[15px]" : "h-10 rounded-md border-border pl-9 pr-16 text-sm"
          )}
        />
        <div className={cn("absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center", size === "lg" ? "gap-1" : "gap-1")}>
          {value ? (
            <button type="button" onClick={clear} aria-label="Clear search" className="rounded-full p-1.5 text-fg-faint hover:bg-surface-2 hover:text-fg">
              <X size={size === "lg" ? 16 : 14} aria-hidden="true" />
            </button>
          ) : (
            <kbd className={cn("hidden rounded-full border border-border-strong bg-surface-2 text-fg-muted sm:inline", size === "lg" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]")}>
              /
            </kbd>
          )}
          <button
            type="submit"
            disabled={busy}
            aria-label="Search"
            className={cn(
              "flex items-center justify-center rounded-full bg-primary font-semibold text-primary-fg hover:bg-primary-strong disabled:opacity-60",
              size === "lg" ? "h-8 w-8" : "px-2 py-1 text-xs"
            )}
          >
            {busy ? (
              <Loader2 size={size === "lg" ? 16 : 14} className="animate-spin" aria-hidden="true" />
            ) : size === "lg" ? (
              <Search size={15} aria-hidden="true" />
            ) : (
              "Go"
            )}
          </button>
        </div>
      </div>
      {error ? (
        <p id="global-search-error" role="alert" className="absolute left-0 right-0 top-full z-30 mt-1 rounded-sm border border-danger/40 bg-bg-elevated px-3 py-2 text-xs text-danger shadow-card">
          {error}
        </p>
      ) : null}
      {candidates ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-sm border border-border bg-bg-elevated p-1 shadow-card">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-fg-faint">
            {candidates.length > 1 ? "Several matches, pick one" : "Best guess"}
          </p>
          {candidates.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={clear}
              className="block rounded-sm px-2 py-1.5 text-sm hover:bg-surface-2"
            >
              <CandidateLabel match={c} />
              <span className="mono ml-2 text-xs text-fg-faint">{c.href}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </form>
  );
}
