import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

process.env.NODE_ENV = 'production'
process.env.VERCEL = '1'
process.env.VITE_MAIN_ORIGIN = 'https://vetify.page'
process.env.VITE_AUTH_CALLBACK_URL = 'https://anatomy.vetify.page/auth/callback'
process.env.OIDC_ISSUER = 'https://vetify.page/api/oidc'
process.env.OIDC_CLIENT_SECRET = randomBytes(48).toString('base64url')
process.env.SESSION_ENCRYPTION_KEY = randomBytes(32).toString('base64url')

const { default: app } = await import('../.vercel/output/functions/api/index.func/api/index.js')
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve, reject) => {
  server.once('listening', resolve)
  server.once('error', reject)
})
try {
  const origin = `http://127.0.0.1:${server.address().port}`
  const session = await fetch(`${origin}/api/session`)
  assert.equal(session.status, 401)
  assert.deepEqual(await session.json(), { status: 'signed-out' })
  const picture = await fetch(`${origin}/anatomy/dog/skeletal.png`)
  assert.equal(picture.status, 401)
  console.log('Vercel function starts in native Node ESM and denies anonymous session/picture access.')
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
}
