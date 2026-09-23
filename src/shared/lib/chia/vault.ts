import { bytesToHex, hexToBytes } from "./hex";
import { curryTreeHash, hexAtomHash, intAtomHash, pairHash } from "./treeHash";

/**
 * Mod hashes pinned from chia-puzzles 0.20.3 and chia-sdk-types 0.36 (the index wrapper's is
 * defined there, not in chia-puzzles).
 */
export const VAULT_MOD_HASHES = {
  singletonTopLayerV1_1: "7faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9f",
  singletonLauncher: "eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9",
  singletonMember: "6f1cebc5a6d3661ad87d3558146259ca580729b244b7662757f8d1c34a6a9ad9",
  delegatedPuzzleFeeder: "9db33d93853179903d4dd272a00345ee6630dc94907dbcdd96368df6931060fd",
  indexWrapper: "847d971ef523417d555ea9854b1612837155d34d453298defcd310774305f657",
} as const;

/**
 * The puzzle hash a Chia Vault receives its funds at, derived from the vault's launcher id the
 * way chia-sdk-driver's `P2Singleton::tree_hash` does: a MIPS member that only the vault
 * singleton can spend,
 *   IndexWrapper(nonce, DelegatedPuzzleFeeder(SingletonMember(SingletonStruct(launcher_id)))).
 * Wallets use nonce 0 for the vault's address; other nonces are further addresses of the same
 * vault.
 */
export function vaultP2PuzzleHash(launcherId: string, nonce = 0): string {
  const singletonStruct = pairHash(
    hexAtomHash(VAULT_MOD_HASHES.singletonTopLayerV1_1),
    pairHash(hexAtomHash(launcherId), hexAtomHash(VAULT_MOD_HASHES.singletonLauncher))
  );
  const member = curryTreeHash(hexToBytes(VAULT_MOD_HASHES.singletonMember), [singletonStruct]);
  const feeder = curryTreeHash(hexToBytes(VAULT_MOD_HASHES.delegatedPuzzleFeeder), [member]);
  return bytesToHex(
    curryTreeHash(hexToBytes(VAULT_MOD_HASHES.indexWrapper), [intAtomHash(nonce), feeder])
  );
}
