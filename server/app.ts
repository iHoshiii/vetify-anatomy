import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { resolve } from 'node:path'
import type { Config } from './config'
import { createProvider, type AuthProvider } from './provider'
import { authService } from './auth'
import { assetRouter } from './assets'

export function createApp(config: Config, provider: AuthProvider = createProvider(config)) {
  const app = express()
  app.disable('x-powered-by')
  app.disable('etag')
  app.use(helmet({ xFrameOptions: false, contentSecurityPolicy: { directives: {
    'frame-ancestors': ["'self'", config.mainOrigin],
    'style-src': ["'self'", "'unsafe-inline'"], 'img-src': ["'self'", 'blob:', 'data:'],
    'upgrade-insecure-requests': config.production ? [] : null,
  } } }))
  app.use(cookieParser())
  app.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    res.set('Pragma', 'no-cache')
    res.set('Vary', 'Cookie')
    res.set('Referrer-Policy', 'no-referrer')
    if (!['GET', 'HEAD', 'POST'].includes(req.method)) return res.sendStatus(405)
    return next()
  })
  const auth = authService(config, provider)
  app.use(auth.router)
  app.use('/anatomy', assetRouter(config, auth))
  app.use('/api', (_req, res) => res.sendStatus(404))
  app.use('/auth', (_req, res) => res.sendStatus(404))
  const directory = resolve('dist')
  app.use(express.static(directory, { index: false, dotfiles: 'deny' }))
  app.get(['/', '/anatomy', '/:animal/:system', '/anatomy/:animal/:system'], (req, res, next) => {
    res.sendFile(resolve(directory, 'index.html'), error => { if (error) next(error) })
  })
  app.use((_req, res) => res.sendStatus(404))
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return res.destroy()
    const status = (error as { status?: number }).status === 404 ? 404 : 503
    return res.status(status).json({ error: status === 404 ? 'Picture not found.' : 'Service unavailable.' })
  })
  return app
}
