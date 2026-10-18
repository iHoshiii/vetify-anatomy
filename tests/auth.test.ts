import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'
import { config, fixture } from './helpers'

describe('Authorization handoff and logout', () => {
  it('moves local IP sign-in to the registered callback host before setting transaction cookies', async () => {
    const f = fixture()
    const response = await request(createApp(config, f.provider)).get('/auth/login?returnTo=/cat/digestive')
      .set('Host', '127.0.0.1:5176')
    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('http://localhost:5176/auth/login?returnTo=%2Fcat%2Fdigestive')
    expect(response.headers['set-cookie']).toBeUndefined()
    expect(f.provider.authorize).not.toHaveBeenCalled()
  })
  it('keeps state, verifier and nonce in a short-lived HttpOnly cookie', async () => {
    const f = fixture()
    const response = await request(createApp(config, f.provider)).get('/auth/login?returnTo=/cat/digestive')
    expect(response.status).toBe(302)
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax')
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=300')
    const transaction = vi.mocked(f.provider.authorize).mock.calls[0][0]
    expect(transaction.verifier.length).toBeGreaterThanOrEqual(43)
    expect(transaction.state).not.toBe(transaction.nonce)
    expect(transaction.returnTo).toBe('/cat/digestive')
  })
  it('rejects arbitrary return destinations', async () => {
    for (const path of ['//evil.example', 'https://evil.example', '/auth/logout', '/dog/skeletal?token=secret']) {
      expect((await request(createApp(config, fixture().provider)).get('/auth/login').query({ returnTo: path })).status).toBe(400)
    }
  })
  it('rejects missing, wrong, expired and duplicate callback state before exchange', async () => {
    const f = fixture()
    const app = createApp(config, f.provider)
    const data = { state: 'expected-state', verifier: 'verifier', nonce: 'nonce', returnTo: '/dog/skeletal' }
    for (const [query, age] of [['code=code', 300], ['state=wrong&code=code', 300],
      ['state=expected-state&state=expected-state&code=code', 300], ['state=expected-state&code=code', -1],
      ['state=expected-state&code=code&access_token=bad', 300]] as const) {
      const cookie = `${f.vault.name('transaction')}=${await f.vault.seal('transaction', data, age)}`
      const response = await request(app).get(`/auth/callback?${query}`).set('Cookie', cookie)
      expect(response.headers.location).toBe('/?auth=failed')
    }
    expect(f.provider.exchange).not.toHaveBeenCalled()
  })
  it('returns to the selected view without exposing tokens in URLs', async () => {
    const f = fixture()
    const transaction = { state: 'expected-state', verifier: 'verifier', nonce: 'nonce', returnTo: '/cat/digestive' }
    const cookie = `${f.vault.name('transaction')}=${await f.vault.seal('transaction', transaction, 300)}`
    const response = await request(createApp(config, f.provider)).get('/auth/callback?state=expected-state&code=code').set('Cookie', cookie)
    expect(response.headers.location).toBe('/cat/digestive')
    expect(JSON.stringify(response.headers)).not.toContain('test-only-access-token')
    expect(f.provider.exchange).toHaveBeenCalledOnce()
  })
  it('clears local cookies and revokes the provider token; rejects cross-site logout', async () => {
    const f = fixture()
    const app = createApp(config, f.provider)
    expect((await request(app).post('/auth/logout').set('Origin', 'https://evil.example')).status).toBe(403)
    const cookie = await f.cookie()
    vi.mocked(f.provider.revoke).mockImplementation(async () => { vi.mocked(f.provider.inspect).mockResolvedValue(null) })
    const response = await request(app).post('/auth/logout').set('Origin', config.origin).set('Cookie', cookie)
    expect(response.status).toBe(204)
    expect(f.provider.revoke).toHaveBeenCalledWith('test-only-access-token')
    expect((await request(app).get('/anatomy/dog/dog-skeleton.png').set('Cookie', cookie)).status).toBe(401)
  })
  it('reports provider logout failure without leaving a local session', async () => {
    const f = fixture()
    vi.mocked(f.provider.revoke).mockRejectedValue(new Error('Unavailable'))
    const response = await request(createApp(config, f.provider)).post('/auth/logout').set('Origin', config.origin).set('Cookie', await f.cookie())
    expect(response.status).toBe(503)
    expect(String(response.headers['set-cookie'])).toContain('Expires=Thu, 01 Jan 1970')
  })
})
