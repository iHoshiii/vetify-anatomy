import { randomBytes } from 'node:crypto'
import { vi } from 'vitest'
import { readConfig } from '../server/config'
import { cookieVault } from '../server/cookies'
import type { AuthProvider } from '../server/provider'

export const config = readConfig({
  VITE_MAIN_ORIGIN: 'http://localhost:5173', OIDC_ISSUER: 'http://localhost:5173',
  OIDC_CLIENT_SECRET: 'test-fixture-only', SESSION_ENCRYPTION_KEY: randomBytes(32).toString('base64url'),
})
export const identity = () => ({ sub: 'main-user-123', exp: Math.floor(Date.now() / 1000) + 600 })
export function fixture() {
  const provider: AuthProvider = {
    authorize: vi.fn(async () => 'http://localhost:5173/fixture-authorize'),
    exchange: vi.fn(async () => ({ token: 'test-only-access-token', identity: identity() })),
    inspect: vi.fn(async () => identity()), revoke: vi.fn(async () => {}),
  }
  const vault = cookieVault(config)
  async function cookie(purpose = 'session', data = { token: 'test-only-access-token', sub: 'main-user-123' }, seconds = 600) {
    return `${vault.name(purpose)}=${await vault.seal(purpose, data, seconds)}`
  }
  return { provider, cookie, vault }
}
