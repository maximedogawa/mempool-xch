"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { formatAge, formatEta } from "@/shared/lib/format/time";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader, Hash, KindBadge, Table, Td, Th, Tr } from "@/shared/ui";
import { Button } from "@/shared/ui/Button";

export function ProjectedBlockDetails({ block, onClose }: { block: ProjectedBlock; onClose: () => void }) {
  const items = block.items.slice(0, 200);
  return (
    <Card className="mt-4">
      <CardHeader
        title={`Projected block ${block.index + 1} · ${block.items.length} spend bundles · ${formatCost(block.totalCost)} cost · ${formatEta(block.etaSeconds)}`}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close projected block details">
            <X size={14} aria-hidden="true" /> Close
          </Button>
        }
      />
      <CardBody>
        <Table>
          <thead>
            <tr>
              <Th>Tx id</Th>
              <Th>Kind</Th>
              <Th className="text-right">Fee</Th>
              <Th className="text-right">Cost</Th>
              <Th className="text-right">Fee / cost</Th>
              <Th className="text-right">Value</Th>
              <Th className="text-right">Seen</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Hash value={item.id} href={routes.tx(item.id)} />
                </Td>
                <Td>
                  <KindBadge kind={item.kind} />
                </Td>
                <Td className="tabular text-right">{formatAmount(BigInt(item.fee))}</Td>
                <Td className="tabular text-right">{formatCost(item.cost)}</Td>
                <Td className="tabular text-right">{formatFeeRate(item.feeRate)}</Td>
                <Td className="tabular text-right">{formatAmount(BigInt(item.value))}</Td>
                <Td className="tabular text-right text-fg-faint">{formatAge(item.firstSeen)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {block.items.length > items.length ? (
          <p className="mt-2 text-xs text-fg-faint">
            Showing the first {items.length} of {block.items.length}. <Link href={routes.mempool()} className="text-accent hover:underline">Open the full mempool table</Link>.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
