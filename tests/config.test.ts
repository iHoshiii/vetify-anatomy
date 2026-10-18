import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { readConfig } from '../server/config'
import { createApp } from '../server/app'
import { config, fixture } from './helpers'

describe('Production configuration', () => {
  const production = {
    NODE_ENV: 'production', VITE_MAIN_ORIGIN: 'https://main.example.test',
    VITE_AUTH_CALLBACK_URL: 'https://anatomy.vetify.page/auth/callback', OIDC_ISSUER: 'https://main.example.test',
    OIDC_CLIENT_SECRET: 'fixture-only-secret', SESSION_ENCRYPTION_KEY: config.key.toString('base64url'),
  }
  it('requires exact callbacks, a main issuer and HTTPS', () => {
    expect(() => readConfig({ ...production, VITE_AUTH_CALLBACK_URL: 'http://localhost:5176/auth/callback' })).toThrow()
    expect(() => readConfig({ ...production, OIDC_ISSUER: 'https://other.example.test' })).toThrow()
    expect(() => readConfig({ ...production, VITE_AUTH_CALLBACK_URL: 'https://anatomy.vetify.page/auth/callback?extra=1' })).toThrow()
    expect(() => readConfig({ ...production, SESSION_ENCRYPTION_KEY: 'too-short' })).toThrow()
    expect(readConfig({ ...production, SESSION_ENCRYPTION_KEY: '' }).configured).toBe(false)
  })
  it('uses a Secure HttpOnly host-only cookie', async () => {
    const response = await request(createApp(readConfig(production), fixture().provider)).get('/auth/login')
    const cookie = String(response.headers['set-cookie'])
    expect(cookie).toContain('__Host-anatomy-transaction=')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).not.toContain('Domain=')
  })
})
