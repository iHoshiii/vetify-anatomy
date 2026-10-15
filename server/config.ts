import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const vercel = env.VERCEL === '1'
  const production = env.NODE_ENV === 'production' || vercel
  const mainOrigin = new URL(env.VITE_MAIN_ORIGIN || 'http://localhost:5173').origin
  const callback = new URL(env.VITE_AUTH_CALLBACK_URL || 'http://localhost:5176/auth/callback')
  const clientId = env.VITE_AUTH_CLIENT_ID || 'vetify-anatomy'
  const issuer = env.OIDC_ISSUER || ''
  const clientSecret = env.OIDC_CLIENT_SECRET || ''
  const encodedKey = env.SESSION_ENCRYPTION_KEY || ''
  if (callback.pathname !== '/auth/callback' || callback.search || callback.hash) {
    throw new Error('Callback must be an exact /auth/callback URL')
  }
  if (issuer && new URL(issuer).origin !== mainOrigin) throw new Error('Issuer must belong to main Vetify')
  for (const url of [mainOrigin, callback.href, issuer].filter(Boolean)) {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && (production || !['localhost', '127.0.0.1'].includes(parsed.hostname))) {
      throw new Error('HTTPS is required except for local development')
    }
  }
  if (encodedKey && (!/^[A-Za-z0-9_-]{43}$/.test(encodedKey) || Buffer.from(encodedKey, 'base64url').length !== 32)) {
    throw new Error('SESSION_ENCRYPTION_KEY must be a base64url-encoded 32-byte random key')
  }
  return {
    production, mainOrigin, callback: callback.href, origin: callback.origin, clientId, issuer,
    clientSecret, key: encodedKey ? Buffer.from(encodedKey, 'base64url') : randomBytes(32),
    configured: Boolean(issuer && clientSecret && encodedKey),
    port: Number(env.ANATOMY_SERVER_PORT || 5177),
    assetDir: resolve(env.ANATOMY_PRIVATE_ASSET_DIR || 'private-assets/anatomy'),
    vercel, blobToken: env.BLOB_READ_WRITE_TOKEN || '', blobStoreId: env.BLOB_STORE_ID || '',
    blobPrefix: env.ANATOMY_BLOB_PREFIX ?? 'anatomy/',
    blobStorage: vercel || Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID),
  }
}
export type Config = ReturnType<typeof readConfig>
