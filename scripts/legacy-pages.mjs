import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// The checked-out legacy revision is copied as bytes from Git, outside Jekyll.
const [repository, destination] = process.argv.slice(2);
const paths = [
  'index.html',
  'KiselevIvanAkulovich/index.html',
  'KiselevIvanAkulovich.jpg',
  'family_photo.jpg',
  'family_photo2.jpg',
  'Test/index.html',
];

if (process.platform !== 'win32') paths.push('Test/Index.html');

for (const path of paths) {
  const bytes = execFileSync('git', ['-C', repository, 'show', `HEAD:${path}`]);
  const target = join(destination, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: 'wx' });
}
