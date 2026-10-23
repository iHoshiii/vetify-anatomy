import { test, expect } from './fixtures'

test('dragging pans without opening a note and reset restores the view', async ({ signedInPage: page }) => {
  await page.goto('/dog/skeletal?embed=1')
  const skull = page.getByRole('button', { name: 'Skull (Cranium)', exact: true })
  await expect(skull).toBeVisible()
  const before = (await page.getByTestId('diagram-stage').boundingBox())!
  const box = (await skull.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 35, { steps: 8 })
  await page.mouse.up()
  const after = (await page.getByTestId('diagram-stage').boundingBox())!
  expect(after.x - before.x).toBeGreaterThan(35)
  expect(after.y - before.y).toBeGreaterThan(25)
  await expect(page.locator('.study-note')).not.toBeVisible()
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click()
  const reset = (await page.getByTestId('diagram-stage').boundingBox())!
  expect(Math.abs(reset.x - before.x)).toBeLessThan(1)
  expect(Math.abs(reset.y - before.y)).toBeLessThan(1)
})

test('wheel and keyboard zoom and pan stay bounded', async ({ signedInPage: page }) => {
  await page.goto('/dog/skeletal?embed=1')
  await expect(page.locator('.hotspot').first()).toBeVisible()
  const canvas = page.getByRole('group', { name: 'Anatomy canvas', exact: true })
  await canvas.hover({ position: { x: 20, y: 20 } })
  await page.mouse.wheel(0, -500)
  await expect.poll(async () => Number((await page.getByLabel('Zoom level').innerText()).replace('%', ''))).toBeGreaterThan(100)
  await page.mouse.wheel(0, -5000)
  await expect(page.getByLabel('Zoom level')).toHaveText('300%')
  await canvas.focus()
  const before = (await page.getByTestId('diagram-stage').boundingBox())!
  await page.keyboard.press('ArrowRight')
  expect((await page.getByTestId('diagram-stage').boundingBox())!.x).toBeLessThan(before.x)
  await page.keyboard.press('Home')
  await expect(page.getByLabel('Zoom level')).toHaveText('100%')
  await page.keyboard.press('+')
  await expect(page.getByLabel('Zoom level')).toHaveText('120%')
  await page.keyboard.press('-')
  await expect(page.getByLabel('Zoom level')).toHaveText('100%')
})

test('two-finger touch gestures zoom without selecting a part', async ({ signedInPage: page, context }, info) => {
  test.skip(!info.project.use.hasTouch, 'Requires a touch viewport')
  await page.goto('/dog/skeletal?embed=1')
  await expect(page.locator('.hotspot').first()).toBeVisible()
  const box = (await page.getByRole('group', { name: 'Anatomy canvas', exact: true }).boundingBox())!
  const session = await context.newCDPSession(page)
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const points = (spread: number) => [{ x: center.x - spread, y: center.y, id: 0 }, { x: center.x + spread, y: center.y, id: 1 }]
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(30) })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(60) })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => Number((await page.getByLabel('Zoom level').innerText()).replace('%', ''))).toBeGreaterThan(150)
  await expect(page.locator('.study-note')).not.toBeVisible()
  await session.detach()
})
