/**
 * Live update stream: Coinset WebSocket (peak + transaction events) with automatic
 * reconnect and a polling fallback on get_blockchain_state for endpoints without a stream.
 * Emits one normalised event type so the UI does not care where updates come from.
 */
import { compactAllFromGateway } from "@/shared/lib/mempool/gatewayItem";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { parseJsonSafe } from "@/shared/lib/rpc/json";

export type LiveStatus = "connecting" | "live" | "polling" | "offline";

export type LiveEvent =
  | { type: "peak"; height: number; tx: boolean }
  | {
      type: "transaction";
      ids: string[];
      status: "pending" | "confirmed" | "removed";
      height: number | null;
    }
  | { type: "status"; status: LiveStatus }
  | { type: "mempool"; size: number }
  /** Coinset detected a chain reorganisation (old peak rolled back to the new one). */
  | {
      type: "reorg";
      oldPeakHeight: number;
      newPeakHeight: number;
      depth: number;
      detectedAtMs: number;
    }
  /**
   * A nodexch gateway's own figures (dashboard event, kind "live"): what a poll of
   * get_blockchain_state would say about the peak and the mempool, pushed instead of asked.
   */
  | {
      type: "state";
      peakHeight: number;
      mempoolSize: number;
      mempoolCost: number;
      mempoolFees: bigint;
      synced: boolean;
    }
  /**
   * What entered and left a nodexch gateway's mempool since its last frame (dashboard event,
   * kind "mempool_delta"). `added` is null when an entry came without its details (an older
   * gateway, or an item its budget left unfetched): the mempool then has to be read again.
   */
  | { type: "mempoolDelta"; added: CompactMempoolItem[] | null; removed: string[] }
  /** Coinset's periodic netspace estimate (dashboard event, kind "netspace"). */
  | { type: "netspace"; bytes: bigint; difficulty: number }
  /** A Chia Vault recovery step seen by Coinset (events=vault). */
  | {
      type: "vault";
      vaultId: string;
      action: string;
      status: string;
      txId: string | null;
      at: number;
    };

export type LiveTransport = "websocket" | "polling";

export interface PollSample {
  peakHeight: number;
  peakIsTx: boolean;
  mempoolSize: number;
}

export interface LiveStreamOptions {
  /** Null → polling only. */
  wsUrl: string | null;
  poll: (signal: AbortSignal) => Promise<PollSample>;
  onEvent: (event: LiveEvent) => void;
  pollIntervalMs?: number;
  /**
   * The interval while the socket is open and pushes `state` events: the poll is then only a
   * check that the socket still tells the truth, and each one is a paid request on a metered
   * gateway. Defaults to `pollIntervalMs` (no change).
   */
  quietPollIntervalMs?: number;
  /** Fall back to polling after this many consecutive WebSocket failures. */
  maxWsFailures?: number;
  WebSocketImpl?: typeof WebSocket;
  setTimeoutImpl?: (fn: () => void, ms: number) => TimerId;
  clearTimeoutImpl?: (id: TimerId) => void;
}

export type TimerId = ReturnType<typeof setTimeout>;

export interface LiveStream {
  start: () => void;
  stop: () => void;
  readonly status: LiveStatus;
  readonly transport: LiveTransport;
}

interface CoinsetEnvelope {
  message?: { type?: string; data?: Record<string, unknown> };
}

/** Parse one Coinset WebSocket frame into zero or one live events. */
/** The events the app listens to. */
export const STREAM_EVENTS = "peak,transaction,reorg,dashboard,vault";

/**
 * The socket URL with the events asked for. Built with URL, not by appending: a nodexch
 * gateway's WebSocket URL already carries its publishable key in the query (`?key=`).
 */
export function streamUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl);
    url.searchParams.delete("events");
    // Commas stay literal (as Coinset has always been sent them), not `%2C`.
    return `${url.toString()}${url.search ? "&" : "?"}events=${STREAM_EVENTS}`;
  } catch {
    return `${wsUrl}?events=${STREAM_EVENTS}`;
  }
}

export function parseCoinsetMessage(raw: string): LiveEvent | null {
  let envelope: CoinsetEnvelope;
  try {
    // Coin amounts in a mempool delta are mojos as bare numbers, which can pass 2^53.
    envelope = (
      raw.includes('"mempool_delta"') ? parseJsonSafe(raw) : JSON.parse(raw)
    ) as CoinsetEnvelope;
  } catch {
    return null;
  }
  const message = envelope.message;
  if (!message || typeof message !== "object") return null;
  const data = message.data ?? {};
  if (message.type === "peak") {
    const height = Number(data.height);
    if (!Number.isFinite(height)) return null;
    return { type: "peak", height, tx: Boolean(data.tx) };
  }
  if (message.type === "transaction") {
    const ids = Array.isArray(data.ids)
      ? data.ids.map((id) => String(id).replace(/^0x/, "").toLowerCase())
      : [];
    const status =
      data.status === "confirmed" || data.status === "removed" ? data.status : "pending";
    const height = typeof data.height === "number" ? data.height : null;
    return { type: "transaction", ids, status, height };
  }
  if (message.type === "reorg") {
    const oldPeakHeight = Number(data.old_peak_height);
    const newPeakHeight = Number(data.new_peak_height);
    if (!Number.isFinite(oldPeakHeight) || !Number.isFinite(newPeakHeight)) return null;
    const depth = Number.isFinite(Number(data.reorg_depth))
      ? Number(data.reorg_depth)
      : Math.max(0, oldPeakHeight - newPeakHeight);
    return {
      type: "reorg",
      oldPeakHeight,
      newPeakHeight,
      depth,
      detectedAtMs: Number(data.detected_at_ms) || Date.now(),
    };
  }
  if (message.type === "vault") {
    const vaultId = String(data.vault_id ?? data.launcher_id ?? "")
      .replace(/^0x/, "")
      .toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(vaultId)) return null;
    const txId =
      typeof data.tx_id === "string" && data.tx_id
        ? data.tx_id.replace(/^0x/, "").toLowerCase()
        : null;
    return {
      type: "vault",
      vaultId,
      action: String(data.action ?? data.vault_action ?? "unknown"),
      status: String(data.status ?? data.tx_status ?? "pending"),
      txId,
      at: Date.now(),
    };
  }
  if (message.type === "dashboard" && data.kind === "live") {
    // Coinset has a "live" kind of its own with other fields: only nodexch's shape counts.
    if (typeof data.peak_height !== "number" || typeof data.mempool_size !== "number") return null;
    const fees =
      typeof data.mempool_fees === "string" || typeof data.mempool_fees === "number"
        ? String(data.mempool_fees)
        : "0";
    return {
      type: "state",
      peakHeight: data.peak_height,
      mempoolSize: data.mempool_size,
      mempoolCost: Number(data.mempool_cost) || 0,
      mempoolFees: /^\d+$/.test(fees) ? BigInt(fees) : 0n,
      synced: data.synced !== false,
    };
  }
  if (message.type === "dashboard" && data.kind === "mempool_delta") {
    return {
      type: "mempoolDelta",
      added: compactAllFromGateway(data.added),
      removed: (Array.isArray(data.removed) ? data.removed : []).map((id) =>
        String(id).replace(/^0x/, "").toLowerCase()
      ),
    };
  }
  if (message.type === "dashboard" && data.kind === "netspace") {
    // bytes arrives as a decimal string well beyond 2^53; keep it exact.
    const raw =
      typeof data.bytes === "string" || typeof data.bytes === "number" ? String(data.bytes) : "";
    if (!/^\d+$/.test(raw)) return null;
    return { type: "netspace", bytes: BigInt(raw), difficulty: Number(data.difficulty) || 0 };
  }
  return null;
}

/** WebSocket.OPEN; the constant is not on the interface when a custom impl is injected. */
const OPEN = 1;

export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

export function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1));
}

export function createLiveStream(options: LiveStreamOptions): LiveStream {
  const setT =
    options.setTimeoutImpl ?? ((fn: () => void, ms: number): TimerId => setTimeout(fn, ms));
  const clearT = options.clearTimeoutImpl ?? ((id: TimerId) => clearTimeout(id));
  const pollInterval = options.pollIntervalMs ?? 5_000;
  const quietPollInterval = options.quietPollIntervalMs ?? pollInterval;
  const maxWsFailures = options.maxWsFailures ?? 3;
  const WS = options.WebSocketImpl ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined);

  let status: LiveStatus = "offline";
  let transport: LiveTransport = "polling";
  let stopped = true;
  let socket: WebSocket | null = null;
  let wsFailures = 0;
  let reconnectTimer: TimerId | null = null;
  let pollTimer: TimerId | null = null;
  let lastSample: PollSample | null = null;
  let pollFailures = 0;
  let pollController: AbortController | null = null;
  /** The open socket has pushed a `state` event: it carries what the poll would ask for. */
  let socketPushesState = false;

  const setStatus = (next: LiveStatus) => {
    if (status === next) return;
    status = next;
    options.onEvent({ type: "status", status: next });
  };

  const clearTimers = () => {
    if (reconnectTimer !== null) clearT(reconnectTimer);
    if (pollTimer !== null) clearT(pollTimer);
    reconnectTimer = null;
    pollTimer = null;
  };

  const schedulePoll = (delay: number) => {
    if (stopped) return;
    if (pollTimer !== null) clearT(pollTimer);
    pollTimer = setT(() => void runPoll(), delay);
  };

  const runPoll = async () => {
    if (stopped) return;
    const controller = new AbortController();
    pollController = controller;
    try {
      const sample = await options.poll(controller.signal);
      if (controller.signal.aborted || stopped) return;
      pollFailures = 0;
      // The poll also reconciles the label against the socket itself, every interval. The
      // status is otherwise only moved by socket callbacks, and a callback that never arrives
      // (a close the browser swallows, a reconnect whose open fired while this tab was frozen)
      // would leave the pill contradicting a connection that is plainly there. Reading
      // readyState instead of trusting the last event seen means the two cannot drift.
      const open = socket !== null && socket.readyState === OPEN;
      if (open) setStatus("live");
      // With a socket still connecting, a poll that finishes later must not overwrite "live".
      else if (socket === null || socket.readyState > OPEN) setStatus("polling");
      if (lastSample === null || sample.peakHeight !== lastSample.peakHeight) {
        options.onEvent({ type: "peak", height: sample.peakHeight, tx: sample.peakIsTx });
      }
      // The first sample has nothing to compare with, and every reader has just asked.
      if (lastSample !== null && sample.mempoolSize !== lastSample.mempoolSize) {
        options.onEvent({ type: "mempool", size: sample.mempoolSize });
      }
      lastSample = sample;
    } catch {
      if (controller.signal.aborted || stopped) return;
      pollFailures += 1;
      if (pollFailures >= 2 && socket === null) setStatus("offline");
    }
    const quiet = socketPushesState && socket !== null && socket.readyState === OPEN;
    schedulePoll(quiet ? quietPollInterval : pollInterval);
  };

  const connect = () => {
    if (stopped || !options.wsUrl || !WS) return;
    transport = "websocket";
    setStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WS(streamUrl(options.wsUrl));
    } catch {
      onSocketFailure();
      return;
    }
    socket = ws;
    ws.onopen = () => {
      wsFailures = 0;
      setStatus("live");
    };
    ws.onmessage = (event) => {
      const parsed = parseCoinsetMessage(String(event.data));
      if (!parsed) return;
      if (parsed.type === "state") socketPushesState = true;
      options.onEvent(parsed);
    };
    ws.onerror = () => {
      // onclose follows; nothing to do here.
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      // Back to the short interval at once: the next poll may be minutes away.
      if (socketPushesState) schedulePoll(pollInterval);
      socketPushesState = false;
      onSocketFailure();
    };
  };

  const onSocketFailure = () => {
    if (stopped) return;
    wsFailures += 1;
    if (wsFailures >= maxWsFailures) {
      transport = "polling";
      setStatus("polling");
      // Keep trying to come back to the stream in the background at the max backoff.
      reconnectTimer = setT(connect, BACKOFF_MAX_MS);
      return;
    }
    setStatus("connecting");
    reconnectTimer = setT(connect, backoffDelay(wsFailures));
  };

  return {
    get status() {
      return status;
    },
    get transport() {
      return transport;
    },
    start() {
      if (!stopped) return;
      stopped = false;
      lastSample = null;
      wsFailures = 0;
      pollFailures = 0;
      socketPushesState = false;
      // Polling always runs: it is the fallback and it also feeds the peak/mempool sample
      // when the socket is silent. The socket, when available, adds immediate events.
      void runPoll();
      if (options.wsUrl && WS) connect();
      else {
        transport = "polling";
        setStatus("polling");
      }
    },
    stop() {
      stopped = true;
      pollController?.abort();
      pollController = null;
      clearTimers();
      const ws = socket;
      socket = null;
      if (ws) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onmessage = null;
        ws.onerror = null;
        // Closing a socket that is still in CONNECTING makes browsers log
        // "WebSocket is closed before the connection is established" (React dev mode mounts
        // twice, so this happened on every page). Let the handshake finish, then close.
        if (ws.readyState === 0) ws.onopen = () => ws.close();
        else ws.close();
      }
      setStatus("offline");
    },
  };
}
