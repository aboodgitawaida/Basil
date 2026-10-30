// Takes the README screenshots and the demo GIF frames from the built app.
// `npm run build && npm run screenshots`, then `python3 -I tools/gif.py`.
import { mkdir } from 'node:fs/promises'
import { URL, launch, serve, strictPage } from './browser.mjs'

const OUT = 'docs'
const FRAMES = 'docs/frames'
await mkdir(FRAMES, { recursive: true })
const server = await serve()
const browser = await launch()
const size = { width: 1440, height: 900 }
const shop = 'six eggs, 2 bags of milk, cheddar, butter, ketchup, broccoli, chicken breasts x2, steak, apples, frozen peas, bread, a bag of rice, pasta, tin of tomatoes'

try {
  // stills
  {
    const { page } = await strictPage(browser, size, '2026-10-19T10:10:00')
    await page.goto(URL + '?season=autumn')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/title.png` })
    await page.getByRole('button', { name: 'Start' }).click()
    await page.getByLabel('Add to the kitchen').fill(shop)
    await page.keyboard.press('Enter')
    // the doors open by themselves to show where things went; let Basil's
    // remark and the undo note clear so the room is visible
    await page.waitForTimeout(1200)
    if (await page.locator('.basilsay').count()) await page.locator('.basilsay').click()
    await page.waitForTimeout(6500)
    await page.screenshot({ path: `${OUT}/kitchen.png` })
    // the link preview: the same room with the menus hidden; gif.py adds the title
    await page.addStyleTag({ content: '.hud, .toast { visibility: hidden !important; }' })
    await page.screenshot({ path: `${FRAMES}/og-kitchen.png` })
    await page.addStyleTag({ content: '.hud, .toast { visibility: visible !important; }' })
    await page.getByRole('button', { name: 'Ask Basil what you can cook' }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/cookbook.png` })
    await page.getByRole('button', { name: /Scrambled eggs on toast/ }).first().click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${OUT}/recipe.png` })
    await page.close()
  }
  for (const [season, time] of [['spring', '2026-04-10T09:30:00'], ['summer', '2026-07-10T13:00:00'], ['autumn', '2026-10-19T17:40:00'], ['winter', '2026-12-20T21:30:00']]) {
    const { page } = await strictPage(browser, size, time)
    await page.goto(URL + `?season=${season}`)
    await page.getByRole('button', { name: 'Start' }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${FRAMES}/season-${season}.png` })
    await page.close()
  }

  // the GIF: type, it lands, Basil wakes and stretches, a recipe
  {
    const { page } = await strictPage(browser, size, '2026-10-19T11:00:00')
    await page.goto(URL + '?season=autumn')
    let n = 0
    const snap = async (hold = 1) => { for (let i = 0; i < hold; i++) await page.screenshot({ path: `${FRAMES}/demo-${String(n++).padStart(3, '0')}.png` }) }
    await snap(6)
    await page.getByRole('button', { name: 'Start' }).click()
    await page.waitForTimeout(400)
    await snap(3)
    const input = page.getByLabel('Add to the kitchen')
    const text = 'two eggs, milk, cheddar, bread, broccoli'
    for (let i = 4; i <= text.length; i += 4) { await input.fill(text.slice(0, i)); await snap() }
    await input.fill(text)
    await snap(2)
    await page.keyboard.press('Enter')
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(90); await snap() }
    await snap(8)
    await page.getByRole('button', { name: 'Ask Basil what you can cook' }).click()
    for (let i = 0; i < 8; i++) { await page.waitForTimeout(120); await snap() }
    await snap(6)
    await page.getByRole('button', { name: /Cheese omelette|Cheese on toast/ }).first().click()
    await page.waitForTimeout(200)
    await snap(10)
    await page.close()
  }
  console.log('screenshots written to docs/')
} finally {
  await browser.close()
  server.kill()
}
// the preview server's own child process would otherwise keep node alive
process.exit(0)
