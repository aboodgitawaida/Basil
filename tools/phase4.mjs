import { chromium } from 'playwright'
const OUT = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 420, height: 980 }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', e => errs.push(String(e)))
p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })

// seed directly so the test is about crafting, not parsing
await p.evaluate(() => {
  const now = new Date().toISOString()
  const mk = (n, sprite, loc, shelf, pos) => ({
    id: n, name: n, displayName: n, category: 'other', location: loc,
    shelf, position: pos, amount: 'full', addedAt: now, spriteKey: sprite,
  })
  localStorage.setItem('basil.state.v1', JSON.stringify({
    version: 1,
    items: [mk('bread', 'food/paper-bag', 'cupboard', 0, 0), mk('cheddar', 'food/cheese', 'fridge', 0, 0)],
    history: [], settings: { dietary: [], sound: false, lightOverride: null }, quickAdd: {},
  }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.click('[aria-label$="fridge"]'); await p.waitForTimeout(600)
await p.click('[aria-label$="cupboard"]'); await p.waitForTimeout(600)

// the board only exists while a drag is in flight, so the slot is located
// after the drag has started
const drag = async (label, slot) => {
  const a = await p.locator(`[aria-label="${label}"]`).first().boundingBox()
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await p.mouse.down()
  await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 4 })
  const c = await p.locator(`[data-craft-slot="${slot}"]`).boundingBox()
  await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 8 })
  await p.mouse.up()
  await p.waitForTimeout(250)
}
await drag('cheddar', 0)
await drag('bread', 1)
await p.waitForTimeout(1200)
console.log('output:', (await p.locator('.craftpanel__text p').first().textContent())?.trim())
await p.screenshot({ path: `${OUT}/p4-board.png` })

const cookBtn = p.locator('.craftpanel__acts button', { hasText: 'cook' })
console.log('cook button count:', await cookBtn.count(), 'disabled:', await cookBtn.isDisabled())
await cookBtn.click()
await p.waitForTimeout(700)
const after = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('basil.state.v1'))
  return { history: s.history.map(h => h.name), amounts: s.items.map(i => `${i.name}:${i.amount}`) }
})
console.log('history:', after.history.join(', '), '| ingredients now:', after.amounts.join(', '))
await p.click('text=book')
await p.waitForTimeout(1200)
await p.screenshot({ path: `${OUT}/p4-book.png` })
console.log('book rows:', await p.locator('.book__row').count())
console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
await b.close()
