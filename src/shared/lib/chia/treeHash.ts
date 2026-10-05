import { encodeAmount } from "./coin";
import { hexToBytes } from "./hex";
import { sha256 } from "./sha256";

/**
 * CLVM tree hashes (the puzzle hash of a program), computed from the hashes of its parts so a
 * curried puzzle's hash can be derived without the program bytes: an atom hashes as
 * sha256(0x01 || bytes), a pair as sha256(0x02 || left || right).
 */

export function atomHash(bytes: Uint8Array): Uint8Array {
  const buf = new Uint8Array(bytes.length + 1);
  buf[0] = 1;
  buf.set(bytes, 1);
  return sha256(buf);
}

export function pairHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  const buf = new Uint8Array(65);
  buf[0] = 2;
  buf.set(left, 1);
  buf.set(right, 33);
  return sha256(buf);
}

/** Tree hash of a hex atom (a 32-byte id, a mod hash used as a value). */
export function hexAtomHash(hex: string): Uint8Array {
  return atomHash(hexToBytes(hex));
}

/** Tree hash of a CLVM integer atom (minimal two's-complement, so 0 is the empty atom). */
export function intAtomHash(value: bigint | number): Uint8Array {
  return atomHash(encodeAmount(BigInt(value)));
}

const NIL = atomHash(new Uint8Array(0));
const OP_Q = atomHash(Uint8Array.of(1));
const OP_A = atomHash(Uint8Array.of(2));
const OP_C = atomHash(Uint8Array.of(4));
const ENV = OP_Q; // `1`, the whole environment, is the same atom as `q`.

/**
 * Tree hash of `mod` curried with `args` (each given as its own tree hash), i.e. of
 * `(a (q . MOD) (c (q . a1) (c (q . a2) … 1)))` — clvm_utils' `curry_tree_hash`.
 */
export function curryTreeHash(modHash: Uint8Array, args: readonly Uint8Array[]): Uint8Array {
  const env = args.reduceRight(
    (rest, arg) => pairHash(OP_C, pairHash(pairHash(OP_Q, arg), pairHash(rest, NIL))),
    ENV
  );
  return pairHash(OP_A, pairHash(pairHash(OP_Q, modHash), pairHash(env, NIL)));
}
