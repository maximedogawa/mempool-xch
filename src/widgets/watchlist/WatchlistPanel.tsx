"use client";

import { Bell, BellOff, Eye, PieChart, Plus, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { parseSearchInput } from "@/features/search/parse";
import { formatHandle, parseHandle } from "@/shared/lib/handles/xchandles";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { shortId } from "@/shared/lib/chia/hex";
import {
  notificationsSupported,
  requestNotificationPermission,
  sendNotification,
} from "@/shared/lib/notify/browser";
import { playCoinChime, primeAudio } from "@/shared/lib/sound/chime";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useT } from "@/shared/i18n/useT";
import { Card, CardBody, CardHeader } from "@/shared/ui";
import { WatchedAddressRow } from "./WatchedAddressRow";
import { WatchedDidRow } from "./WatchedDidRow";
import { WatchedHandleRow } from "./WatchedHandleRow";
import { WatchedTxRow } from "./WatchedTxRow";
import { useWatchlist } from "./useWatchlist";
import watchlistNs from "@/shared/i18n/messages/en/watchlist";

/**
 * Follow addresses, transactions, DIDs and XCHandles handles without a Sage wallet: pending
 * status with queue position, a confirmation chime and opt-in browser notifications, plus what a
 * watched DID holds and where a watched handle points. Everything lives in localStorage
 * (src/shared/lib/watchlist/store.ts); nothing is sent anywhere.
 */
export function WatchlistPanel() {
  const t = useT(watchlistNs);
  const { settings, update } = useSettings();
  const { items, add, remove } = useWatchlist();
  const projected = useProjectedBlocks(8);
  const projectedItems = projected.summary?.items;
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  // Notification.prototype only exists in the browser; checking it during render would make the
  // server-rendered HTML (no window) disagree with the first client render, so it is deferred to
  // an effect and starts false to match the server output.
  const [canNotify, setCanNotify] = useState(false);
  useEffect(() => setCanNotify(notificationsSupported()), []);

  const notify = useCallback(
    (title: string, body?: string) => {
      if (settings.sounds) void playCoinChime(0.5);
      if (settings.notifications) sendNotification(title, body);
    },
    [settings.sounds, settings.notifications]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    const target = parseSearchInput(input);
    const handle = target.kind === "text" ? parseHandle(target.value) : null;
    if (target.kind === "address") {
      add({ kind: "address", id: target.puzzleHash, label: target.address });
    } else if (target.kind === "hex32") {
      add({ kind: "tx", id: target.hex, label: shortId(target.hex) });
    } else if (target.kind === "did") {
      add({ kind: "did", id: target.launcherId, label: target.didId });
    } else if (handle) {
      // A bare name is an XCHandles handle. It is added without asking the registry first: an
      // unregistered handle is a fine thing to watch, and the row says so until someone takes it.
      add({ kind: "handle", id: handle, label: formatHandle(handle) });
    } else {
      setError(true);
      return;
    }
    setInput("");
  };

  const toggleSound = () => {
    primeAudio();
    const next = !settings.sounds;
    update({ sounds: next });
    if (next) void playCoinChime(0.5);
  };

  const toggleNotifications = async () => {
    if (settings.notifications) {
      update({ notifications: false });
      return;
    }
    const permission = await requestNotificationPermission();
    update({ notifications: permission === "granted" });
  };

  return (
    <Card role="region" aria-label={t("panel.title")} className="overflow-hidden border-primary/20">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Eye size={17} className="text-primary" aria-hidden="true" />
            {items.length ? t("panel.titleCount", { count: items.length }) : t("panel.title")}
          </span>
        }
        action={
          <span className="inline-flex items-center gap-2">
            {items.some((i) => i.kind === "address") ? (
              <Link
                href={routes.portfolio()}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-border px-2.5 text-xs font-semibold text-fg-muted hover:text-fg"
              >
                <PieChart size={14} aria-hidden="true" />
                {t("panel.portfolio")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={settings.sounds}
              aria-label={settings.sounds ? t("panel.muteChime") : t("panel.playChime")}
              title={settings.sounds ? t("panel.chimeOn") : t("panel.chimeOff")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg/50 text-fg-muted transition-colors hover:border-primary/40 hover:text-primary"
            >
              {settings.sounds ? (
                <Volume2 size={14} aria-hidden="true" />
              ) : (
                <VolumeX size={14} aria-hidden="true" />
              )}
            </button>
            {canNotify ? (
              <button
                type="button"
                onClick={() => void toggleNotifications()}
                aria-pressed={settings.notifications}
                aria-label={
                  settings.notifications
                    ? t("panel.turnOffNotifications")
                    : t("panel.turnOnNotifications")
                }
                title={
                  settings.notifications ? t("panel.notificationsOn") : t("panel.notificationsOff")
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg/50 text-fg-muted transition-colors hover:border-primary/40 hover:text-primary"
              >
                {settings.notifications ? (
                  <Bell size={14} aria-hidden="true" />
                ) : (
                  <BellOff size={14} aria-hidden="true" />
                )}
              </button>
            ) : null}
          </span>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <p className="text-xs text-fg-muted">{t("panel.intro")}</p>
        <form
          onSubmit={onSubmit}
          className="flex flex-wrap gap-2 rounded-xl border border-border bg-bg/50 p-2"
        >
          <label htmlFor="watchlist-add" className="sr-only">
            {t("panel.addLabel")}
          </label>
          <input
            id="watchlist-add"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("panel.placeholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "watchlist-add-error" : undefined}
            className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-strong"
          >
            <Plus size={15} aria-hidden="true" />
            {t("panel.watch")}
          </button>
        </form>
        {error ? (
          <p id="watchlist-add-error" role="alert" className="text-xs text-danger">
            {t("panel.invalid")}
          </p>
        ) : null}
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 px-4 text-center text-sm text-fg-faint">
            {t("panel.empty")}
          </p>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {items.map((item) =>
              item.kind === "handle" ? (
                <WatchedHandleRow
                  key={`handle:${item.id}`}
                  item={item}
                  onRemove={() => remove("handle", item.id)}
                />
              ) : item.kind === "did" ? (
                <WatchedDidRow
                  key={`did:${item.id}`}
                  item={item}
                  onRemove={() => remove("did", item.id)}
                />
              ) : item.kind === "tx" ? (
                <WatchedTxRow
                  key={`tx:${item.id}`}
                  item={item}
                  projectedItems={projectedItems}
                  projectedBlocks={projected.blocks}
                  onConfirmed={(it, height) =>
                    notify(
                      t("panel.notifyConfirmed", { label: it.label }),
                      height ? t("common.block", { height: String(height) }) : undefined
                    )
                  }
                  onRemove={() => remove("tx", item.id)}
                />
              ) : (
                <WatchedAddressRow
                  key={`address:${item.id}`}
                  item={item}
                  projectedItems={projectedItems}
                  projectedBlocks={projected.blocks}
                  onConfirmed={(it, txId) =>
                    notify(t("panel.notifyConfirmed", { label: it.label }), shortId(txId))
                  }
                  onReceived={(it, txId) =>
                    notify(t("panel.notifyIncoming", { label: it.label }), shortId(txId))
                  }
                  onRemove={() => remove("address", item.id)}
                />
              )
            )}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
