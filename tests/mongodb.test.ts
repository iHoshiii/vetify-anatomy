import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Readable } from 'node:stream'
import { readConfig } from '../server/config'

const state = vi.hoisted(() => ({
  construct: vi.fn(), connect: vi.fn(), close: vi.fn(), db: vi.fn(),
  bucket: vi.fn(), find: vi.fn(), sort: vi.fn(), limit: vi.fn(), next: vi.fn(), download: vi.fn(),
}))
vi.mock('mongodb', () => ({
  MongoClient: class {
    constructor(uri: string, options: unknown) { state.construct(uri, options) }
    connect = state.connect
    close = state.close
    db = state.db
  },
  GridFSBucket: class {
    constructor(db: unknown, options: unknown) { state.bucket(db, options) }
    find = state.find
    openDownloadStream = state.download
  },
}))

beforeEach(() => {
  vi.resetModules()
  Object.values(state).forEach(mock => mock.mockReset())
  state.connect.mockImplementation(async function (this: unknown) { return this })
  state.close.mockResolvedValue(undefined)
  state.db.mockReturnValue('dedicated-anatomy-database')
  state.find.mockReturnValue({ sort: state.sort })
  state.sort.mockReturnValue({ limit: state.limit })
  state.limit.mockReturnValue({ next: state.next })
  state.next.mockResolvedValue({ _id: 'diagram-object-id' })
})

describe('MongoDB GridFS adapter', () => {
  const config = () => readConfig({ MONGODB_URI: 'mongodb://test.invalid', MONGODB_DATABASE: 'vetify_anatomy' })
  it('reuses the connection pool and streams the latest exact filename from its dedicated bucket', async () => {
    const { openPicture } = await import('../server/mongodb')
    const stream = Readable.from(['image-bytes'])
    state.download.mockReturnValue(stream)
    const results = await Promise.all([openPicture(config(), 'dog/dog-skeleton.png'), openPicture(config(), 'cat/cat-skeleton.png')])
    expect(results).toEqual([stream, stream])
    expect(state.construct).toHaveBeenCalledTimes(1)
    expect(state.connect).toHaveBeenCalledTimes(1)
    expect(state.db).toHaveBeenCalledWith('vetify_anatomy')
    expect(state.bucket).toHaveBeenCalledWith('dedicated-anatomy-database', { bucketName: 'anatomy' })
    expect(state.find).toHaveBeenCalledWith({ filename: 'dog/dog-skeleton.png' })
    expect(state.find).toHaveBeenCalledWith({ filename: 'cat/cat-skeleton.png' })
    expect(state.sort).toHaveBeenCalledWith({ uploadDate: -1, _id: -1 })
    expect(state.download).toHaveBeenCalledWith('diagram-object-id')
  })
  it('returns null for absent files without opening a download stream', async () => {
    const { openPicture } = await import('../server/mongodb')
    state.next.mockResolvedValue(null)
    expect(await openPicture(config(), 'bird/missing.png')).toBeNull()
    expect(state.download).not.toHaveBeenCalled()
  })
  it('retries failed connections and closes the failed client', async () => {
    const { pictureBucket } = await import('../server/mongodb')
    state.connect.mockRejectedValueOnce(new Error('private connection details'))
    await expect(pictureBucket(config())).rejects.toThrow('Picture database is unavailable')
    expect(state.close).toHaveBeenCalledOnce()
    await expect(pictureBucket(config())).resolves.toBeDefined()
    expect(state.construct).toHaveBeenCalledTimes(2)
  })
  it('does not create a client without a URI', async () => {
    const { pictureBucket } = await import('../server/mongodb')
    await expect(pictureBucket(readConfig({}))).rejects.toThrow('Picture database is not configured')
    expect(state.construct).not.toHaveBeenCalled()
  })
  it('requires database storage in production and rejects invalid settings', () => {
    expect(readConfig({ NODE_ENV: 'production' }).mongoStorage).toBe(true)
    expect(readConfig({}).mongoStorage).toBe(false)
    for (const env of [{ MONGODB_URI: 'https://db.invalid' }, { MONGODB_DATABASE: '../main' }, { ANATOMY_GRIDFS_BUCKET: '$unsafe' }]) {
      expect(() => readConfig(env)).toThrow()
    }
  })
})
