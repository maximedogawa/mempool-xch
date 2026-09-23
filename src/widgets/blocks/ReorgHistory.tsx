"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useT } from "@/shared/i18n/useT";
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
  const t = useT("blocks");
  const { client } = useSettings();
  const reorgs = useReorgs();
  if (!client.hasIndexed) return null;
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("reorgs.title")}
            <Tooltip text={t("reorgs.hint")} />
          </span>
        }
        action={
          reorgs.data ? (
            <span className="text-xs text-fg-faint">
              {t("reorgs.mostRecent", { count: reorgs.data.reorgs.length })}
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
          <p className="py-4 text-center text-sm text-fg-faint">{t("reorgs.empty")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("reorgs.detected")}</Th>
                <Th className="text-right">{t("reorgs.depth")}</Th>
                <Th className="text-right">{t("reorgs.rolledBackTo")}</Th>
                <Th className="hidden md:table-cell">{t("reorgs.oldPeak")}</Th>
                <Th className="hidden md:table-cell">{t("reorgs.newPeak")}</Th>
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
                      {t("reorgs.depthValue", { count: r.depth })}
                    </Badge>
                  </Td>
                  <Td className="tabular text-right">
                    <Link
                      href={routes.block(r.newPeakHeight)}
                      className="text-accent hover:underline"
                    >
                      #{formatNumber(r.newPeakHeight)}
                    </Link>
                    <span className="text-fg-faint">
                      {" "}
                      {t("reorgs.from", { height: formatNumber(r.oldPeakHeight) })}
                    </span>
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
