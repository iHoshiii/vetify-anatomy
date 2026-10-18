import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'
import { readConfig } from '../server/config'
import { validateIdentity } from '../server/provider'
import { config, fixture } from './helpers'
import manifest from '../docs/source-manifest.json'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

describe('Private diagram delivery', () => {
  it('denies all 15 diagrams without a session, including HEAD', async () => {
    const app = createApp(config, fixture().provider)
    for (const asset of manifest.assets) {
      const response = await request(app).get(asset.route)
      expect(response.status).toBe(401)
      expect(response.headers['cache-control']).toContain('no-store')
      expect(response.headers['content-type']).not.toContain('image')
    }
    expect((await request(app).head(manifest.assets[0].route)).status).toBe(401)
  })
  it('checks current authorization on every image request', async () => {
    const f = fixture()
    const app = createApp(config, f.provider)
    for (const asset of manifest.assets) {
      const response = await request(app).get(asset.route).set('Cookie', await f.cookie())
      expect(response.status).toBe(200)
      expect(response.body).toEqual(await readFile(join(config.assetDir, asset.route.slice('/anatomy/'.length))))
      expect(response.headers['cache-control']).toContain('no-store')
      expect(response.headers.etag).toBeUndefined()
    }
    expect(f.provider.inspect).toHaveBeenCalledTimes(15)
    vi.mocked(f.provider.inspect).mockResolvedValue(null)
    expect((await request(app).get(manifest.assets[0].route).set('Cookie', await f.cookie())).status).toBe(401)
  })
  it('denies expired, tampered, wrong-purpose and mismatched-subject cookies', async () => {
    const f = fixture()
    const app = createApp(config, f.provider)
    const cookies = [await f.cookie('session', undefined, -1), (await f.cookie()) + 'tampered',
      await f.cookie('transaction'), await f.cookie('session', { token: 'test', sub: 'other-user' })]
    for (const cookie of cookies) expect((await request(app).get(manifest.assets[0].route).set('Cookie', cookie)).status).toBe(401)
  })
  it('fails closed on provider outages and missing configuration', async () => {
    const f = fixture()
    vi.mocked(f.provider.inspect).mockRejectedValue(new Error('Network unavailable'))
    const app = createApp(config, f.provider)
    expect((await request(app).get(manifest.assets[0].route).set('Cookie', await f.cookie())).status).toBe(503)
    expect((await request(app).get('/api/session').set('Cookie', await f.cookie())).status).toBe(503)
    const unconfigured = createApp(readConfig({}), f.provider)
    expect((await request(unconfigured).get(manifest.assets[0].route)).status).toBe(401)
    expect((await request(unconfigured).get('/api/session')).status).toBe(503)
  })
  it('rejects traversal, unlisted files and alternate public asset paths', async () => {
    const f = fixture()
    const app = createApp(config, f.provider)
    for (const path of ['/private-assets/anatomy/dog/dog-skeleton.png', '/public/anatomy/dog/dog-skeleton.png',
      '/anatomy/dog/%2e%2e%2f%2e%2e%2fpackage.json.png', '/anatomy/dog/unknown.png']) {
      expect((await request(app).get(path).set('Cookie', await f.cookie())).status).toBe(404)
    }
  })
})

describe('Main identity contract', () => {
  const valid = () => ({ active: true, iss: config.issuer, aud: config.clientId, client_id: config.clientId, sub: 'main-user',
    email_verified: true, account_active: true, exp: Math.floor(Date.now() / 1000) + 300 })
  it('accepts only the expected issuer, audience and current verified account', () => {
    expect(validateIdentity(valid(), config)?.sub).toBe('main-user')
    for (const change of [{ active: false }, { iss: 'https://other.example' }, { aud: 'books' },
      { aud: [config.clientId, 'books'] }, { client_id: 'books' },
      { email_verified: false }, { account_active: false }, { exp: 0 }, { sub: '' }]) {
      expect(validateIdentity({ ...valid(), ...change }, config)).toBeNull()
    }
    expect(validateIdentity({ version: 1, user: { id: 'main-user' } }, config)).toBeNull()
  })
})
