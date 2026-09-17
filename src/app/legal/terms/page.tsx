import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, SITE_NAME } from "@/shared/config/legal";
import { routes } from "@/shared/lib/routes";
import { Fill, LegalPage, List, Section } from "@/widgets/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      current={routes.legalTerms()}
      intro={
        <p>
          These terms apply to the website {SITE_NAME}, its public data endpoints and the {SITE_NAME} app inside the Sage wallet (together, the
          &quot;Service&quot;). The operator is named in the <Link href={routes.legalNotice()} className="text-accent hover:underline">legal notice</Link>. By
          using the Service you accept these terms. If you do not accept them, please do not use the Service.
        </p>
      }
    >
      <Section title="1. What the Service is" id="service">
        <p>
          The Service is an independent, free, read-only explorer for the public Chia blockchain. It shows blocks, transactions, the mempool, fee estimates,
          addresses, coins and assets, as far as that information is available from public sources.
        </p>
        <List>
          <li>It does not hold, receive or manage funds, private keys or seed phrases, and it cannot move your coins.</li>
          <li>It does not execute, route or broker transactions, trades or orders, and it takes no fee or commission.</li>
          <li>There are no user accounts.</li>
          <li>
            It does not provide crypto-asset services within the meaning of Regulation (EU) 2023/1114 (MiCA), and it is not an exchange, broker, custodian,
            investment adviser or other regulated financial service.
          </li>
          <li>
            Inside the Sage wallet, the wallet is Sage&apos;s software. This app only reads what Sage makes available after you allow it; anything you sign
            or send, you sign or send in Sage.
          </li>
        </List>
      </Section>

      <Section title="2. No advice" id="no-advice">
        <p>
          Everything on the Service is general information. Nothing on it is financial, investment, tax or legal advice, a recommendation or an offer to
          buy or sell any asset. Crypto-assets are highly volatile and you can lose all of the money you put in. Blockchain transactions cannot be reversed.
          Do your own research, and check amounts, addresses, asset IDs and fees in your own wallet before you act.
        </p>
      </Section>

      <Section title="3. Data: as is, as available" id="data">
        <p>
          The Service displays data from third parties (by default Coinset, Dexie and MintGarden, or a node you configure yourself) and figures it derives
          from that data, such as projected blocks, fee estimates, expected confirmation times, asset names, icons and prices. That information:
        </p>
        <List>
          <li>may be delayed, incomplete, cached, out of date or wrong;</li>
          <li>includes estimates and projections that can turn out differently, for example which block a transaction lands in or what fee is enough;</li>
          <li>
            includes names, tickers, icons and images chosen by third parties, which can be misleading or copy another asset. Always identify an asset by
            its asset ID.
          </li>
        </List>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. There is no promise that it is available at any particular time, free of
          errors or suitable for a particular purpose. It may be changed, limited, interrupted or discontinued at any time without notice.
        </p>
      </Section>

      <Section title="4. Acceptable use" id="use">
        <p>You may use the Service, including its public data endpoints, for personal and commercial purposes within these rules. You must not:</p>
        <List>
          <li>send requests at a rate that burdens the Service, get around rate limits or blocks, or disrupt it for others;</li>
          <li>attempt to gain unauthorised access to the Service or the systems behind it;</li>
          <li>use the Service for anything unlawful, including fraud, or to mislead others about an asset or a transaction;</li>
          <li>present your own offering as operated, endorsed or verified by {SITE_NAME}.</li>
        </List>
        <p>
          For automated use, cache responses and keep request rates reasonable. The Service may rate-limit or block traffic that affects its availability.
        </p>
      </Section>

      <Section title="5. Third-party content and links" id="third-party">
        <p>
          Asset names, icons, NFT images and metadata come from the blockchain and from third parties. They are not created, reviewed or endorsed by the
          operator. The same applies to external websites the Service links to. If you believe content shown on the Service is unlawful or infringes your
          rights, write to x.com/MaximEdogawa on x.com with the page address and the reason; it will be removed from display
          once the operator becomes aware of an infringement.
        </p>
      </Section>

      <Section title="6. Liability" id="liability">
        <p>
          The Service is provided free of charge. The operator&apos;s liability for damages, whatever the legal ground, is therefore limited as follows:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            The operator is liable without limitation for intent and gross negligence, for injury to life, body or health, under the Product Liability Act
            (Produkthaftungsgesetz), where a guarantee was given and where a defect was fraudulently concealed.
          </li>
          <li>
            For slight negligence the operator is liable only for breach of an essential obligation, that is one whose fulfilment is what makes proper use of
            the Service possible at all and on which you may ordinarily rely. In that case liability is limited to the damage that was typical and
            foreseeable when you used the Service.
          </li>
          <li>Apart from that, liability for slight negligence is excluded.</li>
          <li>
            Subject to point 1, this means in particular that the operator is not liable for losses resulting from decisions you base on information shown
            on the Service, such as sending, buying, selling or holding an asset or choosing a fee, or from the Service being unavailable.
          </li>
          <li>These limits also protect the operator&apos;s representatives and anyone who helps run the Service.</li>
        </ol>
      </Section>

      <Section title="7. Open source" id="open-source">
        <p>
          The software behind the Service is open source under the MIT License, which comes with its own disclaimer for the software. These terms cover the
          hosted Service.
        </p>
      </Section>

      <Section title="8. Changes" id="changes">
        <p>
          These terms may be updated, for example when the Service changes. The version on this page, with the date shown above, applies from that date. If
          you keep using the Service after a change, the updated terms apply to that use.
        </p>
      </Section>

      <Section title="9. Governing law and venue" id="law">
        <p>
          These terms are governed by the law of austria, excluding
          the UN Convention on Contracts for the International Sale of Goods. If you are a consumer, this choice of law does not take away the protection
          of mandatory consumer law of the country where you habitually live.
        </p>
        <p>
          If you are a merchant, a legal entity under public law or have no general place of jurisdiction in the European Union, the courts of vienna austria have jurisdiction. Mandatory statutory venues remain unaffected.
        </p>
        <p>The operator is neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.</p>
      </Section>

      <Section title="10. Severability" id="severability">
        <p>If any provision of these terms is invalid, the remaining provisions stay in effect and the statutory rules apply in place of the invalid one.</p>
      </Section>
    </LegalPage>
  );
}
