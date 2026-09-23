"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { RichTag } from "@/shared/i18n/translate";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader } from "@/shared/ui";

const WIKI = "https://github.com/maximedogawa/mempool-xch-wiki/blob/main";
const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://mempoolxch.space";

/** Inline markup used by the Help page's rich messages. */
const TAGS: Record<string, RichTag> = {
  em: (c) => <em>{c}</em>,
  strong: (c) => <strong className="text-fg">{c}</strong>,
  mono: (c) => <span className="mono">{c}</span>,
  kbd: (c) => <kbd className="rounded-sm border border-border px-1 text-xs">{c}</kbd>,
};

function Code({ children }: { children: string }) {
  return (
    <pre
      tabIndex={0}
      className="mono overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted"
    >
      {children}
    </pre>
  );
}

function Q({ q, children, id }: { q: string; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-fg">{q}</h3>
      <div className="text-sm text-fg-muted">{children}</div>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
      {children}
    </a>
  );
}

const CADDYFILE = `# Caddyfile
:8556 {
  reverse_proxy https://localhost:8555 {
    transport http {
      tls_client_auth ~/.chia/mainnet/config/ssl/full_node/private_full_node.crt ~/.chia/mainnet/config/ssl/full_node/private_full_node.key
      tls_insecure_skip_verify
    }
  }
  header Access-Control-Allow-Origin *
  header Access-Control-Allow-Headers content-type
  @options method OPTIONS
  respond @options 204
}`;

/** The Help page: what the site does differently, how to read it, Sage and custom-node setup. */
export function DocsContent() {
  const t = useT("docs");
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <Card id="why">
        <CardHeader title={t("why.title")} />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>{t("why.intro")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("why.sage")}</li>
            <li>{t("why.projected")}</li>
            <li>{t("why.cats")}</li>
            <li>{t("why.a11y")}</li>
            <li>{t("why.openSource")}</li>
          </ul>
          <p>
            {t.rich("why.comparison", {
              link: (c) => (
                <ExternalLink href={`${WIKI}/architecture/competitors.md`}>{c}</ExternalLink>
              ),
            })}
          </p>
        </CardBody>
      </Card>

      <Card id="reading">
        <CardHeader title={t("reading.title")} />
        <CardBody className="flex flex-col gap-4">
          <Q q={t("reading.projected.q")}>{t("reading.projected.a")}</Q>
          <Q q={t("reading.confirmed.q")}>{t("reading.confirmed.a")}</Q>
          <Q q={t("reading.zeroFee.q")}>{t("reading.zeroFee.a")}</Q>
          <Q q={t("reading.nextBlock.q")}>{t("reading.nextBlock.a")}</Q>
          <Q q={t("reading.graph.q")}>{t("reading.graph.a")}</Q>
        </CardBody>
      </Card>

      <Card id="search">
        <CardHeader title={t("search.title")} />
        <CardBody className="flex flex-col gap-4">
          <Q q={t("search.paste.q")}>{t.rich("search.paste.a", TAGS)}</Q>
          <Q q={t("search.handle.q")}>{t.rich("search.handle.a", TAGS)}</Q>
          <Q q={t("search.sent.q")}>{t("search.sent.a")}</Q>
          <Q q={t("search.notClassified.q")}>{t("search.notClassified.a")}</Q>
        </CardBody>
      </Card>

      <Card id="sage">
        <CardHeader title={t("sage.title")} />
        <CardBody className="flex flex-col gap-4">
          <Q q={t("sage.install.q")}>{t.rich("sage.install.a", { ...TAGS, site: SITE })}</Q>
          <Q q={t("sage.network.q")}>{t("sage.network.a")}</Q>
          <Q q={t("sage.data.q")}>{t("sage.data.a")}</Q>
        </CardBody>
      </Card>

      <Card id="custom-node">
        <CardHeader title={t("customNode.title")} />
        <CardBody className="flex flex-col gap-4">
          <Q q={t("customNode.need.q")}>{t("customNode.need.a")}</Q>
          <Q q={t("customNode.mine.q")}>{t.rich("customNode.mine.a", TAGS)}</Q>
          <Code>{CADDYFILE}</Code>
          <Q q={t("customNode.changes.q")}>{t("customNode.changes.a")}</Q>
          <Q q={t("customNode.channels.q")} id="channels">
            {t("customNode.channels.a")}
            <ul className="mt-1 list-disc pl-5">
              <li>{t.rich("customNode.channels.socket", TAGS)}</li>
              <li>{t.rich("customNode.channels.polling", TAGS)}</li>
            </ul>
          </Q>
        </CardBody>
      </Card>

      <Card id="more">
        <CardHeader title={t("more.title")} />
        <CardBody className="text-sm text-fg-muted">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <Link href={routes.api()} className="text-accent hover:underline">
                {t("more.api")}
              </Link>
            </li>
            <li>
              <ExternalLink href={`${WIKI}/guides/install.md`}>{t("more.install")}</ExternalLink>
            </li>
            <li>
              <ExternalLink href={`${WIKI}/guides/custom-node.md`}>
                {t("more.customNode")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={`${WIKI}/architecture/overview.md`}>
                {t("more.overview")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={`${WIKI}/architecture/coinset-load.md`}>
                {t("more.load")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://github.com/maximedogawa/mempool-xch">
                {t("more.source")}
              </ExternalLink>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
