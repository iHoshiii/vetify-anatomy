import { Router, type Request } from 'express'
import { randomNonce, randomPKCECodeVerifier, randomState } from 'openid-client'
import type { Config } from './config'
import { cookieVault } from './cookies'
import type { AuthProvider, Transaction } from './provider'

export function authService(config: Config, provider: AuthProvider) {
  const vault = cookieVault(config)
  const router = Router()
  async function session(req: Request) {
    const data = await vault.read(req, 'session')
    if (!data || typeof data.token !== 'string' || typeof data.sub !== 'string') return null
    const identity = await provider.inspect(data.token)
    return identity && identity.sub === data.sub ? { ...identity, token: data.token } : null
  }
  router.get('/api/session', async (req, res) => {
    if (!config.configured) return res.status(503).json({ status: 'unavailable' })
    try {
      const current = await session(req)
      if (!current) {
        vault.clear(res, 'session')
        return res.status(401).json({ status: 'signed-out' })
      }
      return res.json({ status: 'signed-in', user: { id: current.sub } })
    } catch { return res.status(503).json({ status: 'unavailable' }) }
  })
  router.get('/auth/login', async (req, res) => {
    const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/'
    if (!/^\/(?:anatomy\/)?(?:dog|cat|bird)\/(?:skeletal|muscular|digestive|cardiovascular|nervous)$/.test(returnTo)
      && !['/', '/anatomy'].includes(returnTo)) return res.status(400).json({ error: 'Invalid return destination' })
    const localAlias = config.origin.replace('://localhost:', '://127.0.0.1:')
    if (!config.production && config.origin.startsWith('http://localhost:') && `http://${req.get('host')}` === localAlias) {
      const destination = new URL('/auth/login', config.origin)
      destination.searchParams.set('returnTo', returnTo)
      return res.redirect(destination.href)
    }
    if (!config.configured) return res.redirect('/?auth=unavailable')
    const transaction = { state: randomState(), verifier: randomPKCECodeVerifier(), nonce: randomNonce(), returnTo }
    try {
      const destination = await provider.authorize(transaction)
      await vault.write(res, 'transaction', transaction, 300)
      return res.redirect(destination)
    } catch { return res.redirect('/?auth=unavailable') }
  })
  router.get('/auth/callback', async (req, res) => {
    const data = await vault.read(req, 'transaction')
    vault.clear(res, 'transaction')
    if (!config.configured || !data || !['state', 'verifier', 'nonce', 'returnTo'].every(k => typeof data[k] === 'string')) {
      return res.redirect('/?auth=failed')
    }
    const transaction = data as unknown as Transaction
    const url = new URL(req.originalUrl, config.origin)
    if (url.searchParams.getAll('state').length !== 1 || url.searchParams.get('state') !== transaction.state
      || url.searchParams.getAll('code').length !== 1 || url.searchParams.has('access_token')
      || url.searchParams.has('id_token') || url.searchParams.has('error')) return res.redirect('/?auth=failed')
    try {
      const { token, identity } = await provider.exchange(url, transaction)
      const seconds = Math.min(3600, identity.exp - Math.floor(Date.now() / 1000))
      if (seconds <= 0) throw new Error('Expired authorization')
      await vault.write(res, 'session', { token, sub: identity.sub }, seconds)
      return res.redirect(transaction.returnTo)
    } catch { return res.redirect('/?auth=failed') }
  })
  router.post('/auth/logout', async (req, res) => {
    if (req.get('origin') !== config.origin) return res.status(403).json({ error: 'Invalid request origin' })
    const data = await vault.read(req, 'session')
    vault.clear(res, 'session')
    vault.clear(res, 'transaction')
    try {
      if (data && typeof data.token === 'string') await provider.revoke(data.token)
      return res.sendStatus(204)
    } catch { return res.status(503).json({ error: 'Session cleared locally. Vetify logout could not be confirmed.' }) }
  })
  return { router, session }
}
