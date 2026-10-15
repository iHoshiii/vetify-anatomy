import { test as base, expect, type Page } from '@playwright/test'
import { resolve } from 'node:path'
import manifest from '../../docs/source-manifest.json' with { type: 'json' }

export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    await page.route('**/api/session', route => route.fulfill({ json: { status: 'signed-in', user: { id: 'test-only-user' } } }))
    await page.route('**/anatomy/**/*.png', async route => {
      const path = new URL(route.request().url()).pathname
      const asset = manifest.assets.find(item => item.route === path)
      if (!asset) return route.fulfill({ status: 404 })
      return route.fulfill({ path: resolve(asset.destination), contentType: 'image/png', headers: { 'Cache-Control': 'private, no-store' } })
    })
    await use(page)
  },
})
export { expect }
