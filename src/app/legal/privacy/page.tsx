import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/shared/config/legal";
import { routes } from "@/shared/lib/routes";
import { LegalPage, List, Section } from "@/widgets/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      current={routes.legalPrivacy()}
      intro={
        <p>
          How {SITE_NAME} handles personal data, under the EU General Data Protection Regulation (GDPR). In short: no accounts, no tracking, no analytics
          and no advertising. Your settings stay in your browser.
        </p>
      }
    >
      <Section title="1. Controller" id="controller">
        <p>
          Maxim Edogawa, See also the{" "}
          <Link href={routes.legalNotice()} className="text-accent hover:underline">
            legal notice
          </Link>
          .
        </p>
      </Section>

      <Section title="2. Visiting the website: server logs" id="logs">
        <p>
          When you open the site, your browser sends technical data that the server records in access logs: IP address, date and time, the address
          requested (which can contain a transaction ID, block, address or coin you looked up), status code, referring page and browser identification.
        </p>
        <List>
          <li>Purpose: delivering the site, keeping it secure and stable, and investigating abuse and errors.</li>
          <li>Legal basis: Art. 6(1)(f) GDPR; the legitimate interest is operating a secure website.</li>
          <li>
            Retention: 14 days, longer only while needed to investigate a specific
            security incident.
          </li>
          <li>
            Hosting: Hetzner, acting as processor under Art. 28 GDPR.
          </li>
        </List>
        <p>
          The server does not fetch chain or asset data on your behalf: it only serves the application itself (HTML, scripts, styles). Every lookup you
          make is a request from your own browser to Coinset, Dexie, MintGarden or your own node, described in the next sections.
        </p>
      </Section>

      <Section title="3. Storage in your browser" id="local-storage">
        <p>
          The site keeps a few entries in your browser&apos;s local storage: your settings (network, node address, theme, sounds, whether you turned on
          browser notifications), a cache of the asset list, a short mempool history drawn while the page is open, your watchlist of addresses and
          transaction ids if you add any, which Sage permissions you declined, and your cookie choice. They stay on your device and are not sent to the
          operator. They are strictly necessary to provide what you asked for (§ 25(2) no. 2 TDDDG). You can delete them at any time in your browser
          settings. Details are in the{" "}
          <Link href={routes.legalCookies()} className="text-accent hover:underline">
            cookie policy
          </Link>
          .
        </p>
        <p>
          If you turn on browser notifications for your watchlist, that permission is granted to this site by your browser and can be withdrawn there at
          any time; the operator never sees whether you turned it on.
        </p>
      </Section>

      <Section title="4. Services your browser contacts directly" id="third-parties">
        <p>
          Every page reads chain and asset data straight from other services, from your own browser, not through this site&apos;s server. Like any web
          server, they receive your IP address, browser identification and the address of the item requested:
        </p>
        <List>
          <li>Dexie (api.dexie.space, icons.dexie.space): the CAT token list, names, tickers and icons.</li>
          <li>MintGarden (api.mintgarden.io, assets.mainnet.mintgarden.io, ipfs.mintgarden.io): NFT metadata and images.</li>
          <li>
            Hosts named in an NFT&apos;s own on-chain metadata, when MintGarden has no copy. Which hosts these are is decided by the NFT&apos;s creator.
          </li>
          <li>
            Coinset (api.coinset.org): all chain data — the mempool, blocks, transactions, addresses, coins and assets you view, and the live updates —
            unless you enter a different node below.
          </li>
          <li>A full node you enter in Settings: all chain data then comes from there instead of Coinset.</li>
          <li>
            Only while the Network map page is open: Cloudflare DNS (cloudflare-dns.com, with dns.google as a fallback) answers DNS queries for the Chia
            introducers, and GeoJS (get.geojs.io) estimates the location of the node addresses those answers contain. Only node addresses are sent for
            lookup, never yours; the addresses learnt are kept in your browser&apos;s local storage for a week.
          </li>
        </List>
        <p>
          Legal basis: Art. 6(1)(f) GDPR; the legitimate interest is showing the blockchain content you request. Some of these providers may process data
          outside the European Economic Area, for example in the United States, where the level of data protection can be lower. Their own privacy
          policies apply.
        </p>
        <p>
          Addresses, transaction IDs and coin IDs are public on the blockchain. If you look up your own address, the service answering the lookup may be
          able to link it to your IP address.
        </p>
      </Section>

      <Section title="5. Inside the Sage wallet" id="sage">
        <p>
          In the Sage app, wallet information (your receive address, balances, pending and past transactions, coins) is read from Sage only after you allow
          it, and is processed on your device. It is not sent to the operator. To show your address page, the app looks up your public address at the
          chain data source (Coinset or your node), just as any address search would.
        </p>
      </Section>

      <Section title="6. No cookies, analytics or advertising" id="no-tracking">
        <p>
          The site sets no cookies and uses no analytics, tracking or advertising. Should that change, it will only happen with your prior consent through
          Cookie settings, and this policy will be updated first.
        </p>
      </Section>

      <Section title="7. Your rights" id="rights">
        <p>You have the right to:</p>
        <List>
          <li>access the personal data held about you (Art. 15 GDPR);</li>
          <li>have it corrected (Art. 16) or erased (Art. 17);</li>
          <li>restrict its processing (Art. 18) and receive it in a portable format (Art. 20);</li>
          <li>
            <strong className="text-fg">object</strong> at any time, on grounds relating to your particular situation, to processing based on Art. 6(1)(f)
            GDPR (Art. 21);
          </li>
          <li>
            complain to a data protection supervisory authority (Art. 77), in particular in the EU country where you live or work.
          </li>
        </List>
        <p>
          Write to x.com/MaximEdogawa on x.com. Since there are no accounts, server logs can only be matched to you with
          your IP address and the time of your visit.
        </p>
      </Section>

      <Section title="8. Other" id="other">
        <p>
          You are not required to provide personal data. Without the technical data in section 2 the site cannot be delivered. There is no automated
          decision-making or profiling. This policy is updated when the site changes; the date above shows the current version.
        </p>
      </Section>
    </LegalPage>
  );
}
