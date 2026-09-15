/** Errors distinguish network failures, non-success RPC responses and malformed JSON (TASK-002). */
export type RpcErrorKind = "network" | "http" | "rpc" | "malformed" | "not_found" | "aborted";

export class RpcError extends Error {
  readonly kind: RpcErrorKind;
  readonly method: string;
  readonly status?: number;
  readonly detail?: unknown;

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
    switch (this.kind) {
      case "network":
        return "Could not reach the node. Check your connection or the configured endpoint.";
      case "http":
        return `The node answered with HTTP ${this.status ?? "error"}.`;
      case "rpc":
        return this.message;
      case "malformed":
        return "The node returned a response that could not be parsed.";
      case "not_found":
        return "Not found.";
      case "aborted":
        return "Request cancelled.";
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
