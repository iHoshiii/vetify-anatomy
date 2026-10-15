import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = resolve(process.argv[2] || '../Vetify')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const files = [
  'src/client/pages/anatomy/anatomy-page.tsx',
  ...['view', 'sidebar', 'header'].map(name => `src/client/pages/anatomy/_components/${name}.tsx`),
  ...['dog', 'cat', 'bird', 'image-config'].map(name => `src/client/pages/anatomy/data/${name}.ts`),
  'src/client/types/anatomy.ts', 'docs/main-deployment/shared-auth.md',
]
const sources = []
for (const path of files) {
  const bytes = await readFile(join(source, path))
  sources.push({ path, bytes: bytes.length, sha256: hash(bytes) })
}
const hotspots = {}
const assets = []
for (const animal of ['dog', 'cat', 'bird']) {
  const contents = await readFile(join(source, `src/client/pages/anatomy/data/${animal}.ts`), 'utf8')
  const exports = {}
  const compiled = ts.transpileModule(contents, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  runInNewContext(compiled, { exports }, { timeout: 1000 })
  hotspots[animal] = exports.default
  for (const system of ['skeleton', 'muscles', 'digestive', 'cardiovascular', 'nervous']) {
    const path = `anatomy/${animal}/${animal}-${system}.png`
    const bytes = await readFile(join(source, 'public', path))
    const destination = await readFile(join('private-assets', path))
    if (hash(destination) !== hash(bytes)) throw new Error(`Asset differs from source: ${path}`)
    assets.push({ source: `public/${path}`, destination: `private-assets/${path}`, route: `/${path}`,
      bytes: bytes.length, sha256: hash(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
      attribution: 'Not provided by source', license: 'Not provided by source' })
  }
}
const logo = await readFile(join(source, 'public/vetify_logo.jpg'))
if (hash(logo) !== hash(await readFile('public/vetify_logo.jpg'))) throw new Error('Logo differs from source')
await mkdir('tests/fixtures', { recursive: true })
await writeFile('tests/fixtures/source-hotspots.json', JSON.stringify(hotspots, null, 2) + '\n')
await writeFile('docs/source-manifest.json', JSON.stringify({ captured: '2026-10-14', sources, assets,
  logo: { source: 'public/vetify_logo.jpg', destination: 'public/vetify_logo.jpg', bytes: logo.length, sha256: hash(logo) },
  privateAssetBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
  adaptations: ['Standalone header with shared logo and configured main links', 'Responsive 800x500 coordinate frame',
    'Protected image fetch and object URL lifecycle', 'Loading, error, retry and accessible tooltips',
    'Typed hotspot data reformatted without content changes', 'Shared sign-in adapter, not available in current main'],
}, null, 2) + '\n')
console.log(`Captured ${assets.length} unchanged diagrams and ${Object.keys(hotspots).length} species`)
