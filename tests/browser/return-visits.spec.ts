import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

const hintKey = 'vetify-anatomy:last-session-check'
const imageName = 'dog skeletal anatomy'
async function prime(page: Page) {
  await page.goto('/?embed=1&auth=failed')
  await expect(page.getByRole('img', { name: imageName })).toBeVisible()
  await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), hintKey)).not.toBeNull()
}
async function pauseSession(page: Page, status = 200) {
  let release!: () => void
  const paused = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/session', async route => {
    await paused
    await route.fulfill({ status, json: { status: status === 200 ? 'signed-in' : 'signed-out' } })
  })
  return release
}

test('a return visit displays the viewer while its session is checked in the background', async ({ signedInPage: page }) => {
  await prime(page)
  const release = await pauseSession(page)
  const request = page.waitForRequest('**/api/session')
  await page.reload()
  await request
  try {
    await expect(page.getByRole('img', { name: imageName })).toBeVisible()
    await expect(page.getByText('Connecting to your Vetify session...')).toHaveCount(0)
  } finally { release() }
})

test('a rejected background session clears the hint and removes the viewer', async ({ signedInPage: page }) => {
  await prime(page)
  const release = await pauseSession(page, 403)
  await page.reload()
  try { await expect(page.getByRole('button', { name: 'Dog', exact: true })).toBeVisible() }
  finally { release() }
  await expect(page.getByRole('button', { name: 'Dog', exact: true })).toHaveCount(0)
  await expect(page.getByRole('img', { name: imageName })).toHaveCount(0)
  expect(await page.evaluate(key => sessionStorage.getItem(key), hintKey)).toBeNull()
})

test('a cached layout cannot bypass image authorization or be restored by a late session response', async ({ signedInPage: page }) => {
  await prime(page)
  const release = await pauseSession(page)
  let imageRequests = 0
  await page.route('**/anatomy/dog/dog-skeleton.png', route => {
    imageRequests++
    return route.fulfill({ status: 401 })
  })
  const request = page.waitForRequest('**/api/session')
  await page.reload()
  await request
  const response = page.waitForResponse('**/api/session')
  let refusedRequests = 0
  try {
    await expect.poll(() => imageRequests).toBeGreaterThan(0)
    await expect(page.getByRole('button', { name: 'Dog', exact: true })).toHaveCount(0)
    expect(await page.evaluate(key => sessionStorage.getItem(key), hintKey)).toBeNull()
    refusedRequests = imageRequests
  } finally { release() }
  await (await response).finished()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(page.getByRole('img', { name: imageName })).toHaveCount(0)
  expect(imageRequests).toBe(refusedRequests)
  expect(await page.evaluate(key => sessionStorage.getItem(key), hintKey)).toBeNull()
})
