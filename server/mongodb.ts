import { MongoClient, GridFSBucket } from 'mongodb'
import type { Readable } from 'node:stream'
import type { Config } from './config'

const connections = new Map<string, Promise<MongoClient>>()

export function createPictureClient(uri: string) {
  return new MongoClient(uri, {
    maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 5_000, connectTimeoutMS: 5_000,
    socketTimeoutMS: 10_000, waitQueueTimeoutMS: 5_000,
  })
}

export async function pictureBucket(config: Config) {
  if (!config.mongoUri) throw new Error('Picture database is not configured')
  let connection = connections.get(config.mongoUri)
  if (!connection) {
    const client = createPictureClient(config.mongoUri)
    connection = client.connect().catch(async () => {
      connections.delete(config.mongoUri)
      await client.close().catch(() => {})
      throw new Error('Picture database is unavailable')
    })
    connections.set(config.mongoUri, connection)
  }
  return new GridFSBucket((await connection).db(config.mongoDatabase), { bucketName: config.mongoBucket })
}

export async function openPicture(config: Config, filename: string): Promise<Readable | null> {
  const bucket = await pictureBucket(config)
  const file = await bucket.find({ filename }).sort({ uploadDate: -1, _id: -1 }).limit(1).next()
  return file ? bucket.openDownloadStream(file._id) : null
}
