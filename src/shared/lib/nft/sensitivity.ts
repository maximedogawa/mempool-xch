/**
 * Whether an NFT's artwork should be shown straight away, from the moderation flags MintGarden
 * already ships inside the records the NFT pages fetch anyway. Nothing here is curated by us and
 * nothing is fetched for it: the caller passes the raw record it already has.
 *
 * Probed 2026-09-20 against api.mintgarden.io with
 * nft1qrhmt4f6680kuwk2tt7afjku9q0u0ytce5sjyay9s3xqh8fkj8us4lpxej: the NFT's own `is_blocked`
 * and its CHIP-0007 `sensitive_content` are both false, while its collection carries
 * `blocked_content` with "Pornographic Material" and its creator `minting_blocked` with
 * "Terms of service violation: Pornographic content". A minter fills CHIP-0007 in themselves, so
 * that flag alone catches nothing; the collection and creator verdicts are MintGarden's own and
 * are what actually decide. All four are read, and the strongest verdict wins.
 */
import { plainT } from "@/shared/i18n/plain";
import commonNs from "@/shared/i18n/messages/en/common";

export type SensitivityLevel = "clear" | "sensitive" | "blocked";

export interface Sensitivity {
  level: SensitivityLevel;
  /** Short phrase for the veil, e.g. "Pornographic Material"; null when the source gave none. */
  reason: string | null;
}

export const CLEAR: Sensitivity = { level: "clear", reason: null };

const RANK: Record<SensitivityLevel, number> = { clear: 0, sensitive: 1, blocked: 2 };

/** The stronger of two verdicts; a reason from the stronger one, else whichever exists. */
export function strongest(a: Sensitivity, b: Sensitivity): Sensitivity {
  if (RANK[b.level] > RANK[a.level]) return { level: b.level, reason: b.reason ?? a.reason };
  if (RANK[a.level] > RANK[b.level]) return { level: a.level, reason: a.reason ?? b.reason };
  return { level: a.level, reason: a.reason ?? b.reason };
}

export function isVeiled(sensitivity: Sensitivity | null | undefined): boolean {
  return !!sensitivity && sensitivity.level !== "clear";
}

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
/** MintGarden sends these as booleans, but treat a missing or null flag as "not set". */
const flag = (v: unknown): boolean => v === true;
const reason = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * The verdict carried by a collection object, as it appears standalone (/collections/{id}),
 * embedded in an NFT record, or in the slimmer form on an event (id, name and both flags only).
 */
export function classifyCollection(raw: unknown): Sensitivity {
  const c = obj(raw);
  if (flag(c.blocked_content))
    return { level: "blocked", reason: reason(c.blocked_content_reason) };
  if (flag(c.sensitive_content)) return { level: "sensitive", reason: null };
  return CLEAR;
}

/** A creator MintGarden has stopped from minting, with the reason it gives. */
export function classifyCreator(raw: unknown): Sensitivity {
  const creator = obj(raw);
  return flag(creator.minting_blocked)
    ? { level: "blocked", reason: reason(creator.minting_blocked_reason) }
    : CLEAR;
}

/**
 * One NFT record (/nfts/{id}) or the `nft` object of an event, together with whatever collection
 * and creator objects sit beside it. Events keep the collection at the top level, so callers pass
 * it explicitly rather than reaching into the NFT.
 */
export function classifyNft(
  nftRaw: unknown,
  collectionRaw?: unknown,
  creatorRaw?: unknown
): Sensitivity {
  const nft = obj(nftRaw);
  const metadata = obj(obj(nft.data).metadata_json);
  let verdict: Sensitivity = flag(nft.is_blocked)
    ? { level: "blocked", reason: reason(nft.blocked_reason) }
    : CLEAR;
  // CHIP-0007, self-declared by the minter: honoured when set, never trusted when unset.
  if (flag(metadata.sensitive_content) || flag(obj(nft.data).sensitive_content))
    verdict = strongest(verdict, { level: "sensitive", reason: null });
  verdict = strongest(verdict, classifyCollection(collectionRaw ?? nft.collection));
  verdict = strongest(verdict, classifyCreator(creatorRaw ?? nft.creator));
  return verdict;
}

/**
 * MintGarden's search endpoint returns a flattened row rather than a nested record: the NFT's
 * own flags sit at the top level and its collection's arrive as `collection_*`. Verified against
 * /search on 2026-09-20, where a `/nfts/{id}`-shaped read finds nothing and would call every hit
 * clear.
 */
export function classifySearchNft(raw: unknown): Sensitivity {
  const n = obj(raw);
  let verdict: Sensitivity = flag(n.is_blocked)
    ? { level: "blocked", reason: reason(n.blocked_reason) }
    : CLEAR;
  if (flag(n.sensitive_content)) verdict = strongest(verdict, { level: "sensitive", reason: null });
  if (flag(n.collection_blocked_content))
    verdict = strongest(verdict, {
      level: "blocked",
      reason: reason(n.collection_blocked_content_reason),
    });
  if (flag(n.collection_sensitive_content))
    verdict = strongest(verdict, { level: "sensitive", reason: null });
  return verdict;
}

/**
 * A record that carries no moderation data at all, such as a collection hit from /search: it is
 * veiled rather than taken on trust, the same rule the treemap uses for a cell it never looked up.
 */
export const UNCLASSIFIED: Sensitivity = { level: "sensitive", reason: null };

export interface SensitivityText {
  /** The same headline for both levels: the viewer can still open it, so "blocked" would lie. */
  title: string;
  /** What it is about, as a bare descriptor ("Pornographic", "Graphic violence"); null if unsaid. */
  reason: string | null;
  /** One line for a tooltip or a screen reader. */
  summary: string;
}

/** MintGarden phrases a creator ban as a policy citation; a viewer only needs what it is about. */
const POLICY_PREFIX = /^terms of service violation:\s*/i;
/**
 * The headline already says "content", so a reason ending in it only repeats the word:
 * "Pornographic material" and "Pornographic content" both read as just "Pornographic". Reasons
 * that are already bare ("Graphic violence") keep their wording.
 */
const TRAILING_NOUN = /\s+(content|material|materials|imagery|media)$/i;

export function sensitivityText(sensitivity: Sensitivity): SensitivityText {
  const trimmed = (sensitivity.reason ?? "")
    .replace(POLICY_PREFIX, "")
    .replace(TRAILING_NOUN, "")
    .trim();
  // Sentence case, but never at the cost of an acronym: "DMCA" and "CSAM" stay as they are,
  // while a shouted "PORNOGRAPHIC MATERIAL" is calmed down. A short all-caps word reads as an
  // acronym, a long one as shouting.
  const words = trimmed
    .split(/\s+/)
    .map((w) => (w.length > 5 && w === w.toUpperCase() ? w.toLowerCase() : w));
  const joined = words.join(" ");
  const reason = joined ? joined.charAt(0).toUpperCase() + joined.slice(1) : null;
  const t = plainT(commonNs);
  const title = t("sensitivity.title");
  return { title, reason, summary: reason ? t("sensitivity.summary", { title, reason }) : title };
}
