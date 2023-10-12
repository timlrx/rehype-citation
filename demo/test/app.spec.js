// @ts-check
import { test, expect } from '@playwright/test'

test('should work in a client env', async ({ page }) => {
  await page.goto('http://localhost:5173')
  const locator = page.locator('id=results')
  await expect(locator).toContainText('(Nash, 1950, pp. iv, vi–xi, (xv)-(xvii))')
})
