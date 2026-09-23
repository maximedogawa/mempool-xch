"use client";

import { ChevronDown, Menu, Settings, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchBox } from "@/features/search/SearchBox";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { normalisePath, routes } from "@/shared/lib/routes";
import { useSage } from "@/shared/providers/SageProvider";
import { Popover } from "@/shared/ui";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Logo } from "./Logo";
import { LanguageSwitch } from "./LanguageSwitch";
import { NetworkSwitch } from "./NetworkSwitch";
import { SagePriceChip } from "@/widgets/wallet/SagePanels";

type NavLabel =
  | "dashboard"
  | "blocks"
  | "mempool"
  | "charts"
  | "market"
  | "map"
  | "tokens"
  | "nfts"
  | "fees"
  | "pools"
  | "vaults"
  | "learn"
  | "help"
  | "arcade"
  | "wallet"
  | "settings";

interface NavItem {
  href: string;
  label: NavLabel;
  match: (p: string) => boolean;
}

/**
 * The top bar carries the live-chain pages only: what a visitor watching the network needs at
 * a glance. Everything else lives under "More", grouped so a nine-item menu still reads as a
 * map of the site rather than a list.
 */
const PRIMARY: NavItem[] = [
  { href: routes.home(), label: "dashboard", match: (p) => p === "/" },
  {
    href: routes.blocks(),
    label: "blocks",
    match: (p) => p.startsWith("/blocks") || p.startsWith("/block"),
  },
  { href: routes.mempool(), label: "mempool", match: (p) => p.startsWith("/mempool") },
  { href: routes.charts(), label: "charts", match: (p) => p.startsWith("/charts") },
  { href: routes.market(), label: "market", match: (p) => p.startsWith("/market") },
  { href: routes.map(), label: "map", match: (p) => p.startsWith("/map") },
];

interface NavGroup {
  title: "assets" | "network" | "learnPlay" | "liveChain" | "you";
  items: NavItem[];
}

const MORE_GROUPS: NavGroup[] = [
  {
    title: "assets",
    items: [
      {
        href: routes.tokens(),
        label: "tokens",
        match: (p) => p.startsWith("/tokens") || p.startsWith("/cat"),
      },
      {
        href: routes.nftHome(),
        label: "nfts",
        match: (p) => p.startsWith("/nfts") || p.startsWith("/nft"),
      },
    ],
  },
  {
    title: "network",
    items: [
      { href: routes.fees(), label: "fees", match: (p) => p.startsWith("/fees") },
      { href: routes.pools(), label: "pools", match: (p) => p.startsWith("/pools") },
      {
        href: routes.vaults(),
        label: "vaults",
        match: (p) => p.startsWith("/vaults") || p.startsWith("/prefarm"),
      },
    ],
  },
  {
    title: "learnPlay",
    items: [
      { href: routes.learn(), label: "learn", match: (p) => p.startsWith("/learn") },
      { href: routes.docs(), label: "help", match: (p) => p.startsWith("/docs") },
      { href: routes.gaming(), label: "arcade", match: (p) => p.startsWith("/gaming") },
    ],
  },
];

const MORE: NavItem[] = MORE_GROUPS.flatMap((group) => group.items);

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useT("shell");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-sm px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        active && "text-fg"
      )}
    >
      {item.label === "wallet" ? (
        <Wallet size={14} className="mr-1 inline" aria-hidden="true" />
      ) : null}
      {t(`nav.${item.label}`)}
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
  const t = useT("shell");
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  // The open menu hangs off the sticky header, and a sticky element never scrolls with the page,
  // so on a phone its last entries fell below the screen. While it is open the menu takes the
  // height left under it and scrolls itself, and the page behind it is locked.
  useEffect(() => {
    const nav = navRef.current;
    if (!open || !nav) return;
    const fit = () => {
      // Past lg the menu is hidden; close it so the page is not left locked.
      if (window.matchMedia("(min-width: 1024px)").matches) return setOpen(false);
      nav.style.maxHeight = `${window.innerHeight - nav.getBoundingClientRect().top}px`;
    };
    fit();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      root.style.overflow = previousOverflow;
    };
  }, [open]);
  const { inSage } = useSage();
  const wallet: NavItem = {
    href: routes.wallet(),
    label: "wallet",
    match: (p) => p.startsWith("/wallet"),
  };
  const primary = inSage ? [...PRIMARY, wallet] : PRIMARY;
  const moreActive = MORE.some((item) => item.match(pathname));
  const settings: NavItem = {
    href: routes.settings(),
    label: "settings",
    match: (p) => p.startsWith("/settings"),
  };
  const mobileGroups: NavGroup[] = [
    // Not "network": MORE_GROUPS has a group of that name, and titles key the list.
    { title: "liveChain", items: primary },
    ...MORE_GROUPS,
    { title: "you", items: [settings] },
  ];

  return (
    <header
      className="relative sticky top-0 z-40 border-b border-border bg-bg-elevated/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div aria-hidden="true" className="header-hairline absolute inset-x-0 bottom-0 h-px" />
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1280px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href={routes.home()} aria-label={t("home")} className="shrink-0">
          <Logo />
        </Link>
        <nav
          aria-label={t("primaryNav")}
          className={cn(
            "hidden shrink-0 items-center gap-0.5 transition-[opacity,width] duration-150 lg:flex",
            searchFocused && "lg:hidden"
          )}
        >
          {primary.map((item) => (
            <NavLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
          <Popover
            label={t("morePages")}
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
                {t("more")}
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
                <div key={t(`groups.${group.title}`)} className="flex flex-col">
                  <span
                    aria-hidden="true"
                    className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-faint"
                  >
                    {t(`groups.${group.title}`)}
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
                        {t(`nav.${item.label}`)}
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
          <LanguageSwitch className="hidden sm:inline-flex" />
          <ConnectionIndicator compact />
          <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />
          <Link
            href={routes.settings()}
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg sm:inline-flex"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            title={open ? t("closeMenu") : t("openMenu")}
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
          ref={navRef}
          aria-label={t("mobileNav")}
          className="overflow-y-auto overscroll-contain border-t border-border bg-bg-elevated px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {mobileGroups.map((group, index) => (
              <li key={t(`groups.${group.title}`)}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-faint",
                    index > 0 && "mt-2 border-t border-border/60 pt-3"
                  )}
                >
                  {t(`groups.${group.title}`)}
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
                        {t(`nav.${item.label}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li className="flex items-center gap-2 pt-2 sm:hidden">
              <NetworkSwitch />
              <LanguageSwitch />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
