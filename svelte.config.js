import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: 'site', assets: 'site', strict: true }),
    alias: {
      '@/*': 'src/*'
    },
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/bloub-svelte' : ''
    }
  },
  compilerOptions: {
    runes: true
  }
}
