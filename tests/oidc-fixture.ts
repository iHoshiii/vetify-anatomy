import express from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { readConfig } from '../server/config'

export async function oidcFixture() {
  const app = express()
  const keys = await generateKeyPair('RS256')
  const untrustedKeys = await generateKeyPair('RS256')
  const jwk = { ...await exportJWK(keys.publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' }
  const codes = new Map<string, { challenge: string; nonce: string; expires: number; badSignature: boolean }>()
  const tokens = new Set<string>()
  app.use(express.urlencoded({ extended: false }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const issuer = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`
  const config = readConfig({ VITE_MAIN_ORIGIN: issuer, OIDC_ISSUER: issuer,
    OIDC_CLIENT_SECRET: 'fixture-only-secret', SESSION_ENCRYPTION_KEY: randomBytes(32).toString('base64url') })
  app.get('/.well-known/openid-configuration', (_req, res) => res.json({
    issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/jwks`, introspection_endpoint: `${issuer}/introspect`, revocation_endpoint: `${issuer}/revoke`,
    response_types_supported: ['code'], subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_post'],
    code_challenge_methods_supported: ['S256'],
  }))
  app.get('/jwks', (_req, res) => res.json({ keys: [jwk] }))
  app.use(['/token', '/introspect', '/revoke'], (req, res, next) => {
    if (req.body.client_id !== config.clientId || req.body.client_secret !== config.clientSecret) {
      return res.status(401).json({ error: 'invalid_client' })
    }
    return next()
  })
  app.post('/token', async (req, res) => {
    const code = codes.get(req.body.code)
    codes.delete(req.body.code)
    const challenge = createHash('sha256').update(req.body.code_verifier || '').digest('base64url')
    if (!code || code.expires <= Date.now() || challenge !== code.challenge || req.body.redirect_uri !== config.callback) {
      return res.status(400).json({ error: 'invalid_grant' })
    }
    const token = randomBytes(24).toString('base64url')
    tokens.add(token)
    const idToken = await new SignJWT({ nonce: code.nonce })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(issuer).setAudience(config.clientId)
      .setSubject('fixture-user').setIssuedAt().setExpirationTime('5m').sign(code.badSignature ? untrustedKeys.privateKey : keys.privateKey)
    return res.json({ token_type: 'Bearer', access_token: token, id_token: idToken, expires_in: 300 })
  })
  app.post('/introspect', (req, res) => res.json(tokens.has(req.body.token)
    ? { active: true, iss: issuer, aud: config.clientId, client_id: config.clientId, sub: 'fixture-user', exp: Math.floor(Date.now() / 1000) + 300,
      email_verified: true, account_active: true } : { active: false }))
  app.post('/revoke', (req, res) => { tokens.delete(req.body.token); res.sendStatus(200) })
  return {
    config,
    issue(authorization: string, options: { expired?: boolean; nonce?: string; badSignature?: boolean } = {}) {
      const params = new URL(authorization).searchParams
      const code = randomBytes(16).toString('base64url')
      codes.set(code, { challenge: params.get('code_challenge')!, nonce: options.nonce ?? params.get('nonce')!,
        expires: options.expired ? 0 : Date.now() + 300000, badSignature: options.badSignature ?? false })
      const callback = new URL(config.callback)
      callback.searchParams.set('code', code)
      callback.searchParams.set('state', params.get('state')!)
      return callback
    },
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  }
}
