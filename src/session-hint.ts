export const sessionHintKey = 'vetify-anatomy:last-session-check'
export const sessionHintLifetime = 5 * 60_000

// This timestamp restores the viewer layout; APIs still authorize every request.
export function hasSessionHint() {
  try {
    const checkedAt = Number(sessionStorage.getItem(sessionHintKey))
    const age = Date.now() - checkedAt
    return checkedAt > 0 && age >= 0 && age < sessionHintLifetime
  } catch { return false }
}

export function updateSessionHint(signedIn: boolean) {
  try {
    if (signedIn) sessionStorage.setItem(sessionHintKey, String(Date.now()))
    else sessionStorage.removeItem(sessionHintKey)
  } catch {}
}
