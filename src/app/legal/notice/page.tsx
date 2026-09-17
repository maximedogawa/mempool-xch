import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, SITE_NAME } from "@/shared/config/legal";
import { routes } from "@/shared/lib/routes";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { Fill, LegalPage, List, Section } from "@/widgets/legal/LegalPage";

export const metadata: Metadata = { title: "Legal notice" };

export default function NoticePage() {
  return (
    <LegalPage title="Legal notice" current={routes.legalNotice()} intro={<p>Information about the operator (Impressum under § 5 DDG and § 18 MStV).</p>}>
      <Section title="Independence and trademarks" id="independence">
        <p>
          {SITE_NAME} is an independent project. It is not affiliated with, endorsed by or sponsored by Chia Network Inc. &quot;Chia&quot; and
          &quot;XCH&quot; are used only to describe the network the Service shows; they and any related marks belong to their respective owners. The same
          applies to Sage, Coinset, Dexie, MintGarden and every other product or asset name shown on the Service.
        </p>
      </Section>

      <Section title="Content and links" id="liability">
        <p>
          The content of this site is prepared with care, but most of what it shows is data from the public blockchain and from third parties, displayed
          automatically and without review. No guarantee is given for its accuracy, completeness or timeliness; see the{" "}
          <Link href={routes.legalTerms()} className="text-accent hover:underline">
            terms of use
          </Link>
          .
        </p>
        <p>
          The site links to external websites whose content is outside the operator&apos;s control and for which their providers are responsible. Linked
          pages were not found to be unlawful when the link was set; a link is removed as soon as an infringement becomes known.
        </p>
      </Section>

      <Section title="Reporting content" id="report">
        <p>
          To report content shown on this site that you believe is unlawful or infringes your rights, write to x.com/MaximEdogawa on x.com. Since there are no accounts, server logs can only be matched to you with your IP address and the time of your visit.
        </p>
      </Section>

      <Section title="Open source and data sources" id="attribution">
        <List>
          <li>
            Source code:{" "}
            <ExternalLink href="https://github.com/maximedogawa/mempool-xch" className="text-accent hover:underline">
              github.com/maximedogawa/mempool-xch
            </ExternalLink>{" "}
            under the MIT License.
          </li>
          <li>
            Chain data:{" "}
            <ExternalLink href="https://coinset.org" className="text-accent hover:underline">
              Coinset
            </ExternalLink>
            , or a full node you configure.
          </li>
          <li>
            CAT names and icons:{" "}
            <ExternalLink href="https://dexie.space" className="text-accent hover:underline">
              Dexie
            </ExternalLink>
            .
          </li>
          <li>
            NFT metadata and images:{" "}
            <ExternalLink href="https://mintgarden.io" className="text-accent hover:underline">
              MintGarden
            </ExternalLink>{" "}
            and the NFTs&apos; own links.
          </li>
          <li>NFT images, CAT icons and on-chain content belong to their creators.</li>
        </List>
      </Section>

      <Section title="Consumer dispute resolution" id="disputes">
        <p>The operator is neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.</p>
      </Section>
    </LegalPage>
  );
}
