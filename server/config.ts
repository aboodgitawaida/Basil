/**
 * The one file to edit when switching model providers.
 *
 * Set BASIL_PROVIDER in .env to pick one. Keys live in .env and are read here,
 * server-side only — nothing in this file is ever bundled into the browser.
 */

export type ProviderName = 'gemini' | 'groq'

export type ProviderConfig = {
  name: ProviderName
  /** Where the key comes from in .env */
  keyEnv: string
  /** API root. Overridable so the proxy can be pointed at a gateway, a
   *  self-hosted endpoint, or a stub in tests. */
  baseUrl: string
  /** Env var that overrides baseUrl */
  urlEnv: string
  model: string
  /** Hard ceiling on a single reply, so a runaway response can't hang a request */
  maxOutputTokens: number
  timeoutMs: number
}

export const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  gemini: {
    name: 'gemini',
    keyEnv: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    urlEnv: 'BASIL_GEMINI_URL',
    // Override with BASIL_MODEL if this name moves on.
    model: 'gemini-2.0-flash',
    maxOutputTokens: 2048,
    timeoutMs: 20_000,
  },
  groq: {
    name: 'groq',
    keyEnv: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    urlEnv: 'BASIL_GROQ_URL',
    model: 'llama-3.3-70b-versatile',
    maxOutputTokens: 2048,
    timeoutMs: 20_000,
  },
}

export function activeProvider(): ProviderConfig {
  const picked = (process.env.BASIL_PROVIDER ?? 'gemini') as ProviderName
  const base = PROVIDERS[picked] ?? PROVIDERS.gemini
  return {
    ...base,
    model: process.env.BASIL_MODEL ?? base.model,
    baseUrl: process.env[base.urlEnv] ?? base.baseUrl,
  }
}

export function apiKey(cfg: ProviderConfig): string | undefined {
  const key = process.env[cfg.keyEnv]
  return key && key.trim() ? key.trim() : undefined
}
