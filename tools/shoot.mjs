import { chromium } from 'playwright'
const OUT = process.argv[2]
const shots = [
  { name: 'phone-closed',  w: 390, h: 844, acts: [] },
  { name: 'phone-fridge',  w: 390, h: 844, acts: ['[aria-label$="fridge"]'] },
  { name: 'phone-both',    w: 390, h: 844, acts: ['[aria-label$="fridge"]', '[aria-label$="cupboard"]'] },
  { name: 'desktop',       w: 1280, h: 900, acts: [] },
  { name: 'desktop-open',  w: 1280, h: 900, acts: ['[aria-label$="fridge"]', '[aria-label$="cupboard"]'] },
]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 })
  const errs = []
  page.on('console', m => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  for (const sel of s.acts) { await page.click(sel); await page.waitForTimeout(350) }
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${OUT}/${s.name}.png` })
  console.log(s.name, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok')
  await page.close()
}
await browser.close()
