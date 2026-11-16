import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const [directory, base = '/'] = process.argv.slice(2);
const root = resolve(directory);
const origin = 'https://familia-online.site';
const documents = new Map();
const compatibility = new Set(['Test/index.html', 'Test/Index.html']);

async function collect(folder, prefix = '') {
  for (const file of await readdir(folder, { withFileTypes: true })) {
    const relative = prefix + file.name;
    if (file.isDirectory()) await collect(join(folder, file.name), relative + '/');
    if (file.isFile() && relative.endsWith('.html') && !compatibility.has(relative)) {
      documents.set(relative, await readFile(join(folder, file.name), 'utf8'));
    }
  }
}

await collect(root);
assert(documents.has('index.html'), 'Missing homepage');
assert(documents.has('KiselevIvanAkulovich/index.html'), 'Missing biography at its legacy URL');
assert(!documents.get('KiselevIvanAkulovich/index.html').includes('<iframe'), 'Biography contains a remote embed');
assert((documents.get('KiselevIvanAkulovich/index.html').match(/<img\b/g) ?? []).length >= 5, 'Biography lost illustrations');

if (base === '/') {
  assert((await stat(join(root, 'Test/index.html'))).size > 600_000, 'Historical Test page has been replaced');
  assert((await stat(join(root, 'KiselevIvanAkulovich.jpg'))).isFile(), 'Historical portrait URL is missing');
}

for (const [relative, html] of documents) {
  const route = base + relative.replace(/index\.html$/, '');
  assert.equal(/<meta name="robots" content="noindex, nofollow"/.test(html), base !== '/', `Indexing at ${route}`);
  const refs = html.matchAll(/<(?:a|img|script|link)\b[^>]*?\s(?:href|src)="([^"]+)"/g);

  for (const [, ref] of refs) {
    const url = new URL(ref, origin + route);
    if (url.origin !== origin) continue;
    assert(url.pathname.startsWith(base), `${route} leaves its build: ${ref}`);
    const target = decodeURIComponent(url.pathname.slice(base.length));
    const file = target.endsWith('/') || !target ? target + 'index.html' : target;
    assert((await stat(join(root, file))).isFile(), `${route} references missing ${ref}`);

    if (url.hash && documents.has(file)) {
      const id = decodeURIComponent(url.hash.slice(1));
      assert(documents.get(file).includes(`id="${id}"`), `${route} has a broken fragment: ${ref}`);
    }
  }
}

console.log(`Verified ${documents.size} archive pages under ${base}`);
