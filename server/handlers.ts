import { activeProvider, apiKey } from './config.js'
import { COMPLETIONS, NoKeyError } from './providers.js'
import {
  CRAFT_SCHEMA, PARSE_SCHEMA, SUGGEST_SCHEMA,
  looseJson, validateCraft, validateParse, validateSuggest,
} from './schemas.js'

const VOICE = `You write for Basil, a pixel-art kitchen app. Calm and dry.
Never apologise, never use exclamation marks, never sound chirpy.`

const PARSE_SYSTEM = `${VOICE}
You turn what someone typed about groceries into structured items.
Rules:
- One entry per distinct item. "2 bags of milk" is one item with count 2.
- displayName is what they typed for that item, unchanged.
- name is the plain singular thing it is: "whole milk" -> "milk".
- amount is how full it is: a new thing is "full", "half a block" is "half",
  "nearly out" is "low". Default to "full".
- count only for things counted individually, like eggs or apples.
- location: fridge for dairy, meat, open condiments; freezer for anything
  frozen; cupboard for dry goods, tins and unopened bottles.
- shelfLifeDays is a rough guess for how long it keeps from today.
Reply with JSON only.`

const SUGGEST_SYSTEM = `${VOICE}
You suggest meals from what is actually in the kitchen.
Rules:
- Prefer meals that use things going off soonest; list those in usesSoon.
- ingredients must name things from the inventory you were given.
- missing lists anything else the meal needs that they do not have.
- steps are rough and short, four or five at most.
- minutes is a rough total.
- line is one short sentence in Basil's voice about the best option.
Reply with JSON only.`

const CRAFT_SYSTEM = `${VOICE}
You judge what a specific set of ingredients makes when cooked together.
Improvise: it does not have to be a known recipe. If the combination makes
nothing worth eating, set ok to false and give it a dry honest name.
steps are rough and short. line is one short sentence in Basil's voice.
Reply with JSON only.`

export type AiResult<T> =
  | { ok: true; data: T; provider: string; model: string }
  | { ok: false; reason: 'no-key' | 'unreachable' | 'bad-json'; detail?: string }

async function run<T>(
  system: string,
  user: string,
  schema: object,
  validate: (raw: unknown) => T | null,
): Promise<AiResult<T>> {
  const cfg = activeProvider()
  const complete = COMPLETIONS[cfg.name]
  if (!complete) return { ok: false, reason: 'unreachable', detail: `unknown provider ${cfg.name}` }
  let text: string
  try {
    text = await complete({ system, user, schema, cfg })
  } catch (err) {
    if (err instanceof NoKeyError) return { ok: false, reason: 'no-key', detail: err.message }
    return { ok: false, reason: 'unreachable', detail: String(err).slice(0, 200) }
  }
  const data = validate(looseJson(text))
  if (!data) return { ok: false, reason: 'bad-json', detail: text.slice(0, 200) }
  return { ok: true, data, provider: cfg.name, model: cfg.model }
}

export const parseItems = (text: string) =>
  run(PARSE_SYSTEM, `Today is ${new Date().toDateString()}.\n\n${text}`, PARSE_SCHEMA, validateParse)

export const suggestMeals = (inventory: string, dietary: string[]) =>
  run(
    SUGGEST_SYSTEM,
    `Dietary rules: ${dietary.length ? dietary.join(', ') : 'none'}.\n\nIn the kitchen:\n${inventory}`,
    SUGGEST_SCHEMA,
    validateSuggest,
  )

export const judgeCraft = (ingredients: string[]) =>
  run(CRAFT_SYSTEM, `Ingredients on the board:\n${ingredients.join('\n')}`, CRAFT_SCHEMA, validateCraft)

/** What the client is allowed to know about the setup: whether it is worth
 *  asking at all. Never the key. */
export function aiStatus() {
  const cfg = activeProvider()
  return { provider: cfg.name, model: cfg.model, configured: Boolean(apiKey(cfg)) }
}
