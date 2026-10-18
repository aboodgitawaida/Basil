import { apiKey, type ProviderConfig } from './config.js'

/** Everything a provider has to do: take a system prompt, a user prompt and a
 *  JSON schema, and come back with a string that should parse as JSON. */
export type Complete = (args: {
  system: string
  user: string
  schema: object
  cfg: ProviderConfig
}) => Promise<string>

export class NoKeyError extends Error {
  constructor(public envName: string) {
    super(`no ${envName} set`)
  }
}

async function withTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctl.signal })
  } finally {
    clearTimeout(t)
  }
}

const gemini: Complete = async ({ system, user, schema, cfg }) => {
  const key = apiKey(cfg)
  if (!key) throw new NoKeyError(cfg.keyEnv)
  const url = `${cfg.baseUrl}/models/${cfg.model}:generateContent`
  const res = await withTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: cfg.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  }, cfg.timeoutMs)
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const body: any = await res.json()
  const text = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? ''
  if (!text) throw new Error('gemini returned no text')
  return text
}

const groq: Complete = async ({ system, user, schema, cfg }) => {
  const key = apiKey(cfg)
  if (!key) throw new NoKeyError(cfg.keyEnv)
  const res = await withTimeout(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.2,
      max_tokens: cfg.maxOutputTokens,
      response_format: { type: 'json_object' },
      messages: [
        // Groq's JSON mode has no schema parameter, so the shape goes in the prompt
        { role: 'system', content: `${system}\n\nReply with JSON matching this schema exactly:\n${JSON.stringify(schema)}` },
        { role: 'user', content: user },
      ],
    }),
  }, cfg.timeoutMs)
  if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const body: any = await res.json()
  const text = body?.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('groq returned no text')
  return text
}

export const COMPLETIONS: Record<string, Complete> = { gemini, groq }
