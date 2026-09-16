/**
 * Live update stream (TASK-003): Coinset WebSocket (peak + transaction events) with automatic
 * reconnect and a polling fallback on get_blockchain_state for endpoints without a stream.
 * Emits one normalised event type so the UI does not care where updates come from.
 */
export type LiveStatus = "connecting" | "live" | "polling" | "offline";

export type LiveEvent =
  | { type: "peak"; height: number; tx: boolean }
  | { type: "transaction"; ids: string[]; status: "pending" | "confirmed" | "removed"; height: number | null }
  | { type: "status"; status: LiveStatus }
  | { type: "mempool"; size: number }
  /** Server hub: bundles entered / left the mempool (counts only). */
  | { type: "mempool_delta"; added: number; removed: number }
  /** Server hub: a block with statistics landed. */
  | { type: "block"; height: number; tx: boolean }
  /** Server hub could not replay what was missed: refetch everything. */
  | { type: "resync" }
  /** The hosted chain cache is ready for a new peak (records; later asset totals). */
  | { type: "chain"; height: number; assets: boolean };

/** Transport the stream ended up using. */
export type LiveTransport = "sse" | "websocket" | "polling";

export interface PollSample {
  peakHeight: number;
  peakIsTx: boolean;
  mempoolSize: number;
}

export interface LiveStreamOptions {
  /** Server-sent events endpoint of the hosted app; preferred over the direct WebSocket. */
  sseUrl?: string | null;
  /** Null → polling only. */
  wsUrl: string | null;
  poll: () => Promise<PollSample>;
  onEvent: (event: LiveEvent) => void;
  pollIntervalMs?: number;
  /** Fall back to polling after this many consecutive WebSocket failures. */
  maxWsFailures?: number;
  WebSocketImpl?: typeof WebSocket;
  EventSourceImpl?: typeof EventSource;
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

/** Map one server-sent event (name + JSON payload) to a live event, or null when irrelevant. */
export function parseServerEvent(name: string, raw: string): LiveEvent | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  switch (name) {
    case "peak": {
      const height = Number(data.height);
      return Number.isFinite(height) ? { type: "peak", height, tx: Boolean(data.tx) } : null;
    }
    case "transaction": {
      const ids = Array.isArray(data.ids) ? data.ids.map((id) => String(id)) : [];
      const status = data.status === "confirmed" || data.status === "removed" ? data.status : "pending";
      return { type: "transaction", ids, status, height: typeof data.height === "number" ? data.height : null };
    }
    case "live":
      return typeof data.txCount === "number" ? { type: "mempool", size: data.txCount } : null;
    case "mempool_delta":
      return { type: "mempool_delta", added: typeof data.added === "number" ? data.added : Array.isArray(data.added) ? data.added.length : 0, removed: typeof data.removed === "number" ? data.removed : Array.isArray(data.removed) ? data.removed.length : 0 };
    case "block": {
      const stats = (data.stats ?? {}) as Record<string, unknown>;
      const height = Number(stats.height);
      return Number.isFinite(height) ? { type: "block", height, tx: Boolean(stats.isTransactionBlock) } : null;
    }
    case "resync":
      return { type: "resync" };
    case "chain": {
      const height = Number(data.height);
      return Number.isFinite(height) ? { type: "chain", height, assets: Boolean(data.assets) } : null;
    }
    default:
      return null;
  }
}

const SERVER_EVENT_NAMES = ["peak", "transaction", "live", "mempool_delta", "block", "resync", "chain"] as const;
/** After an SSE drop the browser reconnects by itself; only show "connecting" if that takes long. */
const SSE_GRACE_MS = 10_000;

interface CoinsetEnvelope {
  message?: { type?: string; data?: Record<string, unknown> };
}

/** Parse one Coinset WebSocket frame into zero or one live events. */
export function parseCoinsetMessage(raw: string): LiveEvent | null {
  let envelope: CoinsetEnvelope;
  try {
    envelope = JSON.parse(raw) as CoinsetEnvelope;
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
    const ids = Array.isArray(data.ids) ? data.ids.map((id) => String(id).replace(/^0x/, "").toLowerCase()) : [];
    const status = data.status === "confirmed" || data.status === "removed" ? data.status : "pending";
    const height = typeof data.height === "number" ? data.height : null;
    return { type: "transaction", ids, status, height };
  }
  return null;
}

export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 30_000;

export function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempt - 1));
}

export function createLiveStream(options: LiveStreamOptions): LiveStream {
  const setT = options.setTimeoutImpl ?? ((fn: () => void, ms: number): TimerId => setTimeout(fn, ms));
  const clearT = options.clearTimeoutImpl ?? ((id: TimerId) => clearTimeout(id));
  const pollInterval = options.pollIntervalMs ?? 5_000;
  const maxWsFailures = options.maxWsFailures ?? 3;
  const WS = options.WebSocketImpl ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined);
  const ES = options.EventSourceImpl ?? (typeof EventSource !== "undefined" ? EventSource : undefined);

  let status: LiveStatus = "offline";
  let transport: LiveTransport = "polling";
  let source: EventSource | null = null;
  let sseFailures = 0;
  let sseGraceTimer: TimerId | null = null;
  let stopped = true;
  let socket: WebSocket | null = null;
  let wsFailures = 0;
  let reconnectTimer: TimerId | null = null;
  let pollTimer: TimerId | null = null;
  let lastSample: PollSample | null = null;
  let pollFailures = 0;

  const setStatus = (next: LiveStatus) => {
    if (status === next) return;
    status = next;
    options.onEvent({ type: "status", status: next });
  };

  const clearTimers = () => {
    if (reconnectTimer !== null) clearT(reconnectTimer);
    if (pollTimer !== null) clearT(pollTimer);
    if (sseGraceTimer !== null) clearT(sseGraceTimer);
    reconnectTimer = null;
    pollTimer = null;
    sseGraceTimer = null;
  };

  const closeSource = () => {
    const es = source;
    source = null;
    if (es) {
      es.onopen = null;
      es.onerror = null;
      es.close();
    }
  };

  /** Server-sent events from the hosted app: the browser reconnects by itself with Last-Event-ID. */
  const connectSse = () => {
    if (stopped || !options.sseUrl || !ES) return;
    transport = "sse";
    setStatus("connecting");
    let es: EventSource;
    try {
      es = new ES(options.sseUrl);
    } catch {
      onSseFailure();
      return;
    }
    source = es;
    es.onopen = () => {
      sseFailures = 0;
      if (sseGraceTimer !== null) clearT(sseGraceTimer);
      sseGraceTimer = null;
      setStatus("live");
    };
    es.onerror = () => {
      if (source !== es) return;
      if (es.readyState === 2) {
        // CLOSED: the browser gave up (fatal response); fall back to the direct channels.
        source = null;
        onSseFailure();
        return;
      }
      // CONNECTING: automatic reconnect in progress; show it only if it drags on.
      if (sseGraceTimer === null) {
        sseGraceTimer = setT(() => {
          sseGraceTimer = null;
          if (source === es && status === "live") setStatus("connecting");
        }, SSE_GRACE_MS);
      }
    };
    SERVER_EVENT_NAMES.forEach((name) => {
      es.addEventListener(name, (event) => {
        const parsed = parseServerEvent(name, String((event as MessageEvent).data));
        if (parsed) options.onEvent(parsed);
      });
    });
  };

  const onSseFailure = () => {
    if (stopped) return;
    sseFailures += 1;
    closeSource();
    if (sseFailures >= maxWsFailures) {
      // The hosted stream is gone for good this session: use the direct WebSocket or polling.
      if (options.wsUrl && WS) connect();
      else {
        transport = "polling";
        setStatus("polling");
      }
      return;
    }
    setStatus("connecting");
    reconnectTimer = setT(connectSse, backoffDelay(sseFailures));
  };

  const schedulePoll = (delay: number) => {
    if (stopped) return;
    if (pollTimer !== null) clearT(pollTimer);
    pollTimer = setT(() => void runPoll(), delay);
  };

  const runPoll = async () => {
    if (stopped) return;
    try {
      const sample = await options.poll();
      pollFailures = 0;
      // Only the fallback poll owns the status; with a stream (socket or SSE) open or opening,
      // a poll that finishes later must not overwrite "live" with "polling".
      if (socket === null && source === null) setStatus("polling");
      if (lastSample === null || sample.peakHeight !== lastSample.peakHeight) {
        options.onEvent({ type: "peak", height: sample.peakHeight, tx: sample.peakIsTx });
      }
      if (lastSample === null || sample.mempoolSize !== lastSample.mempoolSize) {
        options.onEvent({ type: "mempool", size: sample.mempoolSize });
      }
      lastSample = sample;
    } catch {
      pollFailures += 1;
      if (pollFailures >= 2 && socket === null && source === null) setStatus("offline");
    }
    schedulePoll(pollInterval);
  };

  const connect = () => {
    if (stopped || !options.wsUrl || !WS) return;
    transport = "websocket";
    setStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WS(`${options.wsUrl}?events=peak,transaction`);
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
      if (parsed) options.onEvent(parsed);
    };
    ws.onerror = () => {
      // onclose follows; nothing to do here.
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
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
      sseFailures = 0;
      pollFailures = 0;
      // Polling always runs: it is the fallback and it also feeds the peak/mempool sample
      // when the stream is silent. The stream, when available, adds immediate events.
      void runPoll();
      if (options.sseUrl && ES) connectSse();
      else if (options.wsUrl && WS) connect();
      else {
        transport = "polling";
        setStatus("polling");
      }
    },
    stop() {
      stopped = true;
      clearTimers();
      closeSource();
      const ws = socket;
      socket = null;
      if (ws) {
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
