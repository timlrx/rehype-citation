// @ts-check
import { test, expect } from '@playwright/test'

test('should work in a client env', async ({ page }) => {
  await page.goto('http://localhost:3000')
  const locator = page.locator('id=citation')
  await expect(locator).toHaveText('[@Nash1950]')
  await expect(locator).toHaveText('(Nash, 1950)')
})
