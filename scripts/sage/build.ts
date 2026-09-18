#!/usr/bin/env bun
/**
 * Build the Sage snapshot (`bun run build:sage`), following Pengui's pipeline:
 *   1. `next build` with SAGE_BUILD=1 → `output: "export"` into out/ (no route handlers,
 *      NEXT_PUBLIC_SAGE_BUILD=1 switches links to query-param detail routes);
 *   2. prune source maps and the web app manifest (manifest-src 'none');
 *   3. externalise every inline <script> (script-src 'self', no nonce);
 *   4. `sage-app finalize-manifest`;
 *   5. verify (scripts/sage/verify-snapshot.ts).
 *
 * The snapshot has no server of its own: every network call in the manifest
 * whitelist (Coinset, Dexie, MintGarden) is made straight from the browser.
 */
import { existsSync, readFileSync, readdirSync, rmSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");
const OUT_DIR = join(ROOT, "out");
const SOURCE_MANIFEST = join(ROOT, "sage-manifest.json");

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function run(cmd: string[], env: Record<string, string> = {}): Promise<void> {
  const proc = Bun.spawn(cmd, {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, ...env },
  });
  if ((await proc.exited) !== 0) fail(`${cmd.join(" ")} failed`);
}

function removeMatching(dir: string, matches: (path: string) => boolean): number {
  return readdirSync(dir, { withFileTypes: true }).reduce((removed, entry) => {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) return removed + removeMatching(abs, matches);
    if (entry.isFile() && matches(abs)) {
      unlinkSync(abs);
      return removed + 1;
    }
    return removed;
  }, 0);
}

const packageVersion = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
  .version as string;
const sourceManifest = JSON.parse(readFileSync(SOURCE_MANIFEST, "utf8"));
const manifestVersion = sourceManifest.version as string;
if (packageVersion !== manifestVersion) {
  console.warn(
    `⚠️  sage-manifest.json version ${manifestVersion} differs from package.json ${packageVersion}`
  );
}
const previousBuiltVersion = (() => {
  try {
    return JSON.parse(readFileSync(join(OUT_DIR, "sage-manifest.json"), "utf8")).version as string;
  } catch {
    return null;
  }
})();

// 1. Static export ------------------------------------------------------------------
rmSync(OUT_DIR, { recursive: true, force: true });
console.log("📦 next build (output: export)");
await run(["bun", "next", "build"], {
  SAGE_BUILD: "1",
  NEXT_PUBLIC_SAGE_BUILD: "1",
});
if (!existsSync(OUT_DIR)) fail("next build did not produce out/");

// 2. Prune --------------------------------------------------------------------------
const maps = removeMatching(
  OUT_DIR,
  (path) =>
    path.endsWith(".map") || path.endsWith("/manifest.json") || path.endsWith(".webmanifest")
);
console.log(`🧹 Pruned ${maps} source map / web manifest file(s)`);

// 3. Inline scripts -----------------------------------------------------------------
await run(["bun", "run", join("scripts", "sage", "externalize-inline-scripts.ts"), OUT_DIR]);

// 4. Finalise the manifest ----------------------------------------------------------
console.log("🔏 sage-app finalize-manifest");
await run([
  "bun",
  "x",
  "sage-app",
  "finalize-manifest",
  "--source",
  SOURCE_MANIFEST,
  "--dist",
  OUT_DIR,
]);

// 5. Verify -------------------------------------------------------------------------
await run(["bun", "run", join("scripts", "sage", "verify-snapshot.ts"), OUT_DIR]);

console.log(
  `\n✅ Sage snapshot ready in out/ (version ${manifestVersion}).\n` +
    `   Serve it:   bun run sage:serve\n` +
    `   Install it: Sage → Apps → Install from URL → http://localhost:4173`
);
if (previousBuiltVersion === manifestVersion) {
  console.warn(
    `\n⚠️  Version ${manifestVersion} is unchanged from the previous snapshot; Sage only updates an installed app when the manifest version changes.`
  );
}
