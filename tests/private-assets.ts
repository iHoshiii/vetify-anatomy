import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll } from 'vitest'
import manifest from '../docs/source-manifest.json'

export const testAssetDir = mkdtempSync(join(tmpdir(), 'vetify-anatomy-test-'))
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=', 'base64')

for (const asset of manifest.assets) {
  const path = join(testAssetDir, asset.route.slice('/anatomy/'.length))
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, Buffer.concat([png, Buffer.from(asset.route)]))
}

afterAll(() => rmSync(testAssetDir, { recursive: true, force: true }))
