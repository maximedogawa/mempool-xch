# Design system

An original implementation modelled on mempool.space's layout (backlog decision-003; no code,
CSS or artwork copied), shifted to a Chia-green accent. Side-by-side reference:
[design/README.md](design/README.md).

## Tokens

All colours are CSS variables in `src/app/globals.css`, mapped into Tailwind 4 via `@theme`.
Dark is the default; `[data-theme="light"]` flips the surfaces (Sage's theme drives this
attribute inside the wallet). Text tokens pass WCAG AA on every surface (`--fg-faint` is
`#8d96b5` dark / `#5f6886` light), verified by the axe suite on every route.

Fee bands (mojos per CLVM cost) map to `--fee-0` … `--fee-5`: 0 · 0.1+ · 1+ · 5+ · 25+ · 100+,
grey-green through green, yellow, orange to red. Asset kinds have their own tokens
(`--kind-xch`, `--kind-cat`, `--kind-nft`, `--kind-did`, `--kind-offer`).

## Block queue

`src/widgets/blocks/`: one horizontal scroller with the scrollbar hidden, projected blocks
left of a dashed divider (next block nearest to it), confirmed blocks right (newest nearest).
It opens anchored on the divider and can be dragged with the mouse; once the visitor scrolls
it stops re-anchoring.

Each block is a CSS "cube" (`BlockCube.tsx`): a front face whose lower part is filled to the
block's cost usage with the fee gradient, a bright waterline at the fill level, a faint grid
on the empty part, a lit top face (`skewX(-45deg)`) and a shaded side face (`skewY(-45deg)`)
whose edges meet the front face exactly. The next block pulses with a `drop-shadow` glow so the
halo follows the silhouette. Projected cubes show median fee rate, fee range, total fees,
bundle count and an ETA chip; confirmed cubes show total fees, reward claims, age, the height
above and a colour-coded farmer chip below, so both sides share one baseline.

## Other dashboard elements

- **Connection pill**: pulsing ring while the WebSocket is live, sweeping radar while polling,
  spinner while connecting, red when offline; shows peak height and last-update age.
- **Capacity bar** (`src/shared/ui/CapacityBar.tsx`): ten block-sized segments, gradient fill
  from green to red, travelling sheen, eased width; one-line readout "99% · 9.9/10 blocks".
- **Next block "goggles"** (`src/widgets/goggles/`): squarified treemap of the coming block,
  cell area = cost, colour = fee band or asset kind (toggle), outline = asset kind; cells large
  enough carry the asset icon (Dexie CAT icon, MintGarden NFT thumbnail, XCH/DID/offer/pool
  glyphs) and the amount in its own unit; chips show count and total cost per kind; cells slide
  to new positions and fade in with a short stagger. 500 cells lay out in well under 100 ms.
- **Block time** card: live counter since the last transaction block with a progress bar to
  the expected gap, average block time, share of transaction blocks, observed gap.
- **Asset badges and amounts** (`src/shared/ui/AssetBadge.tsx`, `AssetAmount.tsx`): XCH mark,
  CAT icon from Dexie's per-id CDN and ticker from its asset list (cached a day), NFT/DID/offer/pool glyphs;
  amounts always in the asset's own unit (XCH 12 dp, CAT 3 dp, NFT/DID counts).
- **Block totals** (`src/widgets/block/AssetsMoved.tsx`): net XCH that changed hands, CAT chips,
  NFT and pool counts on the block page; "X XCH moved" on the recent cubes and in the blocks list.
- Flair, kept subtle: gradient hairline under the header, soft green glow at the top of the
  page, card hover lift, row highlight for new feed entries.

## Responsiveness

Every route works at 320–430 px with safe-area insets, no horizontal page scroll (verified by
the Playwright mobile project), 44 px touch targets in the mobile nav, and tables that hide
low-priority columns under `sm`/`md`.
