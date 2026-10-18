import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { GridFSBucket } from 'mongodb'
import { readConfig } from '../server/config'
import { createPictureClient } from '../server/mongodb'
import manifest from '../docs/source-manifest.json' with { type: 'json' }

const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex')

async function main() {
  if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Unknown upload argument')
  const pictures = await Promise.all(manifest.assets.map(async asset => {
    const data = await readFile(asset.destination)
    if (hash(data) !== asset.sha256) throw new Error('Source diagram hash mismatch')
    return { asset, data, filename: asset.route.slice('/anatomy/'.length) }
  }))
  if (process.argv.includes('--check')) {
    console.log(`${pictures.length} original diagrams verified. No database connection or upload performed.`)
    return
  }
  const config = readConfig()
  if (!config.mongoUri) throw new Error('MongoDB configuration is missing')
  const client = createPictureClient(config.mongoUri)
  try {
    await client.connect()
    const bucket = new GridFSBucket(client.db(config.mongoDatabase), { bucketName: config.mongoBucket })
    for (const { asset, data, filename } of pictures) {
      const existing = await bucket.find({ filename }).sort({ uploadDate: -1, _id: -1 }).limit(1).next()
      let fileId = existing?._id
      if (!existing || existing.metadata?.sha256 !== asset.sha256) {
        const upload = bucket.openUploadStream(filename, { metadata: { sha256: asset.sha256, contentType: 'image/png' } })
        try { await pipeline(Readable.from([data]), upload) }
        catch (error) { await upload.abort().catch(() => {}); throw error }
        fileId = upload.id
      }
      const stored = createHash('sha256')
      for await (const chunk of bucket.openDownloadStream(fileId!)) stored.update(chunk)
      if (stored.digest('hex') !== asset.sha256) throw new Error('Stored diagram hash mismatch')
      console.log(`Verified ${filename}`)
    }
    console.log(`${pictures.length} diagrams ready in MongoDB GridFS.`)
  } finally { await client.close() }
}

main().catch(() => {
  console.error('Diagram upload failed. Check original files, MongoDB configuration and database access.')
  process.exitCode = 1
})
