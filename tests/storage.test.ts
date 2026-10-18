import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import request from 'supertest'
import { createApp } from '../server/app'
import { openPicture } from '../server/mongodb'
import { config, fixture } from './helpers'

vi.mock('../server/mongodb', () => ({ openPicture: vi.fn() }))
beforeEach(() => { vi.mocked(openPicture).mockReset() })

describe('MongoDB private picture delivery', () => {
  const settings = () => ({ ...config, mongoStorage: true, mongoUri: 'mongodb://storage-user:fixture@db.invalid' })
  const path = '/anatomy/dog/dog-skeleton.png'
  it('denies anonymous and revoked sessions before accessing MongoDB', async () => {
    const f = fixture()
    const app = createApp(settings(), f.provider)
    expect((await request(app).get(path)).status).toBe(401)
    expect((await request(app).head(path)).status).toBe(401)
    vi.mocked(f.provider.inspect).mockResolvedValue(null)
    expect((await request(app).get(path).set('Cookie', await f.cookie())).status).toBe(401)
    expect(openPicture).not.toHaveBeenCalled()
  })
  it('streams the unchanged PNG privately without exposing database credentials', async () => {
    const data = await readFile(join(config.assetDir, 'dog/dog-skeleton.png'))
    vi.mocked(openPicture).mockResolvedValueOnce(Readable.from([data]))
    const f = fixture()
    const response = await request(createApp(settings(), f.provider)).get(path).set('Cookie', await f.cookie())
    expect(response.status).toBe(200)
    expect(response.body).toEqual(data)
    expect(response.headers['content-type']).toContain('image/png')
    expect(response.headers['cache-control']).toContain('no-store')
    expect(response.headers.etag).toBeUndefined()
    expect(JSON.stringify(response.headers)).not.toContain('mongodb')
    expect(openPicture).toHaveBeenCalledWith(settings(), 'dog/dog-skeleton.png')
  })
  it('denies unavailable storage without falling back to local production files', async () => {
    const f = fixture()
    const app = createApp({ ...settings(), mongoUri: '' }, f.provider)
    expect((await request(app).get(path).set('Cookie', await f.cookie())).status).toBe(503)
    expect(openPicture).not.toHaveBeenCalled()
  })
  it('reports database outages without exposing the URI', async () => {
    vi.mocked(openPicture).mockRejectedValue(new Error(settings().mongoUri))
    const f = fixture()
    const response = await request(createApp(settings(), f.provider)).get(path).set('Cookie', await f.cookie())
    expect(response.status).toBe(503)
    expect(response.body).toEqual({ error: 'Private picture storage is unavailable.' })
  })
  it('returns 404 for missing files and rejects unlisted paths without querying MongoDB', async () => {
    vi.mocked(openPicture).mockResolvedValue(null)
    const f = fixture()
    const app = createApp(settings(), f.provider)
    expect((await request(app).get(path).set('Cookie', await f.cookie())).status).toBe(404)
    vi.mocked(openPicture).mockClear()
    expect((await request(app).get('/anatomy/dog/unknown.png').set('Cookie', await f.cookie())).status).toBe(404)
    expect(openPicture).not.toHaveBeenCalled()
  })
  it('handles GridFS stream errors before headers without exposing internal errors', async () => {
    const body = new Readable({ read() { this.destroy(new Error(settings().mongoUri)) } })
    vi.mocked(openPicture).mockResolvedValueOnce(body)
    const f = fixture()
    const response = await request(createApp(settings(), f.provider)).get(path).set('Cookie', await f.cookie())
    expect(response.status).toBe(503)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toEqual({ error: 'Private picture storage is unavailable.' })
    expect(body.destroyed).toBe(true)
  })
})
