import { chromium } from 'playwright'
const OUT = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', e => errs.push(String(e)))
p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })
await p.fill('.addbar__input', 'two bags of milk, bread, half a block of cheddar, ketchup, six eggs, frozen peas')
await p.click('.addbar__go')
await p.waitForTimeout(400)
await p.click('[aria-label$="fridge"]'); await p.waitForTimeout(600)
await p.click('[aria-label$="cupboard"]'); await p.waitForTimeout(600)
await p.screenshot({ path: `${OUT}/p2-open.png` })

// drag the ketchup out of the fridge and into the open cupboard
const ket = await p.locator('[aria-label="ketchup"]').boundingBox()
const pantry = await p.locator('[aria-label$="cupboard"]').boundingBox()
await p.mouse.move(ket.x + ket.width / 2, ket.y + ket.height / 2)
await p.mouse.down()
await p.mouse.move(pantry.x + pantry.width / 2, pantry.y + pantry.height / 2, { steps: 12 })
await p.waitForTimeout(150)
await p.screenshot({ path: `${OUT}/p2-drag.png` })
await p.mouse.up()
await p.waitForTimeout(400)
const moved = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('basil.state.v1'))
  const k = s.items.find(i => i.name === 'ketchup')
  return k ? `${k.name} is now in the ${k.location}` : 'ketchup missing'
})
console.log(moved)
await p.screenshot({ path: `${OUT}/p2-moved.png` })
console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
await b.close()
