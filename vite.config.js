import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
	plugins: [],
	define: { __APP_VERSION__: JSON.stringify(version) },
	server: { host: '0.0.0.0', port: 8000 },
	clearScreen: false,
	build: { chunkSizeWarningLimit: 1600 },
})
