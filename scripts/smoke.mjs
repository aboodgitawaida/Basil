// End-to-end smoke test: the core loop, in a real browser, against the built
// app. Run with `npm run smoke` (after `npm run build`).
import assert from 'node:assert/strict'
import { URL, launch, serve, strictPage } from './browser.mjs'

const server = await serve()
const browser = await launch()
let failed = false
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { page, errors } = await strictPage(browser, viewport, '2026-10-19T12:00:00')
    await page.goto(URL)

    await page.getByRole('button', { name: 'Start' }).click()
    await page.getByLabel('Add to the kitchen').fill('two eggs, bread, cheddar')
    await page.keyboard.press('Enter')

    // one step: it is on the shelf, the fridge opened to show it, undo is offered
    await page.getByRole('status').filter({ hasText: 'Put Eggs, Bread and Cheddar away.' }).waitFor()
    await page.getByRole('button', { name: 'Eggs ×2' }).waitFor()
    await page.getByRole('button', { name: 'Close the fridge' }).first().waitFor()

    // Basil's cookbook has something to make, with nutrition
    await page.getByRole('button', { name: 'Ask Basil what you can cook' }).click()
    await page.getByText('Ready to cook').waitFor()
    await page.getByRole('button', { name: /Cheese on toast/ }).click()
    await page.getByText('kcal each').waitFor()
    await page.getByRole('button', { name: 'cook it' }).click()
    await page.getByRole('status').filter({ hasText: 'Cooked cheese on toast.' }).waitFor()

    // the shopping list: add, tick, and it is in the kitchen
    await page.getByRole('button', { name: /^list/ }).click()
    await page.getByLabel('Add to the shopping list').fill('two lemons')
    await page.keyboard.press('Enter')
    await page.getByRole('checkbox').first().click()
    await page.getByText('In the kitchen now').waitFor()

    assert.deepEqual(errors, [], `console errors at ${viewport.width}px`)
    console.log(`ok  ${viewport.width}x${viewport.height}`)
    await page.close()
  }
} catch (err) {
  failed = true
  console.error(err)
} finally {
  await browser.close()
  server.kill()
}
process.exit(failed ? 1 : 0)
