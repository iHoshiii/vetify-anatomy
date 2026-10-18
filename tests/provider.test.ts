import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomNonce, randomPKCECodeVerifier, randomState } from 'openid-client'
import { createProvider, type AuthProvider, type Transaction } from '../server/provider'
import { oidcFixture } from './oidc-fixture'

describe('Real OIDC client against an isolated test authorization server', () => {
  let fixture: Awaited<ReturnType<typeof oidcFixture>>
  let provider: AuthProvider
  const transaction = (): Transaction => ({ state: randomState(), verifier: randomPKCECodeVerifier(), nonce: randomNonce(), returnTo: '/' })
  beforeAll(async () => { fixture = await oidcFixture(); provider = createProvider(fixture.config) })
  afterAll(async () => { await fixture?.close() })
  it('uses S256 PKCE and validates code, signed ID token and online identity', async () => {
    const flow = transaction()
    const authorization = await provider.authorize(flow)
    const params = new URL(authorization).searchParams
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('redirect_uri')).toBe(fixture.config.callback)
    expect(params.get('client_id')).toBe('vetify-anatomy')
    expect(params.get('state')).toBe(flow.state)
    expect(authorization).not.toContain(flow.verifier)
    const callback = fixture.issue(authorization)
    const session = await provider.exchange(callback, flow)
    expect(session.identity.sub).toBe('fixture-user')
    expect(await provider.inspect(session.token)).not.toBeNull()
    await expect(provider.exchange(callback, flow)).rejects.toThrow()
    await provider.revoke(session.token)
    expect(await provider.inspect(session.token)).toBeNull()
  })
  it('rejects PKCE tampering, expired codes, wrong state/nonce and forged ID tokens', async () => {
    for (const mode of ['pkce', 'expired', 'state', 'nonce', 'signature']) {
      const flow = transaction()
      const callback = fixture.issue(await provider.authorize(flow), {
        expired: mode === 'expired', nonce: mode === 'nonce' ? 'wrong-nonce' : undefined, badSignature: mode === 'signature',
      })
      const checks = { ...flow, verifier: mode === 'pkce' ? randomPKCECodeVerifier() : flow.verifier,
        state: mode === 'state' ? randomState() : flow.state }
      await expect(provider.exchange(callback, checks)).rejects.toThrow()
    }
  })
})
