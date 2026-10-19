import * as oidc from 'openid-client'
import type { Config } from './config.js'

export type Identity = { sub: string; exp: number }
export type Transaction = { state: string; verifier: string; nonce: string; returnTo: string }
export interface AuthProvider {
  authorize(transaction: Transaction): Promise<string>
  exchange(url: URL, transaction: Transaction): Promise<{ token: string; identity: Identity }>
  inspect(token: string): Promise<Identity | null>
  revoke(token: string): Promise<void>
}

export function validateIdentity(data: Record<string, unknown>, config: Config): Identity | null {
  const audience = Array.isArray(data.aud) ? data.aud : [data.aud]
  if (data.active !== true || data.iss !== config.issuer || audience.length !== 1 || audience[0] !== config.clientId
    || data.client_id !== config.clientId
    || data.email_verified !== true || data.account_active !== true
    || typeof data.sub !== 'string' || !data.sub || typeof data.exp !== 'number'
    || data.exp <= Math.floor(Date.now() / 1000)) return null
  return { sub: data.sub, exp: data.exp }
}

export function createProvider(config: Config): AuthProvider {
  let discovered: Promise<oidc.Configuration> | undefined
  async function getConfiguration() {
    if (!config.configured) throw new Error('Shared sign-in is not configured')
    discovered ??= oidc.discovery(new URL(config.issuer), config.clientId,
      { client_secret: config.clientSecret }, oidc.ClientSecretPost(config.clientSecret), {
        timeout: 5,
        execute: config.production ? undefined : [oidc.allowInsecureRequests],
      }).then(value => {
        const metadata = value.serverMetadata()
        if (!metadata.jwks_uri || !metadata.introspection_endpoint || !metadata.revocation_endpoint
          || !metadata.code_challenge_methods_supported?.includes('S256')) {
          throw new Error('Provider must support PKCE, introspection and revocation')
        }
        oidc.enableNonRepudiationChecks(value)
        return value
      }).catch(error => { discovered = undefined; throw error })
    return discovered
  }
  async function inspect(token: string) {
    const response = await oidc.tokenIntrospection(await getConfiguration(), token)
    return validateIdentity(response, config)
  }
  return {
    async authorize(transaction) {
      const challenge = await oidc.calculatePKCECodeChallenge(transaction.verifier)
      return oidc.buildAuthorizationUrl(await getConfiguration(), {
        redirect_uri: config.callback, scope: 'openid email', response_type: 'code',
        state: transaction.state, nonce: transaction.nonce,
        code_challenge: challenge, code_challenge_method: 'S256',
      }).href
    },
    async exchange(url, transaction) {
      const tokens = await oidc.authorizationCodeGrant(await getConfiguration(), url, {
        pkceCodeVerifier: transaction.verifier, expectedState: transaction.state,
        expectedNonce: transaction.nonce, idTokenExpected: true,
      })
      const identity = await inspect(tokens.access_token)
      if (!identity || tokens.claims()?.sub !== identity.sub) {
        await oidc.tokenRevocation(await getConfiguration(), tokens.access_token)
        throw new Error('Provider identity is not authorized')
      }
      return { token: tokens.access_token, identity }
    },
    inspect,
    async revoke(token) { await oidc.tokenRevocation(await getConfiguration(), token) },
  }
}
