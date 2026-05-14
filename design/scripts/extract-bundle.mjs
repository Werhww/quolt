// Decode a Claude Design self-extracting bundle into an "_extracted/" folder
// alongside it: writes "template.html" and one file per manifest asset.
//
// Usage: node design/scripts/extract-bundle.mjs <bundle.html>

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { dirname, join, basename, extname } from 'node:path';

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('Usage: extract-bundle.mjs <bundle.html>');
  process.exit(1);
}

const html = await readFile(bundlePath, 'utf8');

function extractScript(type) {
  const re = new RegExp(
    `<script\\s+type="__bundler/${type}"[^>]*>([\\s\\S]*?)<\\/script>`,
    'i'
  );
  const m = html.match(re);
  if (!m) throw new Error(`Missing <script type="__bundler/${type}">`);
  return m[1];
}

const manifest = JSON.parse(extractScript('manifest'));
let template = JSON.parse(extractScript('template'));

const outDir = join(dirname(bundlePath), '_extracted');
await mkdir(outDir, { recursive: true });

const extMap = {
  'text/html': '.html',
  'text/css': '.css',
  'application/javascript': '.js',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
};

let i = 0;
const nameByUuid = {};
for (const [uuid, entry] of Object.entries(manifest)) {
  const raw = Buffer.from(entry.data, 'base64');
  const bytes = entry.compressed ? gunzipSync(raw) : raw;
  const ext = extMap[entry.mime] ?? '.bin';
  const name = `asset_${String(i).padStart(3, '0')}${ext}`;
  await writeFile(join(outDir, name), bytes);
  nameByUuid[uuid] = name;
  i += 1;
  console.log(`  ${name}  ${entry.mime}  ${bytes.length}B  (uuid ${uuid.slice(0, 8)}…)`);
}

for (const [uuid, name] of Object.entries(nameByUuid)) {
  template = template.split(uuid).join(name);
}
await writeFile(join(outDir, 'template.html'), template, 'utf8');
console.log(`\nExtracted ${i} assets + template.html to ${outDir}`);
