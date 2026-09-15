"use client";

import { Menu, Settings, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchBox } from "@/features/search/SearchBox";
import { cn } from "@/shared/lib/cn";
import { normalisePath, routes } from "@/shared/lib/routes";
import { useSage } from "@/shared/providers/SageProvider";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Logo } from "./Logo";
import { NetworkSwitch } from "./NetworkSwitch";
import { SagePriceChip } from "@/widgets/wallet/SagePanels";

const NAV = [
  { href: routes.home(), label: "Dashboard", match: (p: string) => p === "/" },
  { href: routes.blocks(), label: "Blocks", match: (p: string) => p.startsWith("/blocks") || p.startsWith("/block") },
  { href: routes.mempool(), label: "Mempool", match: (p: string) => p.startsWith("/mempool") },
  { href: routes.docs(), label: "Help", match: (p: string) => p.startsWith("/docs") },
];

export function Header() {
  const pathname = normalisePath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const { inSage } = useSage();
  const nav = inSage ? [...NAV, { href: routes.wallet(), label: "My wallet", match: (p: string) => p.startsWith("/wallet") }] : NAV;
  return (
    <header className="relative sticky top-0 z-40 border-b border-border bg-bg-elevated/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div aria-hidden="true" className="header-hairline absolute inset-x-0 bottom-0 h-px" />
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1280px] items-center gap-3 px-4">
        <Link href={routes.home()} aria-label="mempoolxch.space home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.match(pathname) ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
                item.match(pathname) && "bg-surface-2 text-fg"
              )}
            >
              {item.label === "My wallet" ? <Wallet size={14} className="mr-1 inline" aria-hidden="true" /> : null}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden flex-1 md:block">
          <SearchBox className="mx-auto max-w-xl" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SagePriceChip />
          <NetworkSwitch className="hidden sm:inline-flex" />
          <ConnectionIndicator />
          <Link
            href={routes.settings()}
            aria-label="Settings"
            className="hidden h-8 w-8 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg sm:inline-flex"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-2 md:hidden">
        <SearchBox />
      </div>
      {open ? (
        <nav aria-label="Mobile" className="border-t border-border bg-bg-elevated px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {[...nav, { href: routes.settings(), label: "Settings", match: (p: string) => p.startsWith("/settings") }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={item.match(pathname) ? "page" : undefined}
                  className={cn(
                    "block min-h-11 rounded-sm px-3 py-2.5 text-base font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
                    item.match(pathname) && "bg-surface-2 text-fg"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <NetworkSwitch />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
