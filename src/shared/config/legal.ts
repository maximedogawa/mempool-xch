/**
 * Operator details for the legal pages (TASK-056). Every `null` renders as a visible
 * "[to be filled in: …]" marker on the pages, so an unfilled value can never ship unnoticed.
 * The owner fills these in before launch; the checklist is in the wiki under
 * deployment/legal-launch-checklist.md.
 */
export interface LegalConfig {
  /** Full legal name of the natural person (or company) operating the site. */
  operatorName: string | null;
  /** Street, postcode, city: a serviceable address, not a PO box. */
  operatorAddress: string | null;
  operatorCountry: string | null;
  /** Monitored contact address, also used for content reports and privacy requests. */
  contactEmail: string | null;
  /** A second direct contact channel (phone or contact form URL); optional but advisable. */
  contactSecondary: string | null;
  /** Law governing the terms, e.g. "the Federal Republic of Germany". */
  governingLaw: string | null;
  /** Court venue for merchants and for users without a general venue in the EU, e.g. "Munich, Germany". */
  venue: string | null;
  /** Hosting provider and data-centre location, e.g. "Hetzner Online GmbH, Germany". */
  hostingProvider: string | null;
  /** How long the reverse proxy keeps access logs, e.g. "14 days". */
  logRetention: string | null;
  /** Supervisory authority for data protection complaints, e.g. "BayLDA, Ansbach". */
  supervisoryAuthority: string | null;
}

export const LEGAL: LegalConfig = {
  operatorName: null,
  operatorAddress: null,
  operatorCountry: null,
  contactEmail: null,
  contactSecondary: null,
  governingLaw: null,
  venue: null,
  hostingProvider: null,
  logRetention: null,
  supervisoryAuthority: null,
};

/** Date shown as "last updated" on all four legal pages. Bump when their wording changes. */
export const LEGAL_UPDATED = "2026-09-17";

export const SITE_NAME = "mempoolxch.space";
