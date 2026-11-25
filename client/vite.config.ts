import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
const buildTimeStr = `${kst.getUTCFullYear()}.${String(kst.getUTCMonth() + 1).padStart(2, '0')}.${String(kst.getUTCDate()).padStart(2, '0')}_${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`

function generateVersionJsonPlugin(): Plugin {
  return {
    name: 'generate-version-json',
    buildStart() {
      const v = {
        version: pkg.version,
        buildTime: buildTimeStr,
        timestamp: Date.now()
      }
      try {
        writeFileSync(path.resolve(__dirname, 'public/version.json'), JSON.stringify(v, null, 2), 'utf8')
      } catch (e) {}
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), generateVersionJsonPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(buildTimeStr)
  }
})
