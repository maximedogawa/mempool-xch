"use client";

import { ChevronDown, Menu, Settings, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchBox } from "@/features/search/SearchBox";
import { cn } from "@/shared/lib/cn";
import { normalisePath, routes } from "@/shared/lib/routes";
import { useSage } from "@/shared/providers/SageProvider";
import { Popover } from "@/shared/ui";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Logo } from "./Logo";
import { NetworkSwitch } from "./NetworkSwitch";
import { SagePriceChip } from "@/widgets/wallet/SagePanels";

interface NavItem {
  href: string;
  label: string;
  match: (p: string) => boolean;
}

/**
 * The top bar carries the live-chain pages only: what a visitor watching the network needs at
 * a glance. Everything else lives under "More", grouped so a nine-item menu still reads as a
 * map of the site rather than a list.
 */
const PRIMARY: NavItem[] = [
  { href: routes.home(), label: "Dashboard", match: (p) => p === "/" },
  {
    href: routes.blocks(),
    label: "Blocks",
    match: (p) => p.startsWith("/blocks") || p.startsWith("/block"),
  },
  { href: routes.mempool(), label: "Mempool", match: (p) => p.startsWith("/mempool") },
  { href: routes.charts(), label: "Charts", match: (p) => p.startsWith("/charts") },
  { href: routes.market(), label: "Market", match: (p) => p.startsWith("/market") },
  { href: routes.map(), label: "Map", match: (p) => p.startsWith("/map") },
];

interface NavGroup {
  title: string;
  items: NavItem[];
}

const MORE_GROUPS: NavGroup[] = [
  {
    title: "Assets",
    items: [
      {
        href: routes.tokens(),
        label: "Tokens",
        match: (p) => p.startsWith("/tokens") || p.startsWith("/cat"),
      },
      {
        href: routes.nftHome(),
        label: "NFTs",
        match: (p) => p.startsWith("/nfts") || p.startsWith("/nft"),
      },
    ],
  },
  {
    title: "Network",
    items: [
      { href: routes.fees(), label: "Fees", match: (p) => p.startsWith("/fees") },
      { href: routes.pools(), label: "Pools", match: (p) => p.startsWith("/pools") },
      {
        href: routes.vaults(),
        label: "Vaults",
        match: (p) => p.startsWith("/vaults") || p.startsWith("/prefarm"),
      },
    ],
  },
  {
    title: "Learn & play",
    items: [
      { href: routes.learn(), label: "Learn", match: (p) => p.startsWith("/learn") },
      { href: routes.docs(), label: "Help", match: (p) => p.startsWith("/docs") },
      { href: routes.gaming(), label: "Arcade", match: (p) => p.startsWith("/gaming") },
    ],
  },
];

const MORE: NavItem[] = MORE_GROUPS.flatMap((group) => group.items);

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-sm px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        active && "text-fg"
      )}
    >
      {item.label === "My wallet" ? (
        <Wallet size={14} className="mr-1 inline" aria-hidden="true" />
      ) : null}
      {item.label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </Link>
  );
}

export function Header() {
  const pathname = normalisePath(usePathname() ?? "/");
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { inSage } = useSage();
  const wallet: NavItem = {
    href: routes.wallet(),
    label: "My wallet",
    match: (p) => p.startsWith("/wallet"),
  };
  const primary = inSage ? [...PRIMARY, wallet] : PRIMARY;
  const moreActive = MORE.some((item) => item.match(pathname));
  const settings: NavItem = {
    href: routes.settings(),
    label: "Settings",
    match: (p) => p.startsWith("/settings"),
  };
  const mobileGroups: NavGroup[] = [
    // Not "Network": MORE_GROUPS has a group of that name, and titles key the list.
    { title: "Live chain", items: primary },
    ...MORE_GROUPS,
    { title: "You", items: [settings] },
  ];

  return (
    <header
      className="relative sticky top-0 z-40 border-b border-border bg-bg-elevated/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div aria-hidden="true" className="header-hairline absolute inset-x-0 bottom-0 h-px" />
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1280px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href={routes.home()} aria-label="mempoolxch.space home" className="shrink-0">
          <Logo />
        </Link>
        <nav
          aria-label="Primary"
          className={cn(
            "hidden shrink-0 items-center gap-0.5 transition-[opacity,width] duration-150 lg:flex",
            searchFocused && "lg:hidden"
          )}
        >
          {primary.map((item) => (
            <NavLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
          <Popover
            label="More pages"
            panelClassName="min-w-[26rem]"
            trigger={({ open: moreOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={cn(
                  "relative inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
                  (moreActive || moreOpen) && "text-fg"
                )}
              >
                More
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={cn("transition-transform", moreOpen && "rotate-180")}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-primary transition-opacity",
                    moreActive && "opacity-100"
                  )}
                />
              </button>
            )}
          >
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-3">
              {MORE_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col">
                  <span
                    aria-hidden="true"
                    className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-faint"
                  >
                    {group.title}
                  </span>
                  {group.items.map((item) => {
                    const active = item.match(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
                          active && "bg-surface-2 text-fg"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </Popover>
        </nav>
        <div className="min-w-0 flex-1">
          <SearchBox
            size="lg"
            onFocusChange={setSearchFocused}
            className={cn(
              "transition-[max-width] duration-200 ease-out",
              searchFocused ? "max-w-none" : "max-w-none lg:max-w-[260px]"
            )}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <SagePriceChip />
          <NetworkSwitch className="hidden sm:inline-flex" />
          <ConnectionIndicator compact />
          <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />
          <Link
            href={routes.settings()}
            aria-label="Settings"
            title="Settings"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg sm:inline-flex"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            title={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          aria-label="Mobile"
          className="border-t border-border bg-bg-elevated px-4 py-3 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {mobileGroups.map((group, index) => (
              <li key={group.title}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-faint",
                    index > 0 && "mt-2 border-t border-border/60 pt-3"
                  )}
                >
                  {group.title}
                </span>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
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
                </ul>
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
