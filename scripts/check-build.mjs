import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const manifest = JSON.parse(await readFile('docs/source-manifest.json', 'utf8'))
const privateHashes = new Set(manifest.assets.map(asset => asset.sha256))
const files = []
async function walk(directory) {
  for (const name of await readdir(directory)) {
    const path = join(directory, name)
    const info = await stat(path)
    if (info.isDirectory()) await walk(path)
    else {
      const data = await readFile(path)
      if (privateHashes.has(createHash('sha256').update(data).digest('hex'))
        || /\.png$|\.env|private-assets|source-hotspots/.test(path)) throw new Error(`Private content in public build: ${path}`)
      files.push({ path: path.replaceAll('\\', '/'), bytes: info.size })
    }
  }
}
await walk('dist')
const output = { publicFiles: files, publicBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  privateDiagramCount: manifest.assets.length, privateDiagramBytes: manifest.privateAssetBytes }
await writeFile('docs/build-inventory.json', JSON.stringify(output, null, 2) + '\n')
console.log(`Public build: ${output.publicBytes.toLocaleString()} bytes. All ${manifest.assets.length} diagrams excluded.`)
