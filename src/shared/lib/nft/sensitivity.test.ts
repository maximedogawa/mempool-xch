import { expect, test } from "bun:test";
import blockedNft from "@/test-utils/fixtures/mintgardenBlockedNft.json";
import hotshotNft from "@/test-utils/fixtures/mintgardenHotshotNft.json";
import {
  CLEAR,
  classifyCollection,
  classifyCreator,
  classifyNft,
  classifySearchNft,
  UNCLASSIFIED,
  isVeiled,
  sensitivityText,
  strongest,
} from "./sensitivity";

test("the recorded Kamasutra NFT is blocked by its collection, not by its own flags", () => {
  // Its own is_blocked and CHIP-0007 sensitive_content are both false: only the collection and
  // the creator carry MintGarden's verdict, which is the whole reason all four are read.
  expect(blockedNft.is_blocked).toBe(false);
  expect(blockedNft.data.metadata_json.sensitive_content).toBe(false);
  expect(classifyNft(blockedNft)).toEqual({
    level: "blocked",
    reason: "Pornographic Material",
  });
});

test("a blocked creator alone is enough", () => {
  const { collection: _collection, ...withoutCollection } = blockedNft;
  expect(classifyNft(withoutCollection)).toEqual({
    level: "blocked",
    reason: "Terms of service violation: Pornographic content",
  });
  expect(classifyCreator({ minting_blocked: true })).toEqual({ level: "blocked", reason: null });
  expect(classifyCreator({ minting_blocked: false, minting_blocked_reason: "x" })).toEqual(CLEAR);
});

test("a self-declared CHIP-0007 flag marks the NFT sensitive", () => {
  expect(classifyNft({ data: { metadata_json: { sensitive_content: true } } })).toEqual({
    level: "sensitive",
    reason: null,
  });
  // The slimmer event shape carries the flag directly on `data`.
  expect(classifyNft({ data: { sensitive_content: true } }).level).toBe("sensitive");
});

test("the NFT's own block flag wins over a merely sensitive collection", () => {
  expect(
    classifyNft({ is_blocked: true, blocked_reason: "DMCA" }, { sensitive_content: true })
  ).toEqual({ level: "blocked", reason: "DMCA" });
});

test("an event's collection is classified on its own", () => {
  expect(classifyCollection({ blocked_content: true, blocked_content_reason: " Nudity " })).toEqual(
    { level: "blocked", reason: "Nudity" }
  );
  expect(classifyCollection({ sensitive_content: true })).toEqual({
    level: "sensitive",
    reason: null,
  });
  expect(classifyCollection({ blocked_content: false, sensitive_content: false })).toEqual(CLEAR);
});

test("missing, null and junk records are clear rather than guessed", () => {
  expect(classifyNft(null)).toEqual(CLEAR);
  expect(classifyNft({})).toEqual(CLEAR);
  expect(classifyCollection(undefined)).toEqual(CLEAR);
  // A truthy non-boolean is not a flag: only an explicit true counts.
  expect(classifyCollection({ blocked_content: "no" })).toEqual(CLEAR);
});

test("strongest keeps the higher level and a reason when only the weaker one has it", () => {
  expect(strongest(CLEAR, { level: "sensitive", reason: null })).toEqual({
    level: "sensitive",
    reason: null,
  });
  expect(
    strongest({ level: "sensitive", reason: "Nudity" }, { level: "blocked", reason: null })
  ).toEqual({ level: "blocked", reason: "Nudity" });
});

test("isVeiled", () => {
  expect(isVeiled(CLEAR)).toBe(false);
  expect(isVeiled(null)).toBe(false);
  expect(isVeiled({ level: "sensitive", reason: null })).toBe(true);
});

test("the veil speaks of sensitive content, never of blocking, since it still opens", () => {
  // "Sensitive content: Pornographic content" said the word twice; the reason is the descriptor.
  expect(sensitivityText({ level: "blocked", reason: "Pornographic Material" })).toEqual({
    title: "Sensitive content",
    reason: "Pornographic",
    summary: "Sensitive content. Reason: Pornographic",
  });
  // A creator ban is phrased as a policy citation; the viewer only needs what it is about.
  expect(
    sensitivityText({
      level: "blocked",
      reason: "Terms of service violation: Pornographic content",
    }).reason
  ).toBe("Pornographic");
  // A reason that is already a bare descriptor keeps its own wording.
  expect(sensitivityText({ level: "sensitive", reason: "Graphic violence" }).reason).toBe(
    "Graphic violence"
  );
  expect(sensitivityText({ level: "blocked", reason: "Violent imagery" }).reason).toBe("Violent");
  expect(sensitivityText({ level: "sensitive", reason: null })).toEqual({
    title: "Sensitive content",
    reason: null,
    summary: "Sensitive content",
  });
});

test("every NFT of a blocked collection is caught by the collection alone (HOTSHOT #540)", () => {
  // Recorded live on 2026-09-20. The collection verdict is what makes this automatic: one flag
  // covers all 540-odd items without anyone listing NFTs by hand.
  expect(hotshotNft.collection.blocked_content).toBe(true);
  expect(hotshotNft.is_blocked).toBe(false);
  expect(hotshotNft.data.metadata_json.sensitive_content).toBe(false);
  expect(classifyNft(hotshotNft)).toEqual({
    level: "blocked",
    reason: "Pornographic material",
  });
  expect(sensitivityText(classifyNft(hotshotNft))).toEqual({
    title: "Sensitive content",
    reason: "Pornographic",
    summary: "Sensitive content. Reason: Pornographic",
  });
});

test("a sibling in the same collection is caught without its own record being special", () => {
  // Only the collection object travels with a listing row; that is enough on its own.
  expect(classifyCollection(hotshotNft.collection).level).toBe("blocked");
  expect(
    classifyNft({ data: { metadata_json: { name: "HOTSHOT #7" } } }, hotshotNft.collection)
  ).toEqual({ level: "blocked", reason: "Pornographic material" });
});

test("a /search row is classified from its flattened fields, not the nested record shape", () => {
  // Reading the nested shape against this row finds nothing and would call it clear.
  const row = {
    encoded_id: "nft1hotshot",
    is_blocked: false,
    sensitive_content: false,
    collection_blocked_content: true,
    collection_blocked_content_reason: "Pornographic material",
  };
  expect(classifyNft(row)).toEqual(CLEAR);
  expect(classifySearchNft(row)).toEqual({ level: "blocked", reason: "Pornographic material" });
  expect(classifySearchNft({ sensitive_content: true }).level).toBe("sensitive");
  expect(classifySearchNft({ collection_sensitive_content: true }).level).toBe("sensitive");
  expect(classifySearchNft({ is_blocked: true, blocked_reason: "DMCA" })).toEqual({
    level: "blocked",
    reason: "DMCA",
  });
  expect(classifySearchNft({})).toEqual(CLEAR);
  expect(UNCLASSIFIED.level).toBe("sensitive");
});

test("acronyms survive, shouting does not", () => {
  expect(sensitivityText({ level: "blocked", reason: "DMCA" }).reason).toBe("DMCA");
  expect(sensitivityText({ level: "blocked", reason: "CSAM" }).reason).toBe("CSAM");
  expect(sensitivityText({ level: "blocked", reason: "PORNOGRAPHIC MATERIAL" }).reason).toBe(
    "Pornographic"
  );
  expect(sensitivityText({ level: "sensitive", reason: "graphic violence" }).reason).toBe(
    "Graphic violence"
  );
});
