import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

function protectPrivateFiles(req: IncomingMessage, res: ServerResponse, next: () => void) {
  let path: string
  try { path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname).replaceAll('\\', '/') }
  catch { res.statusCode = 400; res.end('Invalid URL'); return }
  if (/\/(?:private-assets|test-results|playwright-report|\.tmp|\.git|server|tests)(?:\/|$)/i.test(path)
    || /\/\.env(?:\.|\/|$)/i.test(path)) {
    res.statusCode = 403
    res.setHeader('Cache-Control', 'private, no-store')
    res.end('Access denied')
    return
  }
  next()
}

const proxy = Object.fromEntries(['/api', '/auth', '^/anatomy/[^/]+/[^/]+\\.png(?:\\?.*)?$'].map(path =>
  [path, { target: 'http://127.0.0.1:5177', changeOrigin: false }]))

export default defineConfig(({ mode }) => {
  const mainOrigin = loadEnv(mode, process.cwd(), 'VITE_MAIN_ORIGIN').VITE_MAIN_ORIGIN || 'http://localhost:5173'
  const headers = { 'Content-Security-Policy': `frame-ancestors 'self' ${new URL(mainOrigin).origin}` }
  return {
  plugins: [react(), {
    name: 'private-file-access',
    configureServer(server) { server.middlewares.use(protectPrivateFiles) },
    configurePreviewServer(server) { server.middlewares.use(protectPrivateFiles) },
  }],
  server: { host: '127.0.0.1', port: 5176, strictPort: true, proxy, headers, fs: { deny: [
    '.env', '.env.*', '**/private-assets/**', '**/.git/**', '**/server/**', '**/tests/**', '**/api/**',
    '**/test-results/**', '**/playwright-report/**', '**/.tmp/**',
  ] } },
  preview: { host: '127.0.0.1', port: 5176, strictPort: true, proxy, headers },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  }
})
