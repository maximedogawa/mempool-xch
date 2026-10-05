"use client";

import { useCallback } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
import { formatDuration } from "@/shared/lib/format/time";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import type { ClawbackCoin } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CatRef,
  Hash,
  Skeleton,
  Table,
  Td,
  Th,
  Tooltip,
  Tr,
} from "@/shared/ui";
import { usePagedList } from "@/widgets/assets/usePagedList";
import addressNs from "@/shared/i18n/messages/en/address";

/**
 * Clawback coins sent to this address: the sender can pull them back until the timelock
 * runs out, after which the receiver can claim them. Coinset-only; nothing rendered otherwise.
 */
export function ClawbacksCard({ p2 }: { p2: string }) {
  const t = useT(addressNs);
  const { client, endpoints, networkConfig } = useSettings();
  const network = endpoints.network;
  const list = usePagedList<ClawbackCoin>({
    queryKey: useCallback(
      (cursor: string | null) => queryKeys.address(network, p2, "clawbacks", cursor),
      [network, p2]
    ),
    fetchPage: useCallback(
      async (cursor: string | null, limit: number, signal: AbortSignal) => {
        const page = await client.getClawbackCoinsByReceiver(
          p2,
          { cursor: cursor ?? undefined, limit },
          signal
        );
        return { items: page.clawbacks, truncated: page.truncated, nextCursor: page.nextCursor };
      },
      [client, p2]
    ),
    enabled: client.hasIndexed,
    refetchInterval: 60_000,
    itemKey: (c) => c.coinId,
  });
  if (!client.hasIndexed) return null;
  // The card earns its place only when there is something to show or while we do not know yet.
  if (!list.isLoading && !list.error && list.items.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("clawbacks.title")}
            <Tooltip text={t("clawbacks.hint")} />
          </span>
        }
        action={
          list.items.some((c) => c.revocable) ? (
            <Badge tone="warning">
              {t("clawbacks.revocable", {
                count: list.items.filter((c) => c.revocable).length,
              })}
            </Badge>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-3">
        {list.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : list.error ? (
          <p className="text-sm text-danger">{errorMessage(list.error)}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("clawbacks.coin")}</Th>
                <Th>{t("clawbacks.amount")}</Th>
                <Th className="hidden md:table-cell">{t("clawbacks.from")}</Th>
                <Th className="text-right">{t("clawbacks.timelock")}</Th>
                <Th className="text-right">{t("clawbacks.state")}</Th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((c) => {
                const sender = puzzleHashToAddress(c.senderP2, networkConfig.addressPrefix);
                return (
                  <Tr key={c.coinId}>
                    <Td>
                      <Hash value={c.coinId} href={routes.coin(c.coinId)} head={8} tail={5} />
                    </Td>
                    <Td className="tabular">
                      {c.assetKind === "cat" && c.assetId ? (
                        <CatRef assetId={c.assetId} amountText={formatCat(c.amount)} />
                      ) : c.assetKind === "nft" ? (
                        <Badge tone="nft">NFT</Badge>
                      ) : (
                        formatAmount(c.amount)
                      )}
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Hash value={sender} href={routes.address(sender)} head={8} tail={5} />
                    </Td>
                    <Td className="tabular text-right">{formatDuration(c.seconds)}</Td>
                    <Td className="text-right">
                      {c.revocable ? (
                        <Badge tone="warning">{t("clawbacks.canClawBack")}</Badge>
                      ) : (
                        <Badge tone="primary">{t("clawbacks.claimable")}</Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {list.hasMore ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void list.loadMore()}
            disabled={list.loadingMore}
            className="self-center"
          >
            {list.loadingMore ? t("loading") : t("loadMore")}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
