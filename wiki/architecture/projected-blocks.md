# Projected blocks

The signature element left of the dotted divider. Chia's equivalent of mempool.space's
projected blocks is to pack pending spend bundles the way a full node fills a transaction block:

1. Take the compact mempool (`fee`, `cost` per spend bundle).
2. Sort by fee per CLVM cost descending (ties: first seen, then id).
3. Walk the list and take every item that still fits the block (limit `block_max_cost`,
   11,000,000,000 from `get_blockchain_state`); items that do not fit are skipped and become
   the first candidates for the next block, exactly like the node's `create_block_generator`.
   Items larger than a block are impossible on chain and are dropped.
4. Keep at most 8 blocks; anything beyond is folded into the last one.

Each block shows the fee-rate range (mojos per cost), the median rate, cost used as a fill
level, the item count and an ETA. The ETA assumes a transaction block every
`average_block_time / 0.36` seconds (roughly one in three Chia blocks carries transactions).

Chia accepts 0-fee spends while the mempool has capacity, so a whole projected block at 0 fee
is normal; it is drawn in the grey-green "0" band. Fee bands (mojos per cost):
0 · 0.1+ · 1+ · 5+ · 25+ · 100+, mapped to the `--fee-0` … `--fee-5` tokens.

Implementation: `src/shared/lib/mempool/packing.ts` (`packProjectedBlocks`,
`findProjectedPosition`), unit-tested with empty, single, zero-fee, overflowing and tie
fixtures. The transaction page uses `findProjectedPosition` to show a pending item's block and
ETA.
