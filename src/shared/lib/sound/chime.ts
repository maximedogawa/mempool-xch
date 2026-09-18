/**
 * A short, soft coin chime played when one of the wallet's transactions lands in a block
 *. Synthesised with the Web Audio API so the snapshot ships no audio file. Browsers
 * only let audio start after a user gesture; when the context cannot be resumed the chime is
 * skipped silently rather than throwing.
 */
type Ctx = AudioContext;

let ctx: Ctx | null = null;
let lastPlayedAt = 0;
const MIN_GAP_MS = 400;

function context(): Ctx | null {
  if (typeof window === "undefined") return null;
  const Impl =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Impl) return null;
  if (!ctx) {
    try {
      ctx = new Impl();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(c: Ctx, at: number, freq: number, duration: number, peak: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, at);
  // Fast attack, exponential decay: reads as a small coin tapping glass, not a beep.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

/** Two rising notes (E6 → A6), about half a second, quiet. `volume` 0..1 scales the peak. */
export async function playCoinChime(volume = 0.5): Promise<boolean> {
  const c = context();
  if (!c) return false;
  const now = Date.now();
  if (now - lastPlayedAt < MIN_GAP_MS) return false;
  lastPlayedAt = now;
  try {
    if (c.state === "suspended") await c.resume();
    if (c.state !== "running") return false;
    const peak = Math.max(0.01, Math.min(1, volume)) * 0.16;
    const t = c.currentTime + 0.01;
    tone(c, t, 1318.5, 0.45, peak);
    tone(c, t + 0.09, 1760, 0.55, peak * 0.9);
    tone(c, t + 0.09, 3520, 0.25, peak * 0.15);
    return true;
  } catch {
    return false;
  }
}

/** Ask the browser for permission to play later, from inside a user gesture. */
export function primeAudio(): void {
  const c = context();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}
