# Pools: how blocks are attributed, and adding a pool to the registry

The [/pools](https://mempoolxch.space/pools) page, the block cubes, the blocks list and the
"Farmed by" rows name a pool from `src/shared/lib/pools/registry.json` in the app repo
(TASK-060, TASK-061). An address nobody can vouch for stays unnamed, never guessed.

## A Chia pool never signs a block

Unlike Bitcoin, the farmer wins and signs every block with their own plots. A pool only combines
the strength of many farmers, so one pool owns **many** payout addresses. What a block record
carries is `pool_puzzle_hash`, the address the 7/8 pool reward is paid to, and it means one of
two things:

- **Official pool protocol (PlotNFT, `chia plotnft join`).** `pool_puzzle_hash` is the farmer's
  own PlotNFT address (a `p2_singleton` puzzle hash), unique per farmer. It says nothing about
  the pool. The pool appears when the reward is **claimed**: the PlotNFT singleton is spent
  together with the reward coin and pays it to the `target_puzzle_hash` the pool publishes at
  its `/pool_info` endpoint. A self-pooling PlotNFT claims to the farmer's own wallet instead.
- **Fixed address ("both shares").** `pool_puzzle_hash` equals `farmer_puzzle_hash` on every
  block: a solo farmer, or an operator outside the official protocol (NoSSD, and the separate
  addresses H9.com and Spacefarmers.io run next to their protocol pools).

So the page groups payout addresses by **where their rewards are claimed to**, and only then
looks names up.

## How the claim is resolved

`src/shared/lib/pools/claims.ts`, client-side, Coinset only (decision-012: no server store):

1. The window's distinct payout addresses, minus both-shares addresses and registry-known fixed
   addresses, are looked up with the indexed `get_transactions_by_p2` (`limit: 1`, newest first).
2. In that transaction, an input whose custody type is `P2SingletonOrDelayedPuzhash` at the
   payout address is a claim. Its target is the one output of the same amount in the same event
   that is not the singleton itself; an ambiguous destination is not a claim. A singleton input
   of type `PoolWaitingRoom` marks a self-pooling PlotNFT.
3. Pools batch many farmers' claims into one spend bundle, so one lookup usually settles several
   addresses. A cold cache is ~780 addresses and ~560 calls (under 30 s, three at a time, one
   retry after Coinset's burst errors).
4. `claimStore.ts` keeps payout → target in localStorage per network: 14 days for a resolved
   claim (a farmer can switch pools), 12 hours for "no claim yet". A return visit asks nothing
   new. The block and transaction pages resolve their single address the same way.

A custom node has no indexed API: PlotNFT farmers are then listed one by one, with a note.

An address stays "Unknown" when its rewards were never claimed (a fresh PlotNFT, or a pool that
has not collected yet) or when its latest transaction is not a PlotNFT claim.

## Registry format

```json
{
  "pools": [
    {
      "name": "Spacefarmers.io",
      "url": "https://spacefarmers.io/",
      "source": "Claim target: https://xch.spacefarmers.io/pool_info (target_puzzle_hash, read 2026-09-17). The payout address is ...",
      "claimTargets": ["61751cc01a73d5e64a07d6e37b451eed9f157f04da53e3c7d06f355928ba2113"],
      "payoutAddresses": ["405e4339bc6684e79b865b78ec13f5c343edbcb12b3544eacece440de3bf24e4"]
    }
  ]
}
```

- `claimTargets`: the pool's `/pool_info` `target_puzzle_hash`. Matched against resolved claim
  targets, never against a block's `pool_puzzle_hash`.
- `payoutAddresses`: fixed addresses that appear directly as a block's `pool_puzzle_hash`.

Both are lists (a pool can run several), either may be empty, and everything a pool owns merges
into one row. Strip any `0x` prefix; hashes are exactly 64 lowercase hex characters.

## Only ship a sourced entry

Every entry needs a `source` a reader can check.

- **Claim target:** fetch the pool's own `pool_info` (`curl https://<pool host>/pool_info`) and
  record the URL and the date. That endpoint is the pool protocol's authoritative statement of
  where the pool collects rewards. The `/pools` page is the cross-check: unnamed groups show as
  "Unnamed pool, claims to xch1…", so a correct target turns an existing multi-farmer group into
  a named one.
- **Fixed payout address:** the pool's own block list or documentation, cross-referenced against
  Coinset (`get_block_record_by_height` for a block the pool credits to itself), plus the check
  that `pool_puzzle_hash == farmer_puzzle_hash` across several of its blocks. A third-party
  table (e.g. xchmempool.com/pools) is a lead to verify, not a source on its own.

Do not name a group because it is large, and do not read a pool's name out of a PlotNFT's
launcher: that records the pool the farmer joined first, not the one they farm with today (many
launchers still say `pool.space`, which closed).

History, so the mistake is not repeated: the first registry matched `pool_info` targets against
`pool_puzzle_hash` and found zero blocks; the second concluded PlotNFT pools could not be named
at all and listed them as "Unidentified". Both compared the right hash with the wrong field.

## After adding an entry

Run `bun test` (`src/shared/lib/pools/*.test.ts`) and check `/pools`: the pool's farmers should
collapse into one named row, and a block it farmed should show the name on the block page.
