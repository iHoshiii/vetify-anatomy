import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { readFile } from 'node:fs/promises'
import { get, type GetBlobResult } from '@vercel/blob'
import { createApp } from '../server/app'
import { config, fixture } from './helpers'
import { readConfig } from '../server/config'
import hosting from '../vercel.json'

vi.mock('@vercel/blob', () => ({ get: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs() })
beforeEach(() => { vi.mocked(get).mockReset() })

describe('Vercel private picture delivery', () => {
  const blobConfig = () => ({ ...config, blobStorage: true, blobToken: 'test-storage-token' })
  it('authenticates before reading private Blob storage', async () => {
    const f = fixture()
    const response = await request(createApp(blobConfig(), f.provider)).get('/anatomy/dog/dog-skeleton.png')
    expect(response.status).toBe(401)
    expect(get).not.toHaveBeenCalled()
  })
  it('streams an authenticated picture without exposing its storage token or URL', async () => {
    const data = await readFile('private-assets/anatomy/dog/dog-skeleton.png')
    const object: GetBlobResult = {
      statusCode: 200, headers: new Headers(), stream: new ReadableStream({ start(controller) {
        controller.enqueue(data); controller.close()
      } }),
      blob: { url: 'https://fixture.private.blob.vercel-storage.com/anatomy/dog/dog-skeleton.png',
        downloadUrl: 'https://fixture.private.blob.vercel-storage.com/download',
        pathname: 'anatomy/dog/dog-skeleton.png', contentType: 'image/png', size: data.length,
        contentDisposition: 'inline', cacheControl: 'max-age=60', uploadedAt: new Date(), etag: 'test' },
    }
    vi.mocked(get).mockResolvedValue(object)
    const f = fixture()
    const response = await request(createApp(blobConfig(), f.provider)).get('/anatomy/dog/dog-skeleton.png')
      .set('Cookie', await f.cookie())
    expect(response.status).toBe(200)
    expect(response.body).toEqual(data)
    expect(response.headers['cache-control']).toContain('no-store')
    expect(JSON.stringify(response.headers)).not.toContain('vercel-storage')
    expect(JSON.stringify(response.headers)).not.toContain('test-storage-token')
    expect(get).toHaveBeenCalledWith('anatomy/dog/dog-skeleton.png', {
      access: 'private', token: 'test-storage-token', storeId: undefined,
    })
  })
  it('fails closed for missing storage credentials', async () => {
    const f = fixture()
    const noStorage = createApp({ ...config, blobStorage: true }, f.provider)
    expect((await request(noStorage).get('/anatomy/dog/dog-skeleton.png').set('Cookie', await f.cookie())).status).toBe(503)
    expect(get).not.toHaveBeenCalled()
  })
  it('fails closed when private storage rejects the request', async () => {
    const f = fixture()
    vi.mocked(get).mockImplementation(async () => { throw new Error('Blob unavailable') })
    const failing = await request(createApp(blobConfig(), f.provider)).get('/anatomy/dog/dog-skeleton.png')
      .set('Cookie', await f.cookie())
    expect(failing.status).toBe(503)
    expect(failing.body).toEqual({ error: 'Private picture storage is unavailable.' })
  })
  it('returns 404 for a missing picture and never fetches an unlisted path', async () => {
    const f = fixture()
    const app = createApp(blobConfig(), f.provider)
    vi.mocked(get).mockResolvedValue(null)
    expect((await request(app).get('/anatomy/dog/dog-skeleton.png').set('Cookie', await f.cookie())).status).toBe(404)
    vi.mocked(get).mockClear()
    expect((await request(app).get('/anatomy/dog/unknown.png').set('Cookie', await f.cookie())).status).toBe(404)
    expect(get).not.toHaveBeenCalled()
  })
})

describe('Vercel hosting configuration', () => {
  it('routes protected requests to the function and UI deep links to the static build', () => {
    expect(hosting.framework).toBe('vite')
    expect(hosting.outputDirectory).toBe('dist')
    for (const source of ['/api/:path*', '/auth/:path*', '/anatomy/:path*']) {
      expect(hosting.rewrites.find(rule => rule.source === source)?.destination).toBe('/api/index')
    }
    expect(hosting.functions['api/index.ts'].includeFiles).toBe('dist/**')
    expect(hosting.rewrites.some(rule => rule.source === '/(.*)')).toBe(false)
  })
  it('forces private storage and HTTPS cookies on Vercel, including previews', () => {
    const settings = readConfig({ VERCEL: '1', VITE_MAIN_ORIGIN: 'https://main.example.test',
      VITE_AUTH_CALLBACK_URL: 'https://anatomy.vetify.page/auth/callback' })
    expect(settings.production).toBe(true)
    expect(settings.blobStorage).toBe(true)
    const defaults = readConfig({ VERCEL: '1' })
    expect(defaults.mainOrigin).toBe('https://vetify.page')
    expect(defaults.callback).toBe('https://anatomy.vetify.page/auth/callback')
    expect(defaults.configured).toBe(false)
    expect(() => readConfig({ VERCEL: '1', VITE_MAIN_ORIGIN: 'http://localhost:5173' })).toThrow()
  })
  it('exports a serverless handler that denies access when sign-in is unconfigured', async () => {
    vi.stubEnv('VITE_MAIN_ORIGIN', 'https://main.example.test')
    vi.stubEnv('VITE_AUTH_CALLBACK_URL', 'https://anatomy.vetify.page/auth/callback')
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('OIDC_ISSUER', '')
    vi.stubEnv('OIDC_CLIENT_SECRET', '')
    const { default: handler } = await import('../api/index')
    expect(typeof handler).toBe('function')
    expect((await request(handler).get('/api/session')).status).toBe(503)
    expect((await request(handler).get('/auth/login')).headers.location).toBe('/?auth=unavailable')
    expect((await request(handler).get('/anatomy/dog/dog-skeleton.png')).status).toBe(401)
  })
})
