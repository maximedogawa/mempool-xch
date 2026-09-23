"use client";

import { useState, type ReactNode } from "react";
import {
  API_GROUPS,
  RPC_BASE,
  RPC_BASE_TESTNET,
  WS_URL,
  type ApiEndpoint,
} from "@/shared/config/apiReference";
import apiEnglish from "@/shared/i18n/messages/en/api";
import { useT } from "@/shared/i18n/useT";
import { Badge, Card, CardBody, CardHeader, CopyButton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { routes } from "@/shared/lib/routes";

function curl(endpoint: ApiEndpoint): string {
  return `curl -s -X POST ${RPC_BASE}/${endpoint.method} \\\n  -H "content-type: application/json" \\\n  -d '${endpoint.body}'`;
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  const t = useT("api");
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-border/60 py-2.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-start justify-between gap-2 text-left"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="mono text-sm font-semibold text-fg">{endpoint.method}</span>
          <Badge tone={endpoint.api === "indexed" ? "info" : "neutral"}>
            {endpoint.api === "indexed" ? t("coinsetOnly") : t("anyFullNode")}
          </Badge>
        </span>
        <span className="text-xs text-fg-faint">{open ? t("hideExample") : t("showExample")}</span>
      </button>
      <p className="mt-1 text-sm text-fg-muted">{t(`endpoints.${endpoint.method}`)}</p>
      {open ? (
        <div className="mt-2 flex items-start gap-2">
          <pre
            tabIndex={0}
            className="mono w-full overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted"
          >
            {curl(endpoint)}
          </pre>
          <CopyButton value={curl(endpoint)} />
        </div>
      ) : null}
    </li>
  );
}

const SITE = "https://mempoolxch.space";

type EmbedId = keyof typeof apiEnglish.embeds.items;

const EMBEDS: { id: EmbedId; path: string; height: number }[] = [
  { id: "blocks", path: "/embed/blocks.html", height: 120 },
  { id: "fees", path: "/embed/fees.html", height: 130 },
  { id: "mempool", path: "/embed/mempool.html", height: 150 },
  { id: "tx", path: "/embed/tx.html?id=<tx id>", height: 90 },
];

function snippet(e: (typeof EMBEDS)[number], theme: "dark" | "light"): string {
  const sep = e.path.includes("?") ? "&" : "?";
  return `<iframe src="${SITE}${e.path}${sep}theme=${theme}" width="100%" height="${e.height}" style="border:0;border-radius:10px" loading="lazy" title="${apiEnglish.embeds.items[e.id].title} · mempoolxch.space"></iframe>`;
}

/**
 * Copy-paste widgets: static pages under /embed that read Coinset from the visitor's browser.
 * The snippet itself stays English (its iframe title lands on someone else's site).
 */
function Embeds() {
  const t = useT("api");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const badge = `![Chia tx status](${SITE}/api/badge/tx/<tx id>.svg)`;
  return (
    <Card>
      <CardHeader
        title={t("embeds.title")}
        action={
          <div
            role="group"
            aria-label={t("embeds.theme")}
            className="inline-flex overflow-hidden rounded-full border border-border"
          >
            {(["dark", "light"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => setTheme(option)}
                className={
                  theme === option
                    ? "bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-fg"
                    : "px-2.5 py-0.5 text-[11px] font-semibold text-fg-muted hover:text-fg"
                }
              >
                {t(`embeds.${option}`)}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="flex flex-col gap-4 text-sm text-fg-muted">
        <p>{t.rich("embeds.intro", { code: (c) => <span className="mono">{c}</span> })}</p>
        <ul className="flex flex-col gap-3">
          {EMBEDS.map((e) => (
            <li key={e.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-fg">{t(`embeds.items.${e.id}.title`)}</span>
                <span className="text-xs">{t(`embeds.items.${e.id}.what`)}</span>
                <a
                  href={`${e.path.replace("<tx id>", "0".repeat(64))}${e.path.includes("?") ? "&" : "?"}theme=${theme}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  {t("embeds.preview")}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <pre
                  tabIndex={0}
                  className="mono w-full overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted"
                  data-testid={`embed-snippet-${e.id}`}
                >
                  {snippet(e, theme)}
                </pre>
                <CopyButton value={snippet(e, theme)} />
              </div>
            </li>
          ))}
          <li className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-fg">{t("embeds.badgeTitle")}</span>
              <span className="text-xs">{t("embeds.badgeWhat")}</span>
            </div>
            <div className="flex items-start gap-2">
              <pre
                tabIndex={0}
                className="mono w-full overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted"
                data-testid="embed-snippet-badge"
              >
                {badge}
              </pre>
              <CopyButton value={badge} />
            </div>
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}

const code = (c: ReactNode) => <span className="mono">{c}</span>;

export function ApiPage() {
  const t = useT("api");
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip text={t("titleHint")} placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader title={t("base.title")} />
        <CardBody className="flex flex-col gap-2 text-sm">
          <p>{t.rich("base.intro", { code })}</p>
          <ul className="flex flex-col gap-1">
            <li>
              <span className="text-fg-muted">{t("base.mainnet")}</span>{" "}
              <span className="mono">{RPC_BASE}</span>
            </li>
            <li>
              <span className="text-fg-muted">{t("base.testnet")}</span>{" "}
              <span className="mono">{RPC_BASE_TESTNET}</span>
            </li>
            <li>
              <span className="text-fg-muted">{t("base.websocket")}</span>{" "}
              <span className="mono">{WS_URL}</span>
            </li>
          </ul>
          <p className="text-xs text-fg-faint">
            {t.rich("base.specs", {
              code,
              link: (c) => (
                <a href={`${routes.docs()}#custom-node`} className="text-accent hover:underline">
                  {c}
                </a>
              ),
            })}
          </p>
        </CardBody>
      </Card>

      {API_GROUPS.map((group) => (
        <Card key={group.id}>
          <CardHeader title={t(`groups.${group.id}`)} />
          <CardBody>
            <ul>
              {group.endpoints.map((endpoint) => (
                <EndpointRow key={endpoint.method} endpoint={endpoint} />
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title={t("otherData.title")} />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>{t.rich("otherData.dexie", { code })}</p>
          <p>{t.rich("otherData.mintgarden", { code })}</p>
        </CardBody>
      </Card>

      <Embeds />

      <Card>
        <CardHeader title={t("fairUse.title")} />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>{t.rich("fairUse.limits", { code })}</p>
          <p>
            {t.rich("fairUse.terms", {
              link: (c) => (
                <a href={routes.legalTerms()} className="text-accent hover:underline">
                  {c}
                </a>
              ),
            })}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
