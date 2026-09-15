import { describe, expect, test } from "bun:test";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { resolveNftId } from "./NftPage";

describe("resolveNftId", () => {
  const launcher = "986702452f7e2452c26eb7b15bb59882b891aa6ae03efef3785491d40ac96d5e";
  test("nft1 id and launcher id resolve to the same pair", () => {
    const nftId = launcherIdToNftId(launcher);
    expect(nftId).toBe("nft1npnsy3f00cj99snwk7c4hdvcs2ufr2n2uql0aumc2jgagzkfd40qlcnwq9");
    expect(resolveNftId(nftId)).toEqual({ nftId, launcherId: launcher });
    expect(resolveNftId(`0x${launcher.toUpperCase()}`)).toEqual({ nftId, launcherId: launcher });
    expect(resolveNftId("nft1bad")).toBeNull();
    expect(resolveNftId("")).toBeNull();
  });
});
