import { activeProvider, apiKey } from './config.js'
import { COMPLETIONS, NoKeyError } from './providers.js'
import {
  PARSE_SCHEMA, SUGGEST_SCHEMA,
  looseJson, validateParse, validateSuggest,
} from './schemas.js'

const VOICE = `You write for Basil, a pixel-art kitchen app. Calm and dry.
Never apologise, never use exclamation marks, never sound chirpy.`

const PARSE_SYSTEM = `${VOICE}
You turn what someone typed about groceries into structured items.
Rules:
- One entry per distinct item. "2 bags of milk" is one item with count 2.
- name is the plain, lower-case, singular thing it is, with no quantity or
  container: "two eggs" -> "egg", "2 bags of whole milk" -> "milk",
  "half a block of mature cheddar" -> "cheddar".
- displayName is the label for the shelf: the thing itself in Title Case, with
  no numbers, containers or amounts. Plural only for things counted one by one.
  "two eggs" -> "Eggs", "2 bags of milk" -> "Milk", "a sourdough loaf" -> "Sourdough".
- count is how many, for anything: "two eggs" -> 2, "2 bags of milk" -> 2,
  "a dozen eggs" -> 12. Leave it out when no number was given.
- unit is the container a count is counted in, singular: bag, bottle, block,
  carton, tin, jar, pack, loaf. Leave it out for loose things like eggs.
- measure is a size that is not a count, as typed: "2 litres", "500g".
- kind is the general kind of food when name is a specific one: cheddar ->
  "cheese", sirloin -> "beef", basmati -> "rice", salmon -> "fish". Leave it
  out when name already is the general thing.
- amount is how full it is: a new thing is "full", "half a block" is "half",
  "nearly out" is "low". Default to "full".
- location: fridge for dairy, eggs, meat, fresh veg, open condiments; freezer
  for anything frozen; cupboard for dry goods, bread, tins and unopened bottles.
- shelfLifeDays is a rough guess for how long it keeps from today.
Reply with JSON only.`

const SUGGEST_SYSTEM = `${VOICE}
You suggest real meals someone can cook from what is in their kitchen.
Rules:
- Up to 6 meals. Each must use mainly things from the inventory. Assume salt,
  pepper, water and basic dried spices are always there.
- ingredients lists everything the meal needs with a quantity (qty), e.g.
  {"item":"egg","qty":"3 eggs"}. item is a plain lower-case singular food
  name. Mark extras that are nice but not needed as optional.
- Prefer meals that use things going off soonest.
- steps are a full recipe a beginner could follow: 4 to 8 clear steps with
  heat levels and times.
- serves is portions; kcal and protein (grams) are realistic estimates per
  serving. vegetarian/vegan must be accurate.
- note is one short line on why this one, in Basil's voice.
- line is one short sentence in Basil's voice about the best option.
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
    console.error(`[basil] ${cfg.name} call failed:`, String(err).slice(0, 500))
    return { ok: false, reason: 'unreachable', detail: publicDetail(cfg.name, err) }
  }
  const data = validate(looseJson(text))
  if (!data) {
    console.error(`[basil] ${cfg.name} reply failed validation:`, text.slice(0, 500))
    return { ok: false, reason: 'bad-json' }
  }
  return { ok: true, data, provider: cfg.name, model: cfg.model }
}

/** What the browser is told about a failed call: the provider's status code
 *  or "timeout", enough for the client to pick a message. Never the
 *  provider's own error text, which can name the account it belongs to. */
export function publicDetail(provider: string, err: unknown): string {
  const text = String(err)
  if (/abort|timeout/i.test(text)) return `${provider} timeout`
  const status = text.match(new RegExp(`${provider} (\\d{3})`))?.[1]
  return status ? `${provider} ${status}` : `${provider} unreachable`
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

/** What the client is allowed to know about the setup: whether it is worth
 *  asking at all. Never the key. */
export function aiStatus() {
  const cfg = activeProvider()
  return { provider: cfg.name, model: cfg.model, configured: Boolean(apiKey(cfg)) }
}
