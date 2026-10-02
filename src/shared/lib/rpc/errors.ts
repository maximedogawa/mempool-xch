/** Errors distinguish network failures, non-success RPC responses and malformed JSON. */
import { plainT } from "@/shared/i18n/plain";
import commonNs from "@/shared/i18n/messages/en/common";

export type RpcErrorKind = "network" | "http" | "rpc" | "malformed" | "not_found" | "aborted";

export class RpcError extends Error {
  readonly kind: RpcErrorKind;
  readonly method: string;
  readonly status?: number;
  readonly detail?: unknown;
  /** Transport already exhausted its bounded retries; avoid multiplying them in Query. */
  retryHandled = false;

  constructor(
    kind: RpcErrorKind,
    method: string,
    message: string,
    extra?: { status?: number; detail?: unknown }
  ) {
    super(message);
    this.name = "RpcError";
    this.kind = kind;
    this.method = method;
    this.status = extra?.status;
    this.detail = extra?.detail;
  }

  /** Short user-facing description. */
  get userMessage(): string {
    const t = plainT(commonNs);
    switch (this.kind) {
      case "network":
        return t("rpcError.network");
      case "http":
        return this.status === undefined
          ? t("rpcError.httpUnknown")
          : t("rpcError.http", { status: String(this.status) });
      case "rpc":
        return this.message;
      case "malformed":
        return t("rpcError.malformed");
      case "not_found":
        return t("rpcError.notFound");
      case "aborted":
        return t("rpcError.aborted");
    }
  }
}

export function isRpcError(error: unknown, kind?: RpcErrorKind): error is RpcError {
  return error instanceof RpcError && (kind === undefined || error.kind === kind);
}

export function isNotFound(error: unknown): boolean {
  return isRpcError(error, "not_found");
}

export function errorMessage(error: unknown): string {
  if (error instanceof RpcError) return error.userMessage;
  if (error instanceof Error) return error.message;
  return String(error);
}
