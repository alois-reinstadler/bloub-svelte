<script lang="ts">
  import { onMount } from 'svelte'
  import { base } from '$app/paths'
  import App from '../App.svelte'
  import Bloub from '../lib/Bloub.svelte'
  import type { ExpressionId } from '../lib'

  const install = 'pnpm add bloub-svelte'
  const usage = `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n<\/script>\n\n<Bloub expression="curious" playing />`

  let docsSection: HTMLElement
  let studioSection: HTMLElement
  let section = $state<'hero' | 'docs' | 'studio'>('hero')
  let copied = $state<string | null>(null)
  let expression = $derived<ExpressionId>(section === 'docs' ? 'attentive' : section === 'studio' ? 'happy' : 'curious')

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    copied = id
    window.setTimeout(() => { if (copied === id) copied = null }, 1600)
  }

  onMount(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const studioTop = studioSection.getBoundingClientRect().top
      const docsTop = docsSection.getBoundingClientRect().top
      section = studioTop < innerHeight * 0.62 ? 'studio' : docsTop < innerHeight * 0.55 ? 'docs' : 'hero'
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  })
</script>

<div class="one-page" data-section={section}>
  <header class="site-nav">
    <a class="site-brand" href={`${base}/`} aria-label="bloub Startseite"><img src={`${base}/favicon.svg`} alt="" /><span>bloub</span></a>
    <nav aria-label="Seitennavigation">
      <a href="#docs">Installation</a>
      <a class="nav-studio" href="#studio">Studio öffnen <span aria-hidden="true">↓</span></a>
    </nav>
  </header>

  <div class="scroll-companion" aria-hidden="true">
    <div class="companion-grid"></div>
    <p>{section === 'docs' ? 'BEREIT FÜR DEIN PROJEKT' : 'REAGIERT AUF DICH'}</p>
    <div class="companion-avatar"><Bloub size={520} {expression} playing follow={section === 'hero'} /></div>
    <span>{section === 'docs' ? 'AUFMERKSAM' : 'NEUGIERIG'}</span>
  </div>

  <main>
    <section class="hero-section" id="top">
      <div class="section-copy hero-copy">
        <p class="eyebrow"><span></span>Animierter SVG-Avatar für Svelte 5</p>
        <h1>Eine Form.<br /><em>Viele Gefühle.</em></h1>
        <p class="lede">bloub bringt Charakter in dein Interface – als anpassbare, flüssig animierte Svelte-Komponente.</p>
        <div class="hero-actions">
          <a class="primary-action" href="#studio">Im Studio gestalten <span aria-hidden="true">↓</span></a>
          <a class="text-action" href="#docs">Erst installieren</a>
        </div>
        <div class="facts"><span><b>14</b> Zustände</span><span><b>8</b> Formen</span><span><b>0</b> Abhängigkeiten</span></div>
      </div>
    </section>

    <section class="docs-section" id="docs" bind:this={docsSection}>
      <div class="section-copy docs-copy">
        <p class="eyebrow"><span></span>Installation</p>
        <h2>In zwei Minuten<br /><em>zum Leben erweckt.</em></h2>
        <p class="docs-intro">Native Svelte-Komponente, vollständig typisiert. Keine Provider, keine globale CSS-Datei und kein Animations-Framework.</p>

        <article class="doc-step">
          <div class="step-title"><span>01</span><h3>Paket installieren</h3></div>
          <div class="install-command"><code>{install}</code><button type="button" onclick={() => copy(install, 'install')}>{copied === 'install' ? 'Kopiert' : 'Kopieren'}</button></div>
        </article>

        <article class="doc-step">
          <div class="step-title"><span>02</span><h3>Komponente verwenden</h3></div>
          <div class="usage-code">
            <div><span>Avatar.svelte</span><button type="button" onclick={() => copy(usage.replace('<\\/script>', '</script>'), 'usage')}>{copied === 'usage' ? 'Kopiert' : 'Kopieren'}</button></div>
            <pre><code><b>&lt;script</b> <i>lang</i>=<q>"ts"</q><b>&gt;</b>
  <strong>import</strong> {'{'} Bloub {'}'} <strong>from</strong> <q>'bloub-svelte'</q>
<b>&lt;/script&gt;</b>

<b>&lt;Bloub</b> <i>expression</i>=<q>"curious"</q> <i>playing</i> <b>/&gt;</b></code></pre>
          </div>
        </article>

        <a class="api-link" href="https://github.com/alois-reinstadler/bloub-svelte#komponente">Vollständige API auf GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="studio-section" id="studio" bind:this={studioSection}>
      <div class="studio-label"><span>03</span><div><p>Dein bloub</p><h2>Jetzt bist du dran.</h2></div></div>
      <App embedded />
    </section>
  </main>
</div>
