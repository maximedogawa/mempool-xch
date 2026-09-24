# mempoolxch.space

**[mempoolxch.space](https://mempoolxch.space)** shows the Chia mempool the way mempool.space shows Bitcoin's: the blocks about to be
farmed and what will be in them, the blocks just confirmed, what a transaction costs to get in,
and a search box that understands anything you paste from a Chia wallet — a transaction id, a
block height, an address, a coin id, a CAT, an NFT or a DID.

It runs in any browser and installs into the [Sage wallet](https://github.com/xch-dev/sage) as an
in-app app. Chain data comes from [Coinset](https://coinset.org), so nothing has to be synced;
your own node can be plugged in from the settings page.

## Run it yourself

```bash
bun install
bun run dev          # http://localhost:3000
```

Production: `docker compose up --build` serves the same image ONCE runs at mempoolxch.space on
http://localhost:8080. See [deployment/README.md](deployment/README.md).

## Develop

```bash
bun run type-check && bun run lint && bun run test   # unit tests, no network
bun run build        # standalone server
bun run test:e2e     # Playwright against a mocked Coinset
bun run build:sage   # Sage wallet snapshot in out/
```

Architecture, data sources and guides live in the
[wiki](https://github.com/maximedogawa/mempool-xch-wiki); work items in the
[backlog](https://github.com/maximedogawa/mempool-xch-backlog) (Backlog.md).

## Licence

Copyright (C) 2026 Maxim Edogawa and the mempoolxch.space contributors.

This program is free software: you can redistribute it and/or modify it under the terms of the
[GNU Affero General Public License](LICENSE) as published by the Free Software Foundation, either
version 3 of the License, or (at your option) any later version. It is distributed in the hope
that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the licence for details.

mempool.space was a visual reference only; no code was copied.
