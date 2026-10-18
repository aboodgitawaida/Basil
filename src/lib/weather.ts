export type Sky = 'clear' | 'cloud' | 'rain' | 'snow'

/** Open-Meteo WMO codes, collapsed to the four things the window can draw. */
function fromCode(code: number): Sky {
  if (code >= 71 && code <= 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain'
  if (code >= 1 && code <= 48) return 'cloud'
  return 'clear'
}

/** Weather is decoration. Any failure — no permission, no network, a bad
 *  response — comes back as a clear sky rather than an error. */
export async function fetchSky(lat?: number, lon?: number): Promise<Sky> {
  try {
    const here = lat !== undefined && lon !== undefined
      ? { lat, lon }
      : await browserPosition()
    if (!here) return 'clear'
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${here.lat}&longitude=${here.lon}&current=weather_code`
    const res = await fetch(url)
    if (!res.ok) return 'clear'
    const body = await res.json()
    const code = body?.current?.weather_code
    return typeof code === 'number' ? fromCode(code) : 'clear'
  } catch {
    return 'clear'
  }
}

function browserPosition(): Promise<{ lat: number; lon: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null)
    const done = (v: { lat: number; lon: number } | null) => resolve(v)
    const t = window.setTimeout(() => done(null), 4000)
    navigator.geolocation.getCurrentPosition(
      pos => { window.clearTimeout(t); done({ lat: pos.coords.latitude, lon: pos.coords.longitude }) },
      () => { window.clearTimeout(t); done(null) },
      { timeout: 4000, maximumAge: 1_800_000 },
    )
  })
}
