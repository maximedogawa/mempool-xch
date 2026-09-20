"use client";

import { Bell, BellOff, Eye, Plus, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { parseSearchInput } from "@/features/search/parse";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { shortId } from "@/shared/lib/chia/hex";
import {
  notificationsSupported,
  requestNotificationPermission,
  sendNotification,
} from "@/shared/lib/notify/browser";
import { playCoinChime, primeAudio } from "@/shared/lib/sound/chime";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader } from "@/shared/ui";
import { WatchedAddressRow } from "./WatchedAddressRow";
import { WatchedDidRow } from "./WatchedDidRow";
import { WatchedTxRow } from "./WatchedTxRow";
import { useWatchlist } from "./useWatchlist";

/**
 * Follow addresses, transactions and DIDs without a Sage wallet: pending status with queue
 * position, a confirmation chime and opt-in browser notifications, plus what a watched DID
 * holds. Everything lives in localStorage (src/shared/lib/watchlist/store.ts); nothing is sent
 * anywhere.
 */
export function WatchlistPanel() {
  const { settings, update } = useSettings();
  const { items, add, remove } = useWatchlist();
  const projected = useProjectedBlocks(8);
  const projectedItems = projected.summary?.items;
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    const target = parseSearchInput(input);
    if (target.kind === "address") {
      add({ kind: "address", id: target.puzzleHash, label: target.address });
    } else if (target.kind === "hex32") {
      add({ kind: "tx", id: target.hex, label: shortId(target.hex) });
    } else if (target.kind === "did") {
      add({ kind: "did", id: target.launcherId, label: target.didId });
    } else {
      setError("Paste an address, a did:chia: id or a 64-character transaction id.");
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
    <Card role="region" aria-label="Watchlist" className="overflow-hidden border-primary/20">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Eye size={17} className="text-primary" aria-hidden="true" />
            {items.length ? `Watchlist · ${items.length}` : "Watchlist"}
          </span>
        }
        action={
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={settings.sounds}
              aria-label={
                settings.sounds
                  ? "Mute the watchlist chime"
                  : "Play a chime when a watched item confirms"
              }
              title={settings.sounds ? "Watchlist chime on" : "Watchlist chime off"}
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
                    ? "Turn off browser notifications"
                    : "Turn on browser notifications"
                }
                title={
                  settings.notifications ? "Browser notifications on" : "Browser notifications off"
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
        <p className="text-xs text-fg-muted">
          Follow incoming assets and confirmations. Watched transactions are marked in the blocks
          above, and a watched DID shows the NFTs it holds.
        </p>
        <form
          onSubmit={onSubmit}
          className="flex flex-wrap gap-2 rounded-xl border border-border bg-bg/50 p-2"
        >
          <label htmlFor="watchlist-add" className="sr-only">
            Add an address, DID or transaction id to your watchlist
          </label>
          <input
            id="watchlist-add"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Address, DID or transaction id"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "watchlist-add-error" : undefined}
            className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-strong"
          >
            <Plus size={15} aria-hidden="true" />
            Watch
          </button>
        </form>
        {error ? (
          <p id="watchlist-add-error" role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 px-4 text-center text-sm text-fg-faint">
            Nothing watched yet. Add an address, DID or transaction above, or use the Watch button
            on its page.
          </p>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {items.map((item) =>
              item.kind === "did" ? (
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
                    notify(`Confirmed: ${it.label}`, height ? `Block ${height}` : undefined)
                  }
                  onRemove={() => remove("tx", item.id)}
                />
              ) : (
                <WatchedAddressRow
                  key={`address:${item.id}`}
                  item={item}
                  projectedItems={projectedItems}
                  projectedBlocks={projected.blocks}
                  onConfirmed={(it, txId) => notify(`Confirmed: ${it.label}`, shortId(txId))}
                  onReceived={(it, txId) => notify(`Incoming to ${it.label}`, shortId(txId))}
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
