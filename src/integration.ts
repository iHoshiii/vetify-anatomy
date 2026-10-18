export const MAIN_ORIGIN = new URL(import.meta.env.VITE_MAIN_ORIGIN || (import.meta.env.DEV ? 'http://localhost:5173' : 'https://vetify.page')).origin

export function anatomyView(path: string) {
  const normalized = path.replace(/^\/anatomy(?=\/|$)/, '') || '/'
  return /^\/(dog|cat|bird)\/(skeletal|muscular|digestive|cardiovascular|nervous)$/.test(normalized) ? normalized : '/'
}

export function mainAnatomyUrl(path: string, failure: string | null = null) {
  const url = new URL('/anatomy', MAIN_ORIGIN)
  url.searchParams.set('hosted', '1')
  const view = anatomyView(path)
  if (view !== '/') url.searchParams.set('view', view)
  if (failure === 'failed' || failure === 'unavailable') url.searchParams.set('auth', failure)
  return url.href
}

export function notifyMain(type: 'authenticate' | 'ready') {
  window.parent.postMessage({ type: `vetify-anatomy:${type}` }, MAIN_ORIGIN)
}

export function mainDestination(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
  const url = new URL(path, MAIN_ORIGIN)
  return url.origin === new URL(MAIN_ORIGIN).origin ? url.href : null
}
