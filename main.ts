// Token Radar's entrypoint: read the sealed snapshot, score every pre-token protocol, write the board,
// the dashboard's data and the dossier. Node 22, standard library only, no network, deterministic.
//
// The harness runs this file. It reads /input/snapshot.json (or --input <file|dir>), writes
// /output/board.json and /output/data.js, copies dashboard/ and screenshots/ into /output, and writes
// /output/dossier.json last with the vendored makefun-board library. Outside the grader, point
// MAKEFUN_OUTPUT_DIR at a local directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

/** The entry's own directory, so dashboard/ and screenshots/ are read from the repository. */
const REPO_DIR = fileURLToPath(new URL('.', import.meta.url));

/** The scorer's caps, quoted from its gate: the text cap shapes the dossier, the rest refuse. */
const DOSSIER_TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_LIMITS = { max: 4, max_bytes: 524_288 };
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

/** Read `--name <value>` (or `--name=<value>`) out of the arguments, else the fallback. */
function flagValue(name: string, fallback: string): string {
  const args = process.argv;
  const at = args.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < args.length) return args[at + 1]!;
  const inline = args.find((a) => a.startsWith(`--${name}=`));
  return inline === undefined ? fallback : inline.slice(name.length + 3);
}

/** Stop with one line the operator can act on. */
function fail(message: string): never {
  process.stderr.write(`token radar: ${message}\n`);
  process.exit(1);
}

const inputArg = flagValue('input', '/input');
const snapshotPath = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
if (!existsSync(snapshotPath)) {
  process.stderr.write(
    `token radar: no snapshot at ${snapshotPath}: pass --input <snapshot.json|directory> or mount the sealed /input\n`,
  );
  process.exit(2);
}
const outputDir = flagValue('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const snapshot = parseSnapshot(readFileSync(snapshotPath, 'utf8'));
const { board, radar } = buildRadar(snapshot);

const refused = boardIssue(board, snapshot);
if (refused !== null) fail(`the model wrote a board the gate refuses: ${refused}`);

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(outputDir, 'data.js'), dataScript(radar));

/** Copy one directory's regular files into `to`, skipping dot names, and return what was copied. */
function copyDirectory(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const full = join(from, name);
    if (!statSync(full).isFile()) continue;
    copyFileSync(full, join(to, name));
    copied.push(name);
  }
  return copied;
}

copyDirectory(join(REPO_DIR, 'dashboard'), join(outputDir, 'dashboard'));

const shots = copyDirectory(join(REPO_DIR, 'screenshots'), join(outputDir, 'screenshots'));
if (shots.length < 3) {
  fail(`screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: hand in 3, the board, a detail view and a filtered view`);
}
for (const name of shots) {
  if (!IMAGE_NAME.test(name)) fail(`screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`);
}

// The dossier goes last: the scorer rebuilds it from this /output and compares the bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
  screenshots: SCREENSHOT_LIMITS,
  dashboard: { max_files: 400, max_bytes: 4_194_304 },
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols, ${snapshot.watchlist.length} on the watchlist, ` +
    `${board.length} rows scored (${radar.early_size} early, ${radar.live_size} live set aside)\n` +
    `token radar: wrote board.json, data.js, dashboard/ (3 files), screenshots/ (${shots.length} images) and dossier.json into ${outputDir}\n`,
);