import { test, expect } from './fixtures'
import { resolve } from 'node:path'

test('signed-out visitors cannot retrieve pictures or bypass Vite private directories', async ({ page, request }) => {
  await page.goto('/?embed=1&auth=failed')
  await expect(page.getByRole('alert')).toContainText('Sign-in could not be completed')
  await expect(page.getByRole('button', { name: 'Dog', exact: true })).not.toBeVisible()
  expect((await request.get('/anatomy/dog/dog-skeleton.png')).status()).toBe(401)
  for (const path of ['/private-assets/anatomy/dog/dog-skeleton.png',
    '/private-assets/anatomy/dog/dog-skeleton.png?raw',
    '/test-results/desktop-dog.png', '/playwright-report/index.html', '/.tmp/dev.stdout.log',
    `/@fs/${resolve('private-assets/anatomy/dog/dog-skeleton.png').replaceAll('\\', '/')}`]) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(403)
    expect(response.headers()['content-type'] || '').not.toContain('image/png')
  }
})

test('slow and failed image loads show loading, error and working retry', async ({ signedInPage: page }) => {
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  let failed = true
  await page.route('**/anatomy/dog/dog-skeleton.png', async route => {
    if (failed) { await delayed; return route.fulfill({ status: 503, body: 'Unavailable' }) }
    return route.fulfill({ path: resolve('private-assets/anatomy/dog/dog-skeleton.png'), contentType: 'image/png' })
  })
  await page.goto('/?embed=1')
  await expect(page.getByText('Loading anatomy picture...')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skull (Cranium)', exact: true })).not.toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('This picture could not be loaded.')
  failed = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Skull (Cranium)', exact: true })).toBeVisible()
})

test('revoked authorization removes the viewer and pictures', async ({ signedInPage: page }) => {
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Main sign-in</h1>' }))
  await page.goto('/?embed=1')
  await expect(page.getByRole('button', { name: 'Dog', exact: true })).toBeVisible()
  await page.route('**/anatomy/cat/cat-skeleton.png', route => route.fulfill({ status: 401 }))
  await page.getByRole('button', { name: 'Cat', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Main sign-in' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'cat skeletal anatomy' })).not.toBeVisible()
})
