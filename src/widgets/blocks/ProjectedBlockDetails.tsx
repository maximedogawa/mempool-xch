"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { formatAge, formatEta } from "@/shared/lib/format/time";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import {
  AssetAmount,
  AssetBadge,
  Card,
  CardBody,
  CardHeader,
  Hash,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { Button } from "@/shared/ui/Button";

export function ProjectedBlockDetails({
  block,
  onClose,
}: {
  block: ProjectedBlock;
  onClose: () => void;
}) {
  const t = useT("blocks");
  const items = block.items.slice(0, 200);
  return (
    <Card className="mt-4">
      <CardHeader
        title={t("details.title", {
          n: block.index + 1,
          bundles: t("details.bundles", { count: block.items.length }),
          cost: formatCost(block.totalCost),
          eta: formatEta(block.etaSeconds),
        })}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("details.closeLabel")}>
            <X size={14} aria-hidden="true" /> {t("details.close")}
          </Button>
        }
      />
      <CardBody>
        <Table>
          <thead>
            <tr>
              <Th>{t("details.txId")}</Th>
              <Th>{t("details.kind")}</Th>
              <Th className="text-right">{t("details.fee")}</Th>
              <Th className="text-right">{t("details.cost")}</Th>
              <Th className="text-right">{t("details.feePerCost")}</Th>
              <Th className="text-right">{t("details.value")}</Th>
              <Th className="text-right">{t("details.seen")}</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Hash value={item.id} href={routes.tx(item.id)} />
                </Td>
                <Td>
                  <AssetBadge kind={item.kind} assetId={item.assetIds[0]} />
                </Td>
                <Td className="tabular text-right">{formatAmount(BigInt(item.fee))}</Td>
                <Td className="tabular text-right">{formatCost(item.cost)}</Td>
                <Td className="tabular text-right">{formatFeeRate(item.feeRate)}</Td>
                <Td className="text-right">
                  <AssetAmount assets={item.assets} kind={item.kind} />
                </Td>
                <Td className="tabular text-right text-fg-faint">{formatAge(item.firstSeen)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {block.items.length > items.length ? (
          <p className="mt-2 text-xs text-fg-faint">
            {t.rich("details.showingFirst", {
              shown: items.length,
              total: block.items.length,
              link: (chunks) => (
                <Link href={routes.mempool()} className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
