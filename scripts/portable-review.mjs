import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix, resolve } from 'node:path';

const source = resolve('dist');
const destination = resolve(process.argv[2] ?? 'dist-review');
await mkdir(destination);
await cp(source, destination, { recursive: true });

function fileLink(reference, document) {
  const [, path, suffix] = reference.match(/^\/([^#?]*)(.*)$/);
  const target = !path || path.endsWith('/') ? path + 'index.html' : path;
  return posix.relative(posix.dirname(document), target) + suffix;
}

async function makePortable(directory = '') {
  for (const entry of await readdir(join(destination, directory), { withFileTypes: true })) {
    const name = posix.join(directory, entry.name);
    const path = join(destination, name);
    if (entry.isDirectory() && name !== 'Test') await makePortable(name);
    if (!entry.isFile()) continue;

    if (name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      const relativeLinks = html.replace(
        /\b(href|src)="(\/(?!\/)[^"]*)"/g,
        (_, attribute, reference) => `${attribute}="${fileLink(reference, name)}"`,
      ).replace(/\bsrcset="(\/(?!\/)[^"]*)"/g, (_, sources) => {
        const localSources = sources.replace(/\/(?!\/)[^,\s]+/g, reference => fileLink(reference, name));
        return `srcset="${localSources}"`;
      });
      await writeFile(path, relativeLinks);
    }

    if (name.endsWith('.css')) {
      const css = await readFile(path, 'utf8');
      await writeFile(path, css.replace(
        /url\((["']?)(\/(?!\/)[^"')]+)\1\)/g,
        (_, quote, reference) => `url(${quote}${fileLink(reference, name)}${quote})`,
      ));
    }
  }
}

await makePortable();
console.log(join(destination, 'index.html'));
