import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config'
import { handleApi } from './server/api'

/** Mounts the same API handlers the production server uses, so the key stays
 *  server-side in dev too and there is only one implementation to keep right. */
const api = () => ({
  name: 'basil-api',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (await handleApi(req, res)) return
      next()
    })
  },
  // `vite preview` serves the built app; give it the same API
  configurePreviewServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (await handleApi(req, res)) return
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), api()],
  server: { port: 5173 },
})
