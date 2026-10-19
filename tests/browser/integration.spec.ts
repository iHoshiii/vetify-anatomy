import { test, expect } from './fixtures'

test.use({ permissions: ['local-network-access'] })

test('normal direct entry keeps the Anatomy address and hosts main navigation', async ({ page }) => {
  let sessionChecks = 0
  await page.route('**/api/session', route => { sessionChecks++; return route.fulfill({ status: 401 }) })
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Main Vetify</h1>' }))
  await page.goto('/bird/nervous')
  await expect(page).toHaveURL('http://localhost:5176/bird/nervous')
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'Main Vetify' })).toBeVisible()
  await expect(page.locator('iframe')).toHaveAttribute('src', 'http://localhost:5173/anatomy?hosted=1&view=%2Fbird%2Fnervous')
  expect(sessionChecks).toBe(0)
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

test('the Anatomy host starts sign-in at the top level using only a safe view', async ({ page }) => {
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: `<script>
    parent.postMessage({type:'vetify-anatomy:authenticate',view:'/bird/nervous'}, 'http://localhost:5176');
    </script>` }))
  await page.route('http://localhost:5176/auth/login**', route => {
    expect(new URL(route.request().url()).searchParams.get('returnTo')).toBe('/bird/nervous')
    return route.fulfill({status:302,headers:{location:'http://localhost:5173/login'}})
  })
  await page.route('http://localhost:5173/login', route => route.fulfill({contentType:'text/html',body:'<h1>Main login</h1>'}))
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:5173/login')
})

test('hosted navbar links leave the outer page for main Vetify', async ({ page }) => {
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: `<script>
    parent.postMessage({type:'vetify-anatomy:navigate',path:'/services'}, 'http://localhost:5176');
    </script>` }))
  await page.route('http://localhost:5173/services', route => route.fulfill({contentType:'text/html',body:'<h1>Services</h1>'}))
  await page.goto('/')
  await expect(page).toHaveURL('http://localhost:5173/services')
})

test('the Anatomy host stops repeated authentication redirects', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('vetify-anatomy-handoff', String(Date.now())))
  await page.route('http://localhost:5173/anatomy**', route => route.fulfill({ contentType: 'text/html', body: `<script>
    parent.postMessage({type:'vetify-anatomy:authenticate'}, 'http://localhost:5176');
    </script>` }))
  await page.goto('/')
  await expect(page.locator('iframe')).toHaveAttribute('src', 'http://localhost:5173/anatomy?hosted=1&auth=failed')
  await expect(page).toHaveURL('http://localhost:5176/')
})
