import { afterEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'
import { readConfig } from '../server/config'
import hosting from '../vercel.json'

afterEach(() => { vi.unstubAllEnvs() })

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
    expect(settings.mongoStorage).toBe(true)
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
