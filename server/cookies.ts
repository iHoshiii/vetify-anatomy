import { EncryptJWT, jwtDecrypt, type JWTPayload } from 'jose'
import type { Request, Response } from 'express'
import type { Config } from './config.js'

export function cookieVault(config: Config) {
  const name = (purpose: string) => `${config.production ? '__Host-' : ''}anatomy-${purpose}`
  const options = { httpOnly: true, secure: config.production, sameSite: 'lax' as const, path: '/' }
  async function seal(purpose: string, data: JWTPayload, seconds: number) {
    return new EncryptJWT({ ...data, purpose }).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuer(config.origin).setAudience(config.clientId).setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + seconds).encrypt(config.key)
  }
  async function read(req: Request, purpose: string): Promise<JWTPayload | null> {
    const token = req.cookies?.[name(purpose)]
    if (typeof token !== 'string') return null
    try {
      const { payload } = await jwtDecrypt(token, config.key, {
        issuer: config.origin, audience: config.clientId,
        keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'],
      })
      return payload.purpose === purpose ? payload : null
    } catch { return null }
  }
  async function write(res: Response, purpose: string, data: JWTPayload, seconds: number) {
    const value = await seal(purpose, data, seconds)
    if (value.length > 3600) throw new Error('Provider credential exceeds session cookie limit')
    res.cookie(name(purpose), value, { ...options, maxAge: seconds * 1000 })
  }
  return { read, write, seal, name, clear: (res: Response, purpose: string) => res.clearCookie(name(purpose), options) }
}
