import { createApp } from '../server/app'
import { readConfig } from '../server/config'

export default createApp(readConfig())
