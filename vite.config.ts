/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages serves this repo from /japanese-learning/. Getting this wrong
 * produces a blank page with a 404 on every asset — the single most likely
 * deployment failure here (CLAUDE.md §2). If the repository is ever renamed,
 * this and .github/workflows/deploy.yml change together.
 */
export default defineConfig({
  base: '/japanese-learning/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
