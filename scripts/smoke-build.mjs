import { createApp } from '../server/app.ts'
import { readConfig } from '../server/config.ts'

const server = createApp(readConfig({})).listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
try {
  for (const path of ['/', '/bird/nervous', '/anatomy/cat/digestive']) {
    const response = await fetch(origin + path)
    if (!response.ok || !(await response.text()).includes('Vetify Anatomy')) throw new Error(`Broken built route: ${path}`)
  }
  const picture = await fetch(origin + '/anatomy/dog/dog-skeleton.png')
  if (picture.status !== 401 || !picture.headers.get('cache-control')?.includes('no-store')) {
    throw new Error('Built service exposes a protected picture')
  }
  console.log('Built service: nested UI routes work; anonymous picture access denied.')
} finally { await new Promise(resolve => server.close(resolve)) }
