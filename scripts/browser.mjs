// Shared by the smoke test and the screenshot script: build, serve the built
// app with `vite preview`, and hand back a Playwright browser.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

export const PORT = 4317
export const URL = `http://localhost:${PORT}/`

export async function serve() {
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL)).ok) return proc } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 250))
  }
  proc.kill()
  throw new Error('vite preview did not start')
}

export function launch() {
  // CHROMIUM_PATH lets a machine with its own Chromium skip `playwright install`
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
}

/** A page that fails the run on any console error or uncaught exception. */
export async function strictPage(browser, viewport, time) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => {
    // the API is absent without a key; the app falls back, so its 4xx/5xx is expected
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text())
  })
  if (time) await page.clock.install({ time: new Date(time) })
  return { page, errors }
}
