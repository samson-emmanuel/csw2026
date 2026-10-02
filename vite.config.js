import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Each build gets an id; open pages compare it with /version.json to pick up new deploys
const BUILD_ID = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    { name: 'version-file', generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ v: BUILD_ID }) }) } },
  ],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
})
