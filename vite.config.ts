import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  base: './',
  // Le port est ici et pas seulement dans `.claude/launch.json` : c'est celui que
  // le README annonce, il doit donc valoir pour un `pnpm dev` nu.
  server: { port: 5190 },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
