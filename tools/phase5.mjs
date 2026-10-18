import { chromium } from 'playwright'
const OUT = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const shoot = async (name, setup) => {
  const p = await b.newPage({ viewport: { width: 420, height: 980 }, deviceScaleFactor: 1 })
  const errs = []
  p.on('pageerror', e => errs.push(String(e)))
  p.on('console', m => m.type() === 'error' && errs.push(m.text()))
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await setup(p)
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${OUT}/${name}.png` })
  console.log(name, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok')
  await p.close()
}

const seed = (night) => async (p) => {
  await p.evaluate((n) => {
    const now = new Date().toISOString()
    const mk = (id, sprite, loc, shelf, pos) => ({
      id, name: id, displayName: id, category: 'other', location: loc,
      shelf, position: pos, amount: 'full', addedAt: now, spriteKey: sprite,
    })
    localStorage.setItem('basil.state.v1', JSON.stringify({
      version: 1,
      items: [
        mk('cheddar', 'food/cheese', 'fridge', 0, 0),
        mk('milk', 'food/milk', 'fridge', 0, 1),
        mk('ketchup', 'food/ketchup', 'fridge', 1, 0),
        mk('bread', 'food/paper-bag', 'cupboard', 0, 0),
      ],
      history: [], settings: { dietary: [], sound: false, lightOverride: n }, quickAdd: {},
    }))
  }, night)
  await p.reload({ waitUntil: 'networkidle' })
}

await shoot('p5-day', seed(0))
await shoot('p5-night', seed(1))
await shoot('p5-open', async p => {
  await seed(0.15)(p)
  await p.click('[aria-label$="fridge"]')
  await p.waitForTimeout(700)
})
await shoot('p5-credits', async p => {
  await seed(0)(p)
  await p.click('.credits__link')
})
await b.close()
