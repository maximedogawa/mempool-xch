"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  NETWORK_IDS,
  NETWORKS,
  isCoinsetUrl,
  isNodexchUrl,
  providerOf,
  type NetworkId,
  type Provider,
} from "@/shared/config/networks";
import { LOCALE_NAMES, LOCALES, type LocalePreference } from "@/shared/i18n/config";
import { formatInteger } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import { createRpcClient } from "@/shared/lib/rpc/client";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { PUBLISHABLE_KEY, type Endpoint } from "@/shared/lib/settings/store";
import { SCHEME_THEMES, THEMES, type ThemeId, type ThemePreference } from "@/shared/theme";
import { useSage } from "@/shared/providers/SageProvider";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { describeChannel } from "@/shared/lib/live/channel";
import { requestEndpointWhitelist } from "@/shared/lib/sage/wallet";
import { Button, Card, CardBody, CardHeader } from "@/shared/ui";
import settingsNs from "@/shared/i18n/messages/en/settings";

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | {
      status: "ok";
      height: number;
      ms: number;
      provider: Provider;
      synced: boolean;
      syncTipHeight: number | null;
    }
  | { status: "error"; message: string }
  | { status: "whitelist"; message: string; ok: boolean };

/** Which live channel this tab is on and where the data comes from (same words as the pill and footer). */
function ChannelLine() {
  const t = useT(settingsNs);
  const { endpoints } = useSettings();
  const status = useLiveValue("status");
  const transport = useLiveValue("transport");
  const channel = describeChannel({
    status,
    transport,
    rpcUrl: endpoints.rpcUrl,
    wsUrl: endpoints.wsUrl,
    isCoinset: endpoints.isCoinset,
    provider: endpoints.provider,
  });
  return (
    <p className="rounded-sm border border-border bg-bg px-3 py-2 text-xs text-fg-muted">
      {t.rich("channel", {
        name: channel.name,
        detail: channel.detail,
        strong: (c) => <strong className="text-fg">{c}</strong>,
      })}
    </p>
  );
}

/** Every registered theme, then "system". Adding a theme to src/shared/theme adds a card here. */
const THEME_OPTIONS: { value: ThemePreference; icon: typeof Moon }[] = [
  ...THEMES.map((theme) => ({ value: theme.id, icon: theme.scheme === "dark" ? Moon : Sun })),
  { value: "system", icon: Monitor },
];

/** A page, a card and the CTA, drawn in the theme's own tokens by carrying its data-theme. */
function ThemeSwatch({ theme }: { theme: ThemeId }) {
  return (
    <span data-theme={theme} className="absolute inset-0 bg-bg">
      <span className="absolute inset-x-2 bottom-1.5 top-2 rounded-[3px] border border-border bg-surface">
        <span className="absolute left-1.5 top-1.5 h-1.5 w-6 rounded-full bg-cta" />
      </span>
    </span>
  );
}

/**
 * Theme as cards with a preview, instead of a native select whose menu the OS draws.
 * Inside Sage the wallet's theme wins (ThemeProvider), so the choice is shown but locked.
 */
function ThemePicker() {
  const { settings, update } = useSettings();
  const { inSage, sageTheme } = useSage();
  const sageThemeId = inSage && sageTheme ? SCHEME_THEMES[sageTheme] : null;
  const locked = sageThemeId !== null;
  const active: ThemePreference = sageThemeId ?? settings.theme;
  const t = useT(settingsNs);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 text-sm" disabled={locked}>
      <legend className="mb-2 font-medium">{t("appearance.theme")}</legend>
      <div
        role="radiogroup"
        aria-label={t("appearance.theme")}
        className="grid max-w-md grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2"
      >
        {THEME_OPTIONS.map(({ value, icon: Icon }) => {
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
              >
                {value === "system" ? (
                  <>
                    <ThemeSwatch theme={SCHEME_THEMES.light} />
                    <span className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                      <span className="absolute inset-y-0 right-0 w-[200%]">
                        <ThemeSwatch theme={SCHEME_THEMES.dark} />
                      </span>
                    </span>
                  </>
                ) : (
                  <ThemeSwatch theme={value} />
                )}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Icon size={14} aria-hidden="true" className={checked ? "text-primary" : ""} />
                {t(`appearance.${value}`)}
              </span>
              <span className="text-xs text-fg-muted">{t(`appearance.${value}Hint`)}</span>
            </button>
          );
        })}
      </div>
      {locked ? (
        <p className="text-xs text-fg-muted">
          {t("appearance.sageLocked", { theme: t(`appearance.${sageThemeId ?? active}`) })}
        </p>
      ) : null}
    </fieldset>
  );
}

function EndpointRow({ network }: { network: NetworkId }) {
  const t = useT(settingsNs);
  const { settings, update } = useSettings();
  const { inSage } = useSage();
  const config = NETWORKS[network];
  const saved = settings.endpoints[network];
  const value = saved.rpcUrl;
  // The fields follow the saved endpoint until the visitor types: the first render still sees
  // the defaults before the stored settings are read, so a draft fixed at mount would show, and
  // test, the default instead of the saved custom node (TASK-109).
  const [edited, setEdited] = useState<string | null>(null);
  const draft = edited ?? value;
  const setDraft = setEdited;
  // A nodexch gateway on a host the app does not know (self-hosted), and its publishable key.
  const [editedNodexch, setDraftNodexch] = useState<boolean | null>(null);
  const draftNodexch = editedNodexch ?? saved.provider === "nodexch";
  const [editedKey, setDraftKey] = useState<string | null>(null);
  const draftKey = editedKey ?? saved.apiKey ?? "";
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const provider = providerOf(network, draft.trim(), draftNodexch ? "nodexch" : undefined);
  const savedProvider = providerOf(network, value, saved.provider);
  const keyInvalid = draftKey.trim() !== "" && !PUBLISHABLE_KEY.test(draftKey.trim());
  const dirty =
    draft.trim() !== value ||
    draftNodexch !== (saved.provider === "nodexch") ||
    draftKey.trim() !== (saved.apiKey ?? "");
  const isDefault = value === config.rpcUrl && savedProvider === providerOf(network, config.rpcUrl);

  /** What Save stores: the flag only where the host alone does not say nodexch. */
  const endpointOf = (rpcUrl: string): Endpoint => {
    const endpoint: Endpoint = { rpcUrl };
    if (draftNodexch && !isCoinsetUrl(network, rpcUrl) && !isNodexchUrl(network, rpcUrl))
      endpoint.provider = "nodexch";
    if (providerOf(network, rpcUrl, endpoint.provider) === "nodexch" && draftKey.trim())
      endpoint.apiKey = draftKey.trim();
    return endpoint;
  };

  const runTest = async () => {
    setTest({ status: "testing" });
    const started = performance.now();
    try {
      const rpcUrl = draft.trim();
      const client = createRpcClient({
        rpcUrl,
        indexedUrl: null,
        timeoutMs: 10_000,
        nodexch:
          provider === "nodexch"
            ? { apiKey: draftKey.trim() || config.nodexchKey || null }
            : undefined,
      });
      const state = await client.getBlockchainState();
      setTest({
        status: "ok",
        height: state.peak.height,
        ms: Math.round(performance.now() - started),
        provider,
        synced: state.synced,
        syncTipHeight: state.syncTipHeight,
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
          <span className="font-normal text-fg-faint">
            {t("endpoint.addresses", { prefix: config.addressPrefix })}
          </span>
        </label>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
            savedProvider !== "custom"
              ? "bg-primary-soft text-primary"
              : "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-warning"
          )}
        >
          {isDefault
            ? savedProvider === "nodexch"
              ? t("endpoint.nodexchDefault")
              : t("endpoint.coinsetDefault")
            : savedProvider === "coinset"
              ? "Coinset"
              : savedProvider === "nodexch"
                ? t("endpoint.nodexch")
                : t("endpoint.customNode")}
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
        className="field mono w-full"
      />
      {provider !== "coinset" && !isNodexchUrl(network, draft.trim()) ? (
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          <input
            type="checkbox"
            checked={draftNodexch}
            onChange={(e) => {
              setDraftNodexch(e.target.checked);
              setTest({ status: "idle" });
            }}
          />
          {t("endpoint.nodexchToggle")}
        </label>
      ) : null}
      {provider === "nodexch" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`key-${network}`} className="text-xs font-medium">
            {t("endpoint.apiKey")}
          </label>
          <input
            id={`key-${network}`}
            type="text"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder={t("endpoint.apiKeyHint")}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={keyInvalid}
            className="mono h-9 w-full rounded-sm border border-border bg-bg-elevated px-3 text-xs focus:border-primary focus:outline-none"
          />
          {keyInvalid ? (
            <span role="alert" className="text-xs text-danger">
              {t("endpoint.apiKeyInvalid")}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {config.nodexchUrl && draft.trim() !== config.nodexchUrl ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(config.nodexchUrl!);
              setDraftNodexch(false);
              setTest({ status: "idle" });
            }}
          >
            {t("endpoint.nodexchPreset")}
          </Button>
        ) : null}
        <Button size="sm" onClick={runTest} disabled={test.status === "testing" || !draft.trim()}>
          {test.status === "testing" ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : null}{" "}
          {t("endpoint.test")}
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!dirty || keyInvalid}
          onClick={async () => {
            const rpcUrl = draft.trim();
            if (inSage && !isCoinsetUrl(network, rpcUrl)) {
              // Sage blocks calls to hosts outside the granted whitelist: ask for this one first.
              const result = await requestEndpointWhitelist(rpcUrl, network);
              if (result === "unsupported") {
                setTest({
                  status: "whitelist",
                  ok: false,
                  message: t("endpoint.sageHttpsOnly"),
                });
                return;
              }
              if (result === "refused") {
                setTest({
                  status: "whitelist",
                  ok: false,
                  message: t("endpoint.sageRefused"),
                });
                return;
              }
              setTest({ status: "whitelist", ok: true, message: t("endpoint.sageAllowed") });
            }
            update((prev) => ({
              ...prev,
              endpoints: { ...prev.endpoints, [network]: endpointOf(rpcUrl) },
            }));
            setEdited(null);
          }}
        >
          {t("endpoint.save")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isDefault && !dirty}
          onClick={() => {
            setEdited(null);
            setDraftNodexch(null);
            setDraftKey(null);
            setTest({ status: "idle" });
            update((prev) => ({
              ...prev,
              endpoints: { ...prev.endpoints, [network]: { rpcUrl: config.rpcUrl } },
            }));
          }}
        >
          <RotateCcw size={14} aria-hidden="true" /> {t("endpoint.reset")}
        </Button>
        {test.status === "ok" ? (
          <span role="status" className="inline-flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 size={14} aria-hidden="true" />{" "}
            {t(
              test.provider === "coinset"
                ? "endpoint.ok"
                : test.provider === "nodexch"
                  ? "endpoint.okNodexch"
                  : "endpoint.okCustom",
              {
                height: formatInteger(test.height),
                ms: test.ms,
              }
            )}
          </span>
        ) : null}
        {test.status === "ok" && !test.synced ? (
          // Answers, but behind the chain: everything the app shows from it is old until it is in.
          <span role="status" className="inline-flex items-center gap-1 text-xs text-warning">
            <AlertTriangle size={14} aria-hidden="true" />{" "}
            {test.syncTipHeight
              ? t("endpoint.syncing", {
                  height: formatInteger(test.height),
                  tip: formatInteger(test.syncTipHeight),
                  percent: Math.floor((test.height / test.syncTipHeight) * 1000) / 10,
                })
              : t("endpoint.syncingNoTip")}
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
  const t = useT(settingsNs);
  const { settings, update, reset, endpoints } = useSettings();
  const { inSage } = useSage();
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title={t("network.title")} />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("network.active")}>
            {NETWORK_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={settings.network === id}
                onClick={() => update({ network: id })}
                className={cn("seg text-sm", settings.network === id && "seg-on")}
              >
                {NETWORKS[id].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-fg-faint">
            {t.rich("network.intro", {
              url: endpoints.rpcUrl,
              endpoint: (c) => <span className="mono text-fg-muted">{c}</span>,
            })}
          </p>
          <ChannelLine />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("endpoints.title")} />
        <CardBody className="flex flex-col gap-3">
          {inSage ? (
            <p className="rounded-sm border border-primary/40 bg-primary-soft px-3 py-2 text-xs text-fg-muted">
              {t.rich("endpoints.sage", {
                strong: (c) => <strong className="text-primary">{c}</strong>,
              })}
            </p>
          ) : null}
          <p className="text-sm text-fg-muted">
            {t.rich("endpoints.intro", {
              coinset: (c) => (
                <a
                  href="https://coinset.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {c}
                </a>
              ),
            })}
          </p>
          {NETWORK_IDS.map((id) => (
            <EndpointRow key={id} network={id} />
          ))}
          <p className="rounded-sm border border-border bg-bg p-3 text-xs text-fg-muted">
            {t.rich("endpoints.nodexch", {
              strong: (c) => <strong className="text-fg">{c}</strong>,
              code: (c) => <span className="mono">{c}</span>,
            })}
          </p>
          <div className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-3 text-xs text-fg-muted">
            {t.rich("endpoints.ownNode", {
              strong: (c) => <strong className="text-warning">{c}</strong>,
              code: (c) => <span className="mono">{c}</span>,
              guide: (c) => (
                <Link
                  href={`${routes.docs()}#custom-node`}
                  className="text-accent underline underline-offset-2"
                >
                  {c}
                </Link>
              ),
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("appearance.title")} />
        <CardBody className="flex flex-col gap-3">
          <ThemePicker />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("appearance.language")}</span>
            <select
              value={settings.locale}
              onChange={(e) => update({ locale: e.target.value as LocalePreference })}
              data-testid="settings-language"
              className="field w-full max-w-xs"
            >
              <option value="auto">{t("appearance.languageAuto")}</option>
              {LOCALES.map((id) => (
                <option key={id} value={id} lang={id}>
                  {LOCALE_NAMES[id]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.sounds}
              onChange={(e) => update({ sounds: e.target.checked })}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">{t("appearance.chime")}</span>
              <span className="block text-xs text-fg-muted">{t("appearance.chimeHint")}</span>
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("appearance.recentBlocks")}</span>
            <input
              type="number"
              min={3}
              max={20}
              value={settings.recentBlocks}
              onChange={(e) => update({ recentBlocks: Number(e.target.value) })}
              className="field w-full max-w-xs"
            />
          </label>
        </CardBody>
      </Card>

      <div>
        <Button variant="danger" size="sm" onClick={reset}>
          {t("resetAll")}
        </Button>
      </div>
    </div>
  );
}
