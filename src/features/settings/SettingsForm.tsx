"use client";

import { CheckCircle2, Loader2, Monitor, Moon, RotateCcw, Sun, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NETWORK_IDS, NETWORKS, isCoinsetUrl, type NetworkId } from "@/shared/config/networks";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import { createRpcClient } from "@/shared/lib/rpc/client";
import { errorMessage } from "@/shared/lib/rpc/errors";
import type { ThemePreference } from "@/shared/lib/settings/store";
import { useSage } from "@/shared/providers/SageProvider";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { describeChannel } from "@/shared/lib/live/channel";
import { requestEndpointWhitelist } from "@/shared/lib/sage/wallet";
import { Button, Card, CardBody, CardHeader } from "@/shared/ui";

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; height: number; ms: number; coinset: boolean }
  | { status: "error"; message: string }
  | { status: "whitelist"; message: string; ok: boolean };

/** Which live channel this tab is on and where the data comes from (same words as the pill and footer). */
function ChannelLine() {
  const { endpoints } = useSettings();
  const status = useLiveValue("status");
  const transport = useLiveValue("transport");
  const channel = describeChannel({
    status,
    transport,
    rpcUrl: endpoints.rpcUrl,
    wsUrl: endpoints.wsUrl,
    isCoinset: endpoints.isCoinset,
  });
  return (
    <p className="rounded-sm border border-border bg-bg px-3 py-2 text-xs text-fg-muted">
      <strong className="text-fg">Live channel: {channel.name}.</strong> {channel.detail} Everything
      is read from the endpoint directly.
    </p>
  );
}

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  hint: string;
  icon: typeof Moon;
  /** Preview swatch: page, card and accent, hard-coded so each shows its own theme. */
  swatch: [string, string, string];
}[] = [
  {
    value: "dark",
    label: "Dark",
    hint: "mempool.space style",
    icon: Moon,
    swatch: ["#0f1220", "#232842", "#5ece7b"],
  },
  {
    value: "light",
    label: "Light",
    hint: "bright and crisp",
    icon: Sun,
    swatch: ["#eef1f7", "#ffffff", "#176c33"],
  },
  {
    value: "system",
    label: "System",
    hint: "follows your device",
    icon: Monitor,
    swatch: ["#0f1220", "#ffffff", "#5ece7b"],
  },
];

/**
 * Theme as three cards with a preview, instead of a native select whose menu the OS draws.
 * Inside Sage the wallet's theme wins (ThemeProvider), so the choice is shown but locked.
 */
function ThemePicker() {
  const { settings, update } = useSettings();
  const { inSage, sageTheme } = useSage();
  const locked = inSage && sageTheme !== null;
  const active: ThemePreference = locked ? sageTheme : settings.theme;
  return (
    <fieldset className="flex flex-col gap-2 text-sm" disabled={locked}>
      <legend className="mb-2 font-medium">Theme</legend>
      <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-2">
        {THEME_OPTIONS.map(({ value, label, hint, icon: Icon, swatch }) => {
          const checked = active === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => update({ theme: value })}
              className={cn(
                "flex flex-col gap-2 rounded-sm border p-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed",
                checked
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-bg hover:border-border-strong hover:bg-surface-2",
                locked && !checked && "opacity-50"
              )}
            >
              <span
                aria-hidden="true"
                className="relative flex h-10 overflow-hidden rounded-[4px] border border-border"
                style={{
                  background:
                    value === "system"
                      ? `linear-gradient(135deg, ${swatch[0]} 50%, ${swatch[1]} 50%)`
                      : swatch[0],
                }}
              >
                {value !== "system" ? (
                  <span
                    className="absolute inset-x-2 bottom-1.5 top-2 rounded-[3px]"
                    style={{ background: swatch[1] }}
                  >
                    <span
                      className="absolute left-1.5 top-1.5 h-1.5 w-6 rounded-full"
                      style={{ background: swatch[2] }}
                    />
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Icon size={14} aria-hidden="true" className={checked ? "text-primary" : ""} />
                {label}
              </span>
              <span className="text-xs text-fg-muted">{hint}</span>
            </button>
          );
        })}
      </div>
      {locked ? (
        <p className="text-xs text-fg-muted">
          Inside Sage the app follows the wallet&apos;s theme (currently {sageTheme}). Change it in
          Sage&apos;s settings.
        </p>
      ) : null}
    </fieldset>
  );
}

function EndpointRow({ network }: { network: NetworkId }) {
  const { settings, update } = useSettings();
  const { inSage } = useSage();
  const config = NETWORKS[network];
  const value = settings.endpoints[network].rpcUrl;
  const [draft, setDraft] = useState(value);
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const dirty = draft.trim() !== value;
  const isDefault = value === config.rpcUrl;

  const runTest = async () => {
    setTest({ status: "testing" });
    const started = performance.now();
    try {
      const client = createRpcClient({ rpcUrl: draft.trim(), indexedUrl: null, timeoutMs: 10_000 });
      const state = await client.getBlockchainState();
      setTest({
        status: "ok",
        height: state.peak.height,
        ms: Math.round(performance.now() - started),
        coinset: isCoinsetUrl(network, draft),
      });
    } catch (error) {
      setTest({ status: "error", message: errorMessage(error) });
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`rpc-${network}`} className="text-sm font-semibold">
          {config.label}{" "}
          <span className="font-normal text-fg-faint">({config.addressPrefix} addresses)</span>
        </label>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
            isDefault
              ? "bg-primary-soft text-primary"
              : "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-warning"
          )}
        >
          {isDefault ? "Coinset default" : isCoinsetUrl(network, value) ? "Coinset" : "Custom node"}
        </span>
      </div>
      <input
        id={`rpc-${network}`}
        type="url"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setTest({ status: "idle" });
        }}
        placeholder={config.rpcUrl}
        spellCheck={false}
        className="mono h-10 w-full rounded-sm border border-border bg-bg-elevated px-3 text-sm focus:border-primary focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={runTest} disabled={test.status === "testing" || !draft.trim()}>
          {test.status === "testing" ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : null}{" "}
          Test connection
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!dirty}
          onClick={async () => {
            const rpcUrl = draft.trim();
            if (inSage && !isCoinsetUrl(network, rpcUrl)) {
              // Sage blocks calls to hosts outside the granted whitelist: ask for this one first.
              const result = await requestEndpointWhitelist(rpcUrl, network);
              if (result === "unsupported") {
                setTest({
                  status: "whitelist",
                  ok: false,
                  message: "Inside Sage only https endpoints can be whitelisted.",
                });
                return;
              }
              if (result === "refused") {
                setTest({
                  status: "whitelist",
                  ok: false,
                  message: "Sage did not allow this host; the endpoint was not saved.",
                });
                return;
              }
              setTest({ status: "whitelist", ok: true, message: "Sage allowed this host." });
            }
            update((prev) => ({
              ...prev,
              endpoints: { ...prev.endpoints, [network]: { rpcUrl } },
            }));
          }}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isDefault && !dirty}
          onClick={() => {
            setDraft(config.rpcUrl);
            setTest({ status: "idle" });
            update((prev) => ({
              ...prev,
              endpoints: { ...prev.endpoints, [network]: { rpcUrl: config.rpcUrl } },
            }));
          }}
        >
          <RotateCcw size={14} aria-hidden="true" /> Reset to Coinset
        </Button>
        {test.status === "ok" ? (
          <span role="status" className="inline-flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 size={14} aria-hidden="true" /> Peak {test.height.toLocaleString("en-US")}{" "}
            in {test.ms} ms
            {test.coinset ? "" : " · custom node: indexed API, WebSocket and summary API off"}
          </span>
        ) : null}
        {test.status === "whitelist" ? (
          <span
            role="status"
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              test.ok ? "text-primary" : "text-danger"
            )}
          >
            {test.ok ? (
              <CheckCircle2 size={14} aria-hidden="true" />
            ) : (
              <XCircle size={14} aria-hidden="true" />
            )}{" "}
            {test.message}
          </span>
        ) : null}
        {test.status === "error" ? (
          <span role="alert" className="inline-flex items-center gap-1 text-xs text-danger">
            <XCircle size={14} aria-hidden="true" /> {test.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsForm() {
  const { settings, update, reset, endpoints } = useSettings();
  const { inSage } = useSage();
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="Network" />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Active network">
            {NETWORK_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={settings.network === id}
                onClick={() => update({ network: id })}
                className={cn(
                  "min-h-11 rounded-sm border px-4 text-sm font-semibold transition-colors",
                  settings.network === id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-bg text-fg-muted hover:text-fg"
                )}
              >
                {NETWORKS[id].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-fg-faint">
            The whole app follows the active network: address prefixes, explorer links, the live
            stream and the mempool summary. Active endpoint:{" "}
            <span className="mono text-fg-muted">{endpoints.rpcUrl}</span>
          </p>
          <ChannelLine />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Full-node RPC endpoints" />
        <CardBody className="flex flex-col gap-3">
          {inSage ? (
            <p className="rounded-sm border border-primary/40 bg-primary-soft px-3 py-2 text-xs text-fg-muted">
              <strong className="text-primary">Inside Sage:</strong> your balance, coins and
              transactions come from the wallet itself. Sage&apos;s app bridge has no node RPC (no
              peak, mempool or block queries), so chain-wide data comes from the endpoint below; a
              custom endpoint is whitelisted in Sage when you save it.
            </p>
          ) : null}
          <p className="text-sm text-fg-muted">
            By default mempoolxch.space reads the chain through{" "}
            <a
              href="https://coinset.org"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Coinset
            </a>
            &apos;s public full-node RPC, so no own node is needed, straight from your browser. You
            can point each network at any Chia full-node-RPC-compatible HTTPS endpoint instead.
            Coinset-only features (semantic transaction summaries, address history and the WebSocket
            stream) switch off automatically for custom endpoints and the app falls back to polling
            and to fetching the raw mempool in the browser.
          </p>
          {NETWORK_IDS.map((id) => (
            <EndpointRow key={id} network={id} />
          ))}
          <div className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-3 text-xs text-fg-muted">
            <strong className="text-warning">Using your own node?</strong> A stock Chia full node
            listens on <span className="mono">https://localhost:8555</span> with mutual TLS: it
            requires the node&apos;s client certificate, which a browser cannot present, and it
            sends no CORS headers. Put a small reverse proxy in front of it that terminates TLS with
            the client certificate and adds{" "}
            <span className="mono">Access-Control-Allow-Origin</span>, then enter the proxy URL
            here.{" "}
            <Link href={`${routes.docs()}#custom-node`} className="text-accent hover:underline">
              Step-by-step guide
            </Link>
            .
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Appearance" />
        <CardBody className="flex flex-col gap-3">
          <ThemePicker />
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.sounds}
              onChange={(e) => update({ sounds: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">Confirmation chime</span>
              <span className="block text-xs text-fg-muted">
                A soft coin sound when one of your wallet&apos;s transactions lands in a block (Sage
                only).
              </span>
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Recent blocks on the dashboard</span>
            <input
              type="number"
              min={3}
              max={20}
              value={settings.recentBlocks}
              onChange={(e) => update({ recentBlocks: Number(e.target.value) })}
              className="h-10 w-full max-w-xs rounded-sm border border-border bg-bg px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        </CardBody>
      </Card>

      <div>
        <Button variant="danger" size="sm" onClick={reset}>
          Reset all settings
        </Button>
      </div>
    </div>
  );
}
