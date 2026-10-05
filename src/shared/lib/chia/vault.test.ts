import { describe, expect, test } from "bun:test";
import { bytesToHex, hexToBytes } from "./hex";
import { atomHash, curryTreeHash, hexAtomHash, intAtomHash, pairHash } from "./treeHash";
import { VAULT_MOD_HASHES, vaultP2PuzzleHash } from "./vault";

/** A CLVM value as nested pairs of hex atoms, hashed the slow way to cross-check the helpers. */
type Tree = string | [Tree, Tree];
const hashTree = (t: Tree): Uint8Array =>
  typeof t === "string" ? atomHash(hexToBytes(t)) : pairHash(hashTree(t[0]), hashTree(t[1]));

describe("tree hash", () => {
  test("the empty atom hashes to sha256(0x01)", () => {
    expect(bytesToHex(atomHash(new Uint8Array(0)))).toBe(
      "4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a"
    );
    expect(intAtomHash(0)).toEqual(atomHash(new Uint8Array(0)));
    expect(intAtomHash(128)).toEqual(hexAtomHash("0080"));
  });

  test("hashing a program's structure reproduces its published mod hash", () => {
    // INDEX_WRAPPER is ff02ff05ff0780 = (a 5 7) = (2 . (5 . (7 . ()))).
    expect(bytesToHex(hashTree(["02", ["05", ["07", ""]]]))).toBe(VAULT_MOD_HASHES.indexWrapper);
  });

  test("curryTreeHash matches the hash of the curried program built out in full", () => {
    const mod: Tree = ["02", ["05", ["07", ""]]];
    const modHash = hashTree(mod);
    const x = "bb".repeat(32);
    const y = "07";
    // (a (q . MOD) (c (q . X) (c (q . Y) 1)))
    const quoted = (v: Tree): Tree => ["01", v];
    const program: Tree = [
      "02",
      [quoted(mod), [["04", [quoted(x), [["04", [quoted(y), ["01", ""]]], ""]]], ""]],
    ];
    expect(curryTreeHash(modHash, [hexAtomHash(x), hexAtomHash(y)])).toEqual(hashTree(program));
    expect(curryTreeHash(modHash, [])).toEqual(hashTree(["02", [quoted(mod), ["01", ""]]]));
  });
});

describe("vault p2 puzzle hash", () => {
  test("derives Chia Network's Buy XCH hot wallet from its launcher id", () => {
    expect(
      vaultP2PuzzleHash("a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201")
    ).toBe("fb235e7378220e55086c8d077198febf29331fd9df858ea293c2992ce381b345");
  });

  test("matches Vault Scanner (vaults.xchplorer.com) for other vaults", () => {
    // P2 puzzle hashes as vaults.xchplorer.com/vault/<launcher id> listed them on 2026-09-23.
    const known: [string, string][] = [
      [
        "099e44cff4d1a81512bae8040eace0cabacb390c8de1db968a0ea4fb4ec25c68",
        "0f6697c8492990eb1d8afa5bb2f9b3ee1a343605bc5a7e4917c0b8f31d0adedf",
      ],
      [
        "164a9b3c3d676eb8d36e4a4f734156bf30f70e594a7bbae2a0fc41dd825b5b24",
        "322fb8848b471c65f56d338e61a35112ea69fd9b81b2acd797066fd4811d7a6b",
      ],
      [
        "19235bba5c4b88ad7095d274437b0afdeb1a1acd62ff50c0bb6bff52eee8d139",
        "1ceabbd58a63176dda1418cf3e6edd82d866fa9ba026a74586cedcca7e614970",
      ],
    ];
    for (const [launcher, p2] of known) expect(vaultP2PuzzleHash(launcher)).toBe(p2);
  });

  test("a different nonce gives a different address of the same vault", () => {
    expect(
      vaultP2PuzzleHash("a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201", 1)
    ).toBe("64350b0424a4d3ece47d22bb1662df49639cb21e8273bed1867b88bbf49611e1");
  });
});
