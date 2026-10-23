import type { Page } from '@playwright/test'

export async function selectStructure(page: Page, title: string) {
  await page.getByRole('button', { name: 'Structures', exact: true }).click()
  await page.getByRole('combobox', { name: 'Search structures', exact: true }).fill(title)
  await page.getByRole('option', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click()
}
