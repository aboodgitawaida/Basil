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

await p.fill('.addbar__input', 'two bags of milk and some cheddar')
await p.click('.addbar__go')
await p.waitForSelector('.parsed', { timeout: 8000 })
await p.screenshot({ path: `${OUT}/p3-preview.png` })
console.log('preview rows:', await p.locator('.parsed__row').count())
console.log('saved before confirm:', await p.evaluate(() =>
  (JSON.parse(localStorage.getItem('basil.state.v1') || '{"items":[]}').items || []).length))
await p.click('text=put it away')
await p.waitForTimeout(400)
console.log('saved after confirm:', await p.evaluate(() =>
  JSON.parse(localStorage.getItem('basil.state.v1')).items.length))
await p.click('.toast__undo')
await p.waitForTimeout(300)
console.log('after undo:', await p.evaluate(() =>
  JSON.parse(localStorage.getItem('basil.state.v1')).items.length))

// second submit hits the stub's prose reply, so the keyword matcher takes over
await p.fill('.addbar__input', 'bread, six eggs')
await p.click('.addbar__go')
await p.waitForSelector('.parsed', { timeout: 8000 })
const why = await p.locator('.sheet__dim').first().textContent()
console.log('fallback note:', why?.trim())
await p.screenshot({ path: `${OUT}/p3-fallback.png` })
console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
await b.close()
