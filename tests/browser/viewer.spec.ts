import { test, expect } from './fixtures'
import { ANIMALS, BODY_SYSTEMS } from '../../src/types/anatomy'
import original from '../fixtures/source-hotspots.json' with { type: 'json' }

test('all 15 diagrams render and every hotspot stays aligned', async ({ signedInPage: page }, info) => {
  await page.goto('/?embed=1')
  for (const animal of ANIMALS) {
    await page.getByRole('button', { name: animal.name, exact: true }).click()
    for (const system of BODY_SYSTEMS) {
      await page.getByRole('button', { name: system.name, exact: true }).click()
      const image = page.getByRole('img', { name: `${animal.id} ${system.id} anatomy` })
      await expect(image).toBeVisible()
      await expect(page.getByText('Loading anatomy picture...')).not.toBeVisible()
      const pixels = await image.evaluate(element => {
        const img = element as HTMLImageElement
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let marked = 0
        for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0 && (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235)) marked++
        return marked
      })
      expect(pixels).toBeGreaterThan(500)
      const stage = await page.getByTestId('diagram-stage').boundingBox()
      expect(stage).not.toBeNull()
      for (const spot of original[animal.id][system.id]) {
        const button = page.getByRole('button', { name: spot.title, exact: true })
        const box = await button.boundingBox()
        expect(box).not.toBeNull()
        expect(Math.abs(box!.x + box!.width / 2 - (stage!.x + stage!.width * spot.x / 100))).toBeLessThan(1)
        expect(Math.abs(box!.y + box!.height / 2 - (stage!.y + stage!.height * spot.y / 100))).toBeLessThan(1)
        await page.getByRole('combobox', { name: 'Structure', exact: true }).selectOption(spot.id)
        await expect(page.getByRole('tooltip')).toContainText(spot.desc)
      }
      await page.getByRole('combobox', { name: 'Structure', exact: true }).selectOption('')
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    }
    await page.screenshot({ path: `test-results/${info.project.name}-${animal.id}.png`, fullPage: true })
  }
})

test('details stay hidden until selected and support keyboard and touch dismissal', async ({ signedInPage: page }, info) => {
  await page.goto('/bird/skeletal?embed=1')
  const beak = page.getByRole('button', { name: 'Beak (Rostrum)', exact: true })
  await expect(beak).toBeVisible()
  if (!info.project.use.hasTouch) {
    await beak.hover()
    await expect(page.getByRole('tooltip')).not.toBeVisible()
    await page.mouse.move(0, 0)
    await expect(page.getByRole('tooltip')).not.toBeVisible()
  }
  await page.getByRole('button', { name: 'Skull', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(beak).toBeFocused()
  await expect(page.getByRole('tooltip')).not.toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('tooltip')).toContainText('Beak (Rostrum)')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).not.toBeVisible()
  if (info.project.use.hasTouch) await beak.tap()
  else await beak.click()
  await expect(page.getByRole('tooltip')).toContainText('Beak (Rostrum)')
  if (info.project.use.hasTouch) await beak.tap()
  else await beak.click()
  await expect(page.getByRole('tooltip')).not.toBeVisible()
  await page.getByRole('combobox', { name: 'Structure', exact: true }).selectOption('beak')
  await expect(page.getByRole('tooltip')).toContainText('Beak (Rostrum)')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).not.toBeVisible()
})

test('zoom bounds and resizing preserve hotspot coordinates', async ({ signedInPage: page }, info) => {
  await page.goto('/cat/digestive?embed=1')
  await expect(page.getByRole('button', { name: 'Stomach', exact: true })).toBeVisible()
  for (let i = 0; i < 6; i++) {
    const button = page.getByRole('button', { name: 'Zoom in', exact: true })
    if (await button.isEnabled()) await button.click()
  }
  await expect(page.getByLabel('Zoom level')).toHaveText('200%')
  await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeDisabled()
  for (let i = 0; i < 9; i++) {
    const button = page.getByRole('button', { name: 'Zoom out', exact: true })
    if (await button.isEnabled()) await button.click()
  }
  await expect(page.getByLabel('Zoom level')).toHaveText('50%')
  await expect(page.getByRole('button', { name: 'Zoom out', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click()
  await expect(page.getByLabel('Zoom level')).toHaveText('100%')
  await page.setViewportSize({ width: 360, height: 740 })
  await page.waitForTimeout(100)
  const stage = await page.getByTestId('diagram-stage').boundingBox()
  const spot = await page.getByRole('button', { name: 'Stomach', exact: true }).boundingBox()
  expect(Math.abs(spot!.x + spot!.width / 2 - stage!.x - stage!.width * .51)).toBeLessThan(1)
  await page.screenshot({ path: `test-results/${info.project.name}-resized.png`, fullPage: true })
})

test('embedded deep links and refresh retain the selection without a duplicate navbar', async ({ signedInPage: page }) => {
  await page.goto('/anatomy/bird/nervous?embed=1')
  await expect(page.getByRole('button', { name: 'Bird', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Nervous System', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('img', { name: 'bird nervous anatomy' })).toBeVisible()
  await expect(page.getByRole('banner')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sign in with Vetify' })).toHaveCount(0)
})
