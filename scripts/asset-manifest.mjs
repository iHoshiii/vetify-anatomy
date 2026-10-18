import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const manifest = JSON.parse(await readFile('docs/source-manifest.json', 'utf8'))
for (const asset of manifest.assets) {
  const data = await readFile(asset.destination)
  if (createHash('sha256').update(data).digest('hex') !== asset.sha256) throw new Error(`Changed diagram: ${asset.destination}`)
}
console.log(`${manifest.assets.length} source-matching private diagrams, ${manifest.privateAssetBytes.toLocaleString()} bytes`)
