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
  | { type: "mempool"; size: number };

export interface PollSample {
  peakHeight: number;
  peakIsTx: boolean;
  mempoolSize: number;
}

export interface LiveStreamOptions {
  /** Null → polling only. */
  wsUrl: string | null;
  poll: () => Promise<PollSample>;
  onEvent: (event: LiveEvent) => void;
  pollIntervalMs?: number;
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
}

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

  let status: LiveStatus = "offline";
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
    try {
      const sample = await options.poll();
      pollFailures = 0;
      if (socket === null) setStatus("polling");
      if (lastSample === null || sample.peakHeight !== lastSample.peakHeight) {
        options.onEvent({ type: "peak", height: sample.peakHeight, tx: sample.peakIsTx });
      }
      if (lastSample === null || sample.mempoolSize !== lastSample.mempoolSize) {
        options.onEvent({ type: "mempool", size: sample.mempoolSize });
      }
      lastSample = sample;
    } catch {
      pollFailures += 1;
      if (pollFailures >= 2 && socket === null) setStatus("offline");
    }
    schedulePoll(pollInterval);
  };

  const connect = () => {
    if (stopped || !options.wsUrl || !WS) return;
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
    start() {
      if (!stopped) return;
      stopped = false;
      lastSample = null;
      wsFailures = 0;
      pollFailures = 0;
      // Polling always runs: it is the fallback and it also feeds the peak/mempool sample
      // when the socket is silent. The socket, when available, adds immediate events.
      void runPoll();
      if (options.wsUrl && WS) connect();
      else setStatus("polling");
    },
    stop() {
      stopped = true;
      clearTimers();
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
