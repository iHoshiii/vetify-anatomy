import { Router } from 'express'
import { join } from 'node:path'
import { openPicture } from './mongodb.js'
import type { Config } from './config.js'
import type { authService } from './auth.js'
import IMAGE_CONFIG from '../src/data/image-config.js'

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
    if (!config.mongoStorage) return res.type('png').sendFile(join(config.assetDir, key), {
      cacheControl: false, lastModified: false, etag: false, acceptRanges: false, dotfiles: 'deny',
    }, error => { if (error) next(error) })
    try {
      if (!config.mongoUri) return res.status(503).json({ error: 'Private picture storage is unavailable.' })
      const body = await openPicture(config, key)
      if (!body) return res.sendStatus(404)
      res.type('png')
      body.on('error', () => {
        body.unpipe(res)
        if (res.headersSent) res.destroy()
        else res.status(503).type('json').json({ error: 'Private picture storage is unavailable.' })
      })
      res.on('close', () => body.destroy())
      body.pipe(res)
    } catch {
      if (res.headersSent) return res.destroy()
      return res.status(503).json({ error: 'Private picture storage is unavailable.' })
    }
  })
  return router
}
