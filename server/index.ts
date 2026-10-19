import { createApp } from './app.js'
import { readConfig } from './config.js'

const config = readConfig()
const server = createApp(config).listen(config.port, config.production ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Anatomy auth/image service: http://127.0.0.1:${config.port}`)
  if (!config.configured) console.log('Vetify shared sign-in is unconfigured. Protected pictures remain inaccessible.')
})
process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
