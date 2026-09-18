/**
 * Capability manager for the Sage bridge. Sage shows a permission dialog every time
 * an app requests a capability, so the app must ask at most once, remember refusals, never call
 * a bridge method whose capability is not granted, and follow grant changes from the host.
 * Transport-free: the client is injected, so the logic is unit-testable.
 */
export interface CapabilityClient {
  app: {
    getCapabilities(): Promise<unknown>;
    requestCapabilityGrant(input: { capability: never }): Promise<unknown>;
    onGrantedCapabilitiesChange?(handler: (event: { full?: string[] }) => void): () => void;
  };
}

export const REFUSED_KEY = "mempool-xch:sage-refused:v1";

type Listener = () => void;

function extractGranted(raw: unknown): string[] {
  const r =
    raw && typeof raw === "object"
      ? (raw as { granted?: unknown; capabilities?: unknown; full?: unknown })
      : {};
  const list = r.granted ?? r.capabilities ?? r.full;
  return Array.isArray(list) ? list.map(String) : [];
}

export class CapabilityManager {
  private granted = new Set<string>();
  private refused = new Set<string>();
  private inflight = new Map<string, Promise<boolean>>();
  private loaded: Promise<void> | null = null;
  private listeners = new Set<Listener>();
  private unlisten: (() => void) | null = null;

  constructor(
    private readonly getClient: () => Promise<CapabilityClient | null>,
    private readonly storage: Pick<Storage, "getItem" | "setItem"> | null = null
  ) {
    try {
      const raw = storage?.getItem(REFUSED_KEY);
      if (raw) JSON.parse(raw).forEach((c: string) => this.refused.add(c));
    } catch {
      // Storage unavailable or corrupt: start with no remembered refusals.
    }
  }

  /** Read the granted set once and follow host changes. */
  load(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const client = await this.getClient();
        if (!client) return;
        try {
          extractGranted(await client.app.getCapabilities()).forEach((c) => this.granted.add(c));
          // A refusal remembered earlier is void once Sage grants the capability (for example
          // after it moved to the manifest's required list).
          this.granted.forEach((c) => this.refused.delete(c));
          this.persist();
        } catch {
          // Not granted app.get_capabilities: assume nothing.
        }
        try {
          this.unlisten =
            client.app.onGrantedCapabilitiesChange?.((event) => {
              const full = event.full;
              if (Array.isArray(full)) {
                this.granted = new Set(full.map(String));
                full.forEach((c) => this.refused.delete(String(c)));
                this.persist();
                this.emit();
              }
            }) ?? null;
        } catch {
          // Hosts without change events: the set read above stays as it is.
        }
        this.emit();
      })();
    }
    return this.loaded;
  }

  has(capability: string): boolean {
    return this.granted.has(capability);
  }

  isRefused(capability: string): boolean {
    return this.refused.has(capability);
  }

  snapshot(): { granted: string[]; refused: string[] } {
    return { granted: [...this.granted], refused: [...this.refused] };
  }

  /**
   * Make sure a capability is granted: no dialog when already granted or already refused this
   * session; one request otherwise. `force` re-asks a refused capability (an Enable button).
   */
  async ensure(capability: string, force = false): Promise<boolean> {
    await this.load();
    if (this.granted.has(capability)) return true;
    if (this.refused.has(capability) && !force) return false;
    const pending = this.inflight.get(capability);
    if (pending) return pending;
    const request = (async () => {
      const client = await this.getClient();
      if (!client) return false;
      try {
        const result = await client.app.requestCapabilityGrant({ capability: capability as never });
        const ok = Boolean(
          (result as { granted?: boolean }).granted ?? (result as { ok?: boolean }).ok
        );
        if (ok) {
          this.granted.add(capability);
          this.refused.delete(capability);
        } else this.refused.add(capability);
        this.persist();
        this.emit();
        return ok;
      } catch {
        this.refused.add(capability);
        this.persist();
        this.emit();
        return false;
      } finally {
        this.inflight.delete(capability);
      }
    })();
    this.inflight.set(capability, request);
    return request;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.unlisten?.();
    this.unlisten = null;
  }

  private persist(): void {
    try {
      this.storage?.setItem(REFUSED_KEY, JSON.stringify([...this.refused]));
    } catch {
      // Storage unavailable: refusals are remembered for this session only.
    }
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}
