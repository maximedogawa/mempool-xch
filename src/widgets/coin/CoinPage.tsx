"use client";

import Link from "next/link";
import { puzzleHashToAddress, launcherIdToNftId } from "@/shared/lib/chia/address";
import { feePerCost, formatAmount, formatCat, formatCost, formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage, isNotFound } from "@/shared/lib/rpc/errors";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Hash, KindBadge, Skeleton, StatTile, Table, Td, Th, Tr } from "@/shared/ui";
import { readSemantics } from "./semantics";
import { useCoinChildren, useCoinDetails, useCoinMempoolSpends, useCoinRecord } from "./useCoin";
import { SageCoinPanel } from "@/widgets/wallet/SagePanels";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-44 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export function CoinPage({ id }: { id: string | null }) {
  const { endpoints, networkConfig } = useSettings();
  const record = useCoinRecord(id);
  const details = useCoinDetails(id);
  const children = useCoinChildren(id);
  const unspent = record.data ? !record.data.spent : false;
  const pending = useCoinMempoolSpends(id, unspent);

  if (!id) return <EmptyState title="No coin id" description="Open a coin from a transaction or paste a coin id into the search box." />;
  if (record.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (record.error && isNotFound(record.error)) {
    return (
      <div className="flex flex-col gap-4">
        <Heading id={id} />
        <EmptyState title="Coin not found" description="No coin with this id exists on this network. Coins created by a pending spend bundle only appear once the bundle is confirmed." />
      </div>
    );
  }
  if (record.error || !record.data) {
    return <EmptyState tone="danger" title="Could not load the coin" description={errorMessage(record.error)} action={<Button onClick={() => record.refetch()}>Retry</Button>} />;
  }

  const coin = record.data;
  const semantics = readSemantics(details.data?.details?.semantics ?? null);
  const links = details.data?.links ?? null;
  const owner = semantics?.custodyP2 ?? coin.coin.puzzleHash;
  const address = safeAddress(owner, networkConfig.addressPrefix);
  const puzzleAddress = safeAddress(coin.coin.puzzleHash, networkConfig.addressPrefix);
  const kind = semantics?.kind ?? "unknown";
  const amount = kind === "cat" ? `${formatCat(coin.coin.amount)} CAT` : formatAmount(coin.coin.amount);

  return (
    <div className="flex flex-col gap-4">
      <Heading id={id} badge={semantics ? <KindBadge kind={kind} /> : null} spent={coin.spent} />
      <SageCoinPanel coinId={id} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Amount" value={amount} sub={`${coin.coin.amount.toString()} mojo`} tone="primary" />
        <StatTile
          label="Created"
          value={
            <Link href={routes.block(coin.confirmedBlockIndex)} className="text-accent hover:underline">
              {formatNumber(coin.confirmedBlockIndex)}
            </Link>
          }
          sub={coin.timestamp ? `${formatAge(coin.timestamp * 1000)} · ${formatDateTime(coin.timestamp * 1000)}` : undefined}
        />
        <StatTile
          label="Spent"
          value={
            coin.spent ? (
              <Link href={routes.block(coin.spentBlockIndex)} className="text-accent hover:underline">
                {formatNumber(coin.spentBlockIndex)}
              </Link>
            ) : (
              "Unspent"
            )
          }
          sub={coin.spent ? "block height" : pending.data && pending.data.length > 0 ? "spend pending in mempool" : "no pending spend"}
          tone={coin.spent ? "default" : pending.data && pending.data.length > 0 ? "warning" : "primary"}
        />
        <StatTile label="Origin" value={coin.coinbase ? "Reward" : "Spend"} sub={coin.coinbase ? "coinbase (farmer or pool reward)" : "created by a spend bundle"} />
      </div>

      <Card>
        <CardHeader title="Coin record" />
        <CardBody>
          <dl className="divide-y divide-border/60">
            <Row label="Coin id">
              <Hash value={coin.name} full copy />
            </Row>
            <Row label="Parent coin">
              {coin.coinbase ? (
                <span className="inline-flex items-center gap-2">
                  <Hash value={coin.coin.parentCoinInfo} full copy /> <span className="text-xs text-fg-faint">(reward: no parent coin)</span>
                </span>
              ) : (
                <Hash value={coin.coin.parentCoinInfo} href={routes.coin(coin.coin.parentCoinInfo)} full copy />
              )}
            </Row>
            <Row label="Puzzle hash">
              <Hash value={coin.coin.puzzleHash} full copy />
            </Row>
            <Row label="Address">
              {puzzleAddress ? <Hash value={puzzleAddress} href={routes.address(puzzleAddress)} full copy /> : <span className="text-fg-faint">—</span>}
              {semantics?.custodyP2 && semantics.custodyP2 !== coin.coin.puzzleHash && address ? (
                <span className="mt-1 block text-xs text-fg-faint">
                  Owner (inner puzzle): <Hash value={address} href={routes.address(address)} head={10} tail={6} copy />
                </span>
              ) : null}
            </Row>
            <Row label="Creating transaction">
              {links?.createdInTxId ? (
                <Hash value={links.createdInTxId} href={routes.tx(links.createdInTxId)} full />
              ) : (
                <span className="text-fg-faint">
                  {coin.coinbase ? "none (reward coin)" : endpoints.isCoinset ? (details.isLoading ? "…" : "not available from Coinset right now") : "needs Coinset"} ·{" "}
                  <Link href={routes.block(coin.confirmedBlockIndex)} className="text-accent hover:underline">
                    block {formatNumber(coin.confirmedBlockIndex)}
                  </Link>
                </span>
              )}
            </Row>
            <Row label="Spending transaction">
              {coin.spent ? (
                links?.spentInTxId ? (
                  <Hash value={links.spentInTxId} href={routes.tx(links.spentInTxId)} full />
                ) : (
                  <span className="text-fg-faint">
                    {endpoints.isCoinset ? (details.isLoading ? "…" : "not available from Coinset right now") : "needs Coinset"} ·{" "}
                    <Link href={routes.block(coin.spentBlockIndex)} className="text-accent hover:underline">
                      block {formatNumber(coin.spentBlockIndex)}
                    </Link>
                  </span>
                )
              ) : (
                <span className="text-fg-faint">unspent</span>
              )}
            </Row>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Type and asset" />
        <CardBody>
          {!endpoints.isCoinset ? (
            <p className="text-sm text-fg-faint">Coin classification (XCH, CAT, NFT, DID) needs a Coinset endpoint; the current custom node only provides the raw record.</p>
          ) : details.isLoading ? (
            <Skeleton className="h-10" />
          ) : semantics ? (
            <dl className="divide-y divide-border/60">
              <Row label="Kind">
                <span className="inline-flex items-center gap-2">
                  <KindBadge kind={kind} />
                  <span className="text-fg-muted">{semantics.outerPuzzleType}</span>
                  {semantics.classification ? <Badge tone="neutral">{semantics.classification}</Badge> : null}
                </span>
              </Row>
              {semantics.custodyPuzzleType ? <Row label="Custody puzzle">{semantics.custodyPuzzleType}</Row> : null}
              {semantics.assetId ? (
                <Row label={kind === "cat" ? "CAT asset id" : kind === "nft" ? "NFT" : "Launcher id"}>
                  {kind === "cat" ? (
                    <Hash value={semantics.assetId} href={routes.cat(semantics.assetId)} full copy />
                  ) : kind === "nft" ? (
                    <Hash value={launcherIdToNftId(semantics.assetId)} href={routes.nft(launcherIdToNftId(semantics.assetId))} full copy />
                  ) : (
                    <Hash value={semantics.assetId} full copy />
                  )}
                </Row>
              ) : null}
              {semantics.rest.map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, " ")}>
                  <span className="mono break-all">{v}</span>
                </Row>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-fg-faint">Coinset has not classified this coin (its coin-details endpoint is unavailable or the coin is not indexed yet). Plain XCH coins usually need no classification.</p>
          )}
        </CardBody>
      </Card>

      {!coin.spent ? (
        <Card>
          <CardHeader title="Pending spends in the mempool" />
          <CardBody>
            {pending.isLoading ? (
              <Skeleton className="h-10" />
            ) : !pending.data || pending.data.length === 0 ? (
              <p className="text-sm text-fg-faint">No spend bundle in the mempool spends this coin.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Spend bundle</Th>
                    <Th className="text-right">Fee</Th>
                    <Th className="text-right">Cost</Th>
                    <Th className="text-right">Fee / cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.data.map((item) => (
                    <Tr key={item.name}>
                      <Td>
                        <Hash value={item.name} href={routes.tx(item.name)} head={10} tail={6} />
                      </Td>
                      <Td className="tabular text-right">{formatAmount(item.fee)}</Td>
                      <Td className="tabular text-right">{formatCost(item.cost)}</Td>
                      <Td className="tabular text-right">{formatFeeRate(feePerCost(item.fee, item.cost))}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`Children${children.data ? ` (${children.data.length})` : ""}`} />
        <CardBody>
          {children.isLoading ? (
            <Skeleton className="h-10" />
          ) : !children.data || children.data.length === 0 ? (
            <p className="text-sm text-fg-faint">{coin.spent ? "No child coins were found for this coin." : "Unspent coins have no children yet."}</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Coin id</Th>
                  <Th>Address</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {children.data.map((c) => {
                  const addr = safeAddress(c.coin.puzzleHash, networkConfig.addressPrefix);
                  return (
                    <Tr key={c.name}>
                      <Td>
                        <Hash value={c.name} href={routes.coin(c.name)} head={10} tail={6} />
                      </Td>
                      <Td>{addr ? <Hash value={addr} href={routes.address(addr)} head={8} tail={5} /> : "—"}</Td>
                      <Td className="tabular text-right">{formatAmount(c.coin.amount)}</Td>
                      <Td className="text-right">
                        {c.spent ? (
                          <Link href={routes.block(c.spentBlockIndex)} className="text-xs text-fg-muted hover:underline">
                            spent at {formatNumber(c.spentBlockIndex)}
                          </Link>
                        ) : (
                          <span className="text-xs text-primary">unspent</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function safeAddress(puzzleHash: string, prefix: "xch" | "txch"): string | null {
  try {
    return puzzleHashToAddress(puzzleHash, prefix);
  } catch {
    return null;
  }
}

function Heading({ id, badge, spent }: { id: string; badge?: React.ReactNode; spent?: boolean }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Coin</h1>
        {spent === undefined ? null : spent ? <Badge tone="neutral">Spent</Badge> : <Badge tone="primary">Unspent</Badge>}
        {badge}
      </div>
      <Hash value={id} full copy className="text-sm text-fg-muted" />
    </header>
  );
}
