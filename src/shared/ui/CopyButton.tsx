"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import uiNs from "@/shared/i18n/messages/en/ui";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const t = useT(uiNs);
  const [copied, setCopied] = useState(false);
  const text = label ?? t("copy");
  return (
    <button
      type="button"
      aria-label={t("copyToClipboard", { label: text })}
      title={text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard may be unavailable (insecure context); ignore silently.
        }
      }}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      {copied ? (
        <Check size={13} className="text-primary" aria-hidden="true" />
      ) : (
        <Copy size={13} aria-hidden="true" />
      )}
    </button>
  );
}
