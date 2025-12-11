import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        // 强制所有环境使用 decode-named-character-reference 的纯 JS 版本
        'decode-named-character-reference': resolve(
          'node_modules/decode-named-character-reference/index.js'
        )
      }
    },
    plugins: [react()],
    worker: {
      format: 'es'
    }
  }
})
