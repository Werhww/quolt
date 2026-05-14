import { mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const srcDir = new URL('./src/', import.meta.url);
const distDir = new URL('./dist/', import.meta.url);

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const name of await readdir(srcDir)) {
  if (!name.endsWith('.css')) continue;
  await copyFile(new URL(name, srcDir), new URL(name, distDir));
  console.log(`  ${name}`);
}
