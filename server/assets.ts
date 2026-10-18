import { Router } from 'express'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { get } from '@vercel/blob'
import type { Config } from './config'
import type { authService } from './auth'
import IMAGE_CONFIG from '../src/data/image-config'

export function assetRouter(config: Config, auth: ReturnType<typeof authService>) {
  const router = Router()
  const allowed = new Set(Object.values(IMAGE_CONFIG).flatMap(systems => Object.values(systems).map(image => image.src)))
  router.use(async (req, res, next) => {
    if (!req.path.endsWith('.png')) return next('router')
    try {
      if (!config.configured || !await auth.session(req)) return res.status(401).json({ error: 'Sign in to Vetify to view this picture.' })
      return next()
    } catch { return res.status(503).json({ error: 'Sign-in verification is unavailable.' }) }
  })
  router.get('/:animal/:file', async (req, res, next) => {
    const key = `${req.params.animal}/${req.params.file}`
    if (!allowed.has(`/anatomy/${key}`)) return res.sendStatus(404)
    if (!config.blobStorage) return res.type('png').sendFile(join(config.assetDir, key), {
      cacheControl: false, lastModified: false, etag: false, acceptRanges: false, dotfiles: 'deny',
    }, error => { if (error) next(error) })
    try {
      if (!config.blobToken && !config.blobStoreId) return res.status(503).json({ error: 'Private picture storage is unavailable.' })
      const object = await get(`${config.blobPrefix}${key}`, {
        access: 'private', token: config.blobToken || undefined, storeId: config.blobStoreId || undefined,
      })
      if (!object) return res.sendStatus(404)
      if (object.statusCode !== 200 || !object.stream) throw new Error('Private picture unavailable')
      res.type('png')
      const body = Readable.fromWeb(object.stream as Parameters<typeof Readable.fromWeb>[0])
      body.on('error', next)
      res.on('close', () => body.destroy())
      body.pipe(res)
    } catch {
      if (res.headersSent) return res.destroy()
      return res.status(503).json({ error: 'Private picture storage is unavailable.' })
    }
  })
  return router
}
