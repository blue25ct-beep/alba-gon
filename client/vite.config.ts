import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const now = new Date()
const buildTimeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

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
