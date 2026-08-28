import { fileURLToPath, URL } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  /*
   * Le plugin Svelte est la pour un seul FICHIER, `ui/capture.test.ts` : il monte `BloubBot.svelte`
   * parce que le rendu exporte doit etre celui du composant, pas un second dessin monte a
   * cote. Sans le plugin, importer `capture.ts` suffit a faire echouer la collecte.
   *
   * `conditions: ['browser']` est necessaire pour que Vitest resolve l'entree client de
   * Svelte dans happy-dom ; son entree serveur refuse volontairement `mount()`.
   *
   * Le plugin ne change rien aux autres : `src/bot/` n'importe aucun `.svelte`, et l'environnement
   * reste `node` par defaut — un DOM se demande fichier par fichier, en tete de celui qui en
   * a besoin (`// @vitest-environment happy-dom`). C'est ce qui garde la suite a quelques
   * secondes.
   */
  plugins: [svelte()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    conditions: ['browser']
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
