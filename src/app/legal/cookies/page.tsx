import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, SITE_NAME } from "@/shared/config/legal";
import { routes } from "@/shared/lib/routes";
import { Fill, LegalPage, List, Section } from "@/widgets/legal/LegalPage";
import { CookieSettingsButton } from "@/widgets/legal/CookieSettingsButton";

export const metadata: Metadata = { title: "Cookie policy" };

const NECESSARY = [
  { key: "mempool-xch:settings:v1", purpose: "Network, node address, theme, number of recent blocks, sounds", lifetime: "Until you reset or clear it" },
  { key: "mempool-xch:tokens:v2", purpose: "Cached list of CAT names and icons, so it is not downloaded on every visit", lifetime: "Refreshed after 24 hours" },
  { key: "mempool-xch:history:v1:<network>", purpose: "Mempool graph of the last two hours, drawn while the page is open", lifetime: "Entries older than two hours are dropped" },
  { key: "mempool-xch:sage-refused:v1", purpose: "Sage permissions you declined, so you are not asked again (Sage app only)", lifetime: "Until you clear it" },
  { key: "mempool-xch:consent:v1", purpose: "Your choice in Cookie settings", lifetime: "12 months" },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      current={routes.legalCookies()}
      intro={
        <p>
          {SITE_NAME} sets no cookies. It keeps a few entries in your browser&apos;s local storage, which the rules for cookies (Art. 5(3) ePrivacy
          Directive, § 25 TDDDG) cover in the same way. This page lists them.
        </p>
      }
    >
      <Section title="Categories" id="categories">
        <List>
          <li>
            <strong className="text-fg">Strictly necessary</strong>: always on. Needed for features you use, and exempt from consent (§ 25(2) no. 2
            TDDDG).
          </li>
          <li>
            <strong className="text-fg">Analytics</strong>: usage statistics. Not used at the moment; would only run with your consent.
          </li>
          <li>
            <strong className="text-fg">Advertising</strong>: ads and ad measurement. Not used at the moment; would only run with your consent.
          </li>
        </List>
      </Section>

      <Section title="Strictly necessary storage" id="necessary">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Strictly necessary storage">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-fg">
                <th scope="col" className="py-2 pr-3 font-semibold">Key</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Purpose</th>
                <th scope="col" className="py-2 font-semibold">Kept</th>
              </tr>
            </thead>
            <tbody>
              {NECESSARY.map((row) => (
                <tr key={row.key} className="border-b border-border align-top">
                  <td className="mono py-2 pr-3 text-fg">{row.key}</td>
                  <td className="py-2 pr-3">{row.purpose}</td>
                  <td className="py-2">{row.lifetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>None of these entries is sent to the operator or used to identify or follow you.</p>
      </Section>

      <Section title="Your choice" id="choice">
        <p>
          On your first visit a panel asks for your choice: Reject all, Save my choice or Accept all. Your choice is kept for 12 months and then asked
          again. You can change or withdraw it at any time with Cookie settings in the footer or here:
        </p>
        <div>
          <CookieSettingsButton />
        </div>
        <p>
          If your browser sends a Do Not Track or Global Privacy Control signal, analytics and advertising stay off and you are not asked.
        </p>
      </Section>

      <Section title="Content from other services" id="third-parties">
        <p>
          Icons, NFT images and some chain data load directly from other services, which receive your IP address as any web server does. See section 4 of
          the{" "}
          <Link href={routes.legalPrivacy()} className="text-accent hover:underline">
            privacy policy
          </Link>
          . x.com/MaximEdogawa on x.com. Since there are no accounts, server logs can only be matched to you with your IP address and the time of your visit.
        </p>
      </Section>
    </LegalPage>
  );
}
