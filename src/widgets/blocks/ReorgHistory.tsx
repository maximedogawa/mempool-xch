"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Hash,
  Skeleton,
  Table,
  Td,
  Th,
  Tooltip,
  Tr,
} from "@/shared/ui";

/** Reorg events Coinset persisted, newest first; refreshed when the live stream reports one. */
export function useReorgs(limit = 20) {
  const { client, endpoints, hydrated } = useSettings();
  const lastReorg = useLiveValue("lastReorg");
  return useQuery({
    queryKey: [
      ...queryKeys.chainRoot(endpoints.network),
      "reorgs",
      limit,
      lastReorg?.detectedAtMs ?? 0,
    ],
    queryFn: ({ signal }) => client.getReorgs({ limit }, signal),
    enabled: hydrated && client.hasIndexed,
    staleTime: 5 * 60_000,
  });
}

/**
 * Chain reorganisations as Coinset saw them: the rolled-back peak, the peak that replaced it
 * and how many blocks were reorganised out. Coinset-only; a custom node has no such log.
 */
export function ReorgHistory() {
  const { client } = useSettings();
  const reorgs = useReorgs();
  if (!client.hasIndexed) return null;
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Reorg history
            <Tooltip text="A reorg replaces the most recent block(s) with a competing chain. Chia reorgs are usually one block deep and harmless; a transaction in a reorged block is simply included again a block later." />
          </span>
        }
        action={
          reorgs.data ? (
            <span className="text-xs text-fg-faint">
              {reorgs.data.reorgs.length} most recent, as detected by Coinset
            </span>
          ) : null
        }
      />
      <CardBody>
        {reorgs.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : reorgs.error ? (
          <p className="text-sm text-danger">{errorMessage(reorgs.error)}</p>
        ) : !reorgs.data || reorgs.data.reorgs.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-faint">No reorgs recorded.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Detected</Th>
                <Th className="text-right">Depth</Th>
                <Th className="text-right">Rolled back to</Th>
                <Th className="hidden md:table-cell">Old peak</Th>
                <Th className="hidden md:table-cell">New peak</Th>
              </tr>
            </thead>
            <tbody>
              {reorgs.data.reorgs.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <span title={formatDateTime(r.detectedAtMs)}>{formatAge(r.detectedAtMs)}</span>
                  </Td>
                  <Td className="text-right">
                    <Badge tone={r.depth > 1 ? "warning" : "neutral"}>
                      {r.depth} block{r.depth === 1 ? "" : "s"}
                    </Badge>
                  </Td>
                  <Td className="tabular text-right">
                    <Link
                      href={routes.block(r.newPeakHeight)}
                      className="text-accent hover:underline"
                    >
                      #{formatNumber(r.newPeakHeight)}
                    </Link>
                    <span className="text-fg-faint"> from #{formatNumber(r.oldPeakHeight)}</span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Hash value={r.oldPeakHash} head={8} tail={5} />
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Hash
                      value={r.newPeakHash}
                      href={routes.block(r.newPeakHash)}
                      head={8}
                      tail={5}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
