import { test, expect } from './fixtures'

test.use({ permissions: ['local-network-access'] })

test('normal direct entry returns to main Anatomy while preserving its selection', async ({ page }) => {
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Main Vetify</h1>' }))
  await page.goto('/bird/nervous')
  await expect(page).toHaveURL('http://localhost:5173/anatomy?view=%2Fbird%2Fnervous')
})

test('an embedded signed-out viewer asks main to perform the login handoff', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ status: 401 }))
  await page.route('http://localhost:5173/anatomy-test', route => route.fulfill({ contentType: 'text/html', body: `
    <h1>Main navigation</h1><p id="result">Waiting</p>
    <iframe title="Anatomy" src="http://localhost:5176/?embed=1"></iframe>
    <script>addEventListener('message', event => {
      if(event.origin === 'http://localhost:5176') document.querySelector('#result').textContent = event.data.type;
    });</script>` }))
  await page.goto('http://localhost:5173/anatomy-test')
  await expect(page.locator('#result')).toHaveText('vetify-anatomy:authenticate')
  await expect(page.frameLocator('iframe').getByRole('link', { name: 'Sign in with Vetify' })).toHaveCount(0)
})

test('an embedded signed-in viewer confirms readiness under main navigation', async ({ signedInPage: page }) => {
  await page.route('http://localhost:5173/anatomy-test', route => route.fulfill({ contentType: 'text/html', body: `
    <h1>Main navigation</h1><p id="result">Waiting</p>
    <iframe title="Anatomy" src="http://localhost:5176/?embed=1"></iframe>
    <script>addEventListener('message', event => {
      if(event.origin === 'http://localhost:5176') document.querySelector('#result').textContent = event.data.type;
    });</script>` }))
  await page.goto('http://localhost:5173/anatomy-test')
  await expect(page.locator('#result')).toHaveText('vetify-anatomy:ready')
  await expect(page.frameLocator('iframe').getByRole('img', { name: 'dog skeletal anatomy' })).toBeVisible()
  await expect(page.frameLocator('iframe').getByRole('banner')).toHaveCount(0)
})
