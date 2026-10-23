import { test, expect } from './fixtures'
import dog from '../../src/data/dog'

test('quiz handles incorrect answers, study review, reveal, completion, and exit', async ({ signedInPage: page }, info) => {
  await page.goto('/dog/cardiovascular?embed=1')
  await page.getByRole('button', { name: 'Quiz me', exact: true }).click()
  const quiz = page.getByRole('region', { name: 'Anatomy quiz', exact: true })
  await expect(quiz).toBeVisible()
  await expect(page.getByRole('button', { name: 'Structures', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Heart', exact: true })).toHaveCount(0)
  const used = new Set<string>()
  for (let i = 0; i < dog.cardiovascular.length; i++) {
    const title = (await quiz.getByRole('heading').innerText()).replace(/^Find /, '')
    const target = dog.cardiovascular.find(spot => spot.title === title)!
    expect(used.has(target.id)).toBe(false)
    used.add(target.id)
    if (i === 0) {
      const wrong = dog.cardiovascular.find(spot => spot.id !== target.id)!
      await page.locator(`[data-structure-id="${wrong.id}"]`).click()
      await expect(quiz.getByRole('status')).toHaveText('Not quite. Try another dot.')
      await expect(page.locator('.study-note')).not.toBeVisible()
    }
    if (i === 1) {
      await quiz.getByRole('button', { name: 'Show answer', exact: true }).click()
      await expect(quiz.getByRole('status')).toContainText('Answer shown')
    } else {
      await page.locator(`[data-structure-id="${target.id}"]`).click()
      await expect(quiz.getByRole('status')).toContainText('Correct')
      await page.locator(`[data-structure-id="${target.id}"]`).click()
    }
    await expect(page.getByRole('region', { name: target.title, exact: true })).toBeVisible()
    await expect(page.getByLabel('Zoom level')).toHaveText('180%')
    if (i === 0) await page.screenshot({ path: `test-results/${info.project.name}-quiz.png`, fullPage: true })
    await quiz.getByRole('button', { name: i === dog.cardiovascular.length - 1 ? 'Finish' : 'Next part', exact: true }).click()
  }
  await expect(quiz.getByRole('heading')).toHaveText('3 of 4 found without revealing')
  await quiz.getByRole('button', { name: 'Exit quiz', exact: true }).click()
  await expect(quiz).not.toBeVisible()
  await expect(page.getByLabel('Zoom level')).toHaveText('100%')
  await expect(page.getByRole('button', { name: 'Heart', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Structures', exact: true })).toBeEnabled()
})

test('changing species exits an active quiz and resets the camera', async ({ signedInPage: page }) => {
  await page.goto('/dog/skeletal?embed=1')
  await page.getByRole('button', { name: 'Quiz me', exact: true }).click()
  await page.getByRole('button', { name: 'Show answer', exact: true }).click()
  await page.getByRole('button', { name: 'Cat', exact: true }).click()
  await expect(page.getByRole('img', { name: 'cat skeletal anatomy' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Anatomy quiz', exact: true })).not.toBeVisible()
  await expect(page.getByLabel('Zoom level')).toHaveText('100%')
  await expect(page.locator('.study-note')).not.toBeVisible()
})
