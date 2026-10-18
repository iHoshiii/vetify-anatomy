export const MAIN_ORIGIN = import.meta.env.VITE_MAIN_ORIGIN || (import.meta.env.DEV ? 'http://localhost:5173' : 'https://vetify.page')

export function anatomyView(path: string) {
  const normalized = path.replace(/^\/anatomy(?=\/|$)/, '') || '/'
  return /^\/(dog|cat|bird)\/(skeletal|muscular|digestive|cardiovascular|nervous)$/.test(normalized) ? normalized : '/'
}

export function mainAnatomyUrl(path: string, failure: string | null = null) {
  const url = new URL('/anatomy', MAIN_ORIGIN)
  const view = anatomyView(path)
  if (view !== '/') url.searchParams.set('view', view)
  if (failure === 'failed' || failure === 'unavailable') url.searchParams.set('auth', failure)
  return url.href
}

export function notifyMain(type: 'authenticate' | 'ready') {
  window.parent.postMessage({ type: `vetify-anatomy:${type}` }, MAIN_ORIGIN)
}
