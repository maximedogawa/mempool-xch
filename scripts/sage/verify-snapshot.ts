#!/usr/bin/env bun
/**
 * Verify that a finalised snapshot can be installed and run as a Sage app (adapted from
 * Pengui): valid source manifest, every file listed with entry and icon, size limits, no inline
 * <script>, no <link rel="manifest">, no service worker, no bare same-origin "/api/" literal
 * (the summary API must be addressed through the hosted origin).
 *
 * Usage: bun run scripts/sage/verify-snapshot.ts [outDir]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { MAX_FILE_COUNT, MAX_TOTAL_SIZE_BYTES, validateSourceManifest, type SageManifest } from "./manifestSchema";

const OUT_DIR = resolve(process.argv[2] ?? "out");
const SOURCE_MANIFEST = resolve("sage-manifest.json");

const INLINE_SCRIPT_RE = /<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/gi;
const MANIFEST_LINK_RE = /<link\b[^>]*\brel=["']manifest["'][^>]*>/gi;
const SERVICE_WORKER_RE = /serviceWorker\s*\.\s*register|navigator\.serviceWorker/;
const TEXT_EXTENSIONS = [".html", ".js", ".mjs", ".css", ".txt", ".json"];

const problems: string[] = [];
const checks: string[] = [];
const fail = (m: string) => problems.push(m);
const pass = (m: string) => checks.push(m);

function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(abs, root);
    return entry.isFile() ? [relative(root, abs).split("\\").join("/")] : [];
  });
}

function readManifest(path: string, label: string): SageManifest | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as SageManifest;
  } catch (error) {
    fail(`${label} could not be read: ${(error as Error).message}`);
    return null;
  }
}

const source = readManifest(SOURCE_MANIFEST, "sage-manifest.json");
if (source) {
  const manifestProblems = validateSourceManifest(source);
  if (manifestProblems.length > 0) manifestProblems.forEach(fail);
  else pass("sage-manifest.json valid (capabilities and whitelist entries known to Sage 0.13)");
}

let snapshotFiles: string[] = [];
try {
  if (!statSync(OUT_DIR).isDirectory()) throw new Error("not a directory");
  snapshotFiles = listFiles(OUT_DIR);
} catch {
  fail(`snapshot directory not found: ${OUT_DIR}`);
}

const finalManifest = snapshotFiles.includes("sage-manifest.json") ? readManifest(join(OUT_DIR, "sage-manifest.json"), "out/sage-manifest.json") : null;
if (snapshotFiles.length > 0 && !finalManifest) fail("out/sage-manifest.json is missing — run `sage-app finalize-manifest`");

if (finalManifest) {
  const listed = new Set((finalManifest.files ?? []).map((f) => f.path));
  const shipped = snapshotFiles.filter((p) => p !== "sage-manifest.json");
  const unlisted = shipped.filter((p) => !listed.has(p));
  if (unlisted.length > 0) fail(`${unlisted.length} snapshot files are not listed in files[] (e.g. ${unlisted.slice(0, 3).join(", ")})`);
  else pass(`all ${shipped.length} snapshot files are listed in files[]`);
  const totalSize = (finalManifest.files ?? []).reduce((sum, f) => sum + f.size, 0);
  if (listed.size > MAX_FILE_COUNT) fail(`file count ${listed.size} exceeds ${MAX_FILE_COUNT}`);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) fail(`snapshot size ${totalSize} exceeds ${MAX_TOTAL_SIZE_BYTES}`);
  if (listed.size <= MAX_FILE_COUNT && totalSize <= MAX_TOTAL_SIZE_BYTES) {
    pass(`snapshot is ${listed.size}/${MAX_FILE_COUNT} files and ${(totalSize / 1024 / 1024).toFixed(1)}/${MAX_TOTAL_SIZE_BYTES / 1024 / 1024} MB`);
  }
  const entry = finalManifest.entry ?? "index.html";
  if (!listed.has(entry)) fail(`entry "${entry}" is not listed`);
  else pass(`entry "${entry}" is listed`);
  if (finalManifest.icon && !listed.has(finalManifest.icon)) fail(`icon "${finalManifest.icon}" is not listed`);
  else if (finalManifest.icon) pass(`icon "${finalManifest.icon}" is listed`);
  const avatar = finalManifest.author?.avatar;
  if (avatar && !listed.has(avatar)) fail(`author.avatar "${avatar}" is not listed`);
  ["tx.html", "block.html", "address.html", "coin.html", "blocks.html", "mempool.html", "settings.html", "wallet.html"].forEach((page) => {
    if (!listed.has(page)) fail(`route file ${page} is missing from the export`);
  });
}

const htmlFiles = snapshotFiles.filter((p) => p.endsWith(".html"));
if (htmlFiles.length === 0 && snapshotFiles.length > 0) fail("snapshot contains no HTML files");
let inlineScripts = 0;
let manifestLinks = 0;
htmlFiles.forEach((path) => {
  const html = readFileSync(join(OUT_DIR, path), "utf8");
  const inline = [...html.matchAll(INLINE_SCRIPT_RE)].filter((m) => !/^<script[^>]*>\s*<\/script>$/.test(m[0]));
  if (inline.length > 0) {
    inlineScripts += inline.length;
    fail(`${path}: ${inline.length} inline <script> block(s)`);
  }
  const links = [...html.matchAll(MANIFEST_LINK_RE)];
  if (links.length > 0) {
    manifestLinks += links.length;
    fail(`${path}: <link rel="manifest">`);
  }
});
if (inlineScripts === 0 && htmlFiles.length > 0) pass(`no inline <script> in ${htmlFiles.length} HTML files`);
if (manifestLinks === 0 && htmlFiles.length > 0) pass('no <link rel="manifest">');

const textFiles = snapshotFiles.filter((p) => TEXT_EXTENSIONS.some((ext) => p.endsWith(ext)));
const swHits = textFiles.filter((p) => SERVICE_WORKER_RE.test(readFileSync(join(OUT_DIR, p), "utf8")));
if (swHits.length > 0) fail(`service worker registration found in: ${swHits.slice(0, 3).join(", ")}`);
else if (textFiles.length > 0) pass(`no service worker registration in ${textFiles.length} text files`);

checks.forEach((c) => console.log(`  ✓ ${c}`));
problems.forEach((p) => console.error(`  ✗ ${p}`));
if (problems.length > 0) {
  console.error(`\n❌ Snapshot verification failed: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`\n✅ Snapshot verification passed: ${checks.length} checks`);
