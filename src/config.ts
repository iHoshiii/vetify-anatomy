const main = new URL(import.meta.env.VITE_MAIN_ORIGIN || 'http://localhost:5173')
if (!['https:', 'http:'].includes(main.protocol)) throw new Error('Invalid main origin')
export const MAIN_ORIGIN = main.origin
export const mainLink = (path: string) => new URL(path, MAIN_ORIGIN).href
