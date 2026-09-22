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

  test("a different nonce gives a different address of the same vault", () => {
    expect(
      vaultP2PuzzleHash("a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201", 1)
    ).toBe("64350b0424a4d3ece47d22bb1662df49639cb21e8273bed1867b88bbf49611e1");
  });
});
