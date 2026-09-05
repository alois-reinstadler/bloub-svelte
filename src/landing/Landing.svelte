<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { base } from '$app/paths'
  import App from '../App.svelte'
  import { createJourney, type Journey } from './journey'

  const install = 'pnpm add bloub-svelte'

  let heroPin: HTMLElement
  let oSlot: HTMLElement
  let anneau: HTMLElement
  let docsSection: HTMLElement
  let studioSection: HTMLElement
  let section = $state<'hero' | 'docs' | 'studio'>('hero')
  // Posee dans la grille du studio : le voyage (journey.ts) le decide, seul a
  // savoir ou finit la timeline de defilement.
  let arrived = $state(false)
  let copied = $state<string | null>(null)

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    copied = id
    window.setTimeout(() => { if (copied === id) copied = null }, 1600)
  }

  onMount(() => {
    let frame = 0
    // La section courante ne pilote plus que le DECOR : barre qui s'efface,
    // anneau qui parait, halo du guetteur, expression de la boule. Le
    // mouvement, lui, est au defilement pres dans journey.ts.
    const update = () => {
      frame = 0
      const studioTop = studioSection.getBoundingClientRect().top
      const docsTop = docsSection.getBoundingClientRect().top
      section = studioTop < innerHeight * 0.62 ? 'studio' : docsTop < innerHeight ? 'docs' : 'hero'
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()

    let voyage: Journey | null = createJourney({
      heroPin,
      oSlot,
      anneau,
      studio: studioSection,
      onArrive: (posee) => {
        arrived = posee
        // Au redecollage, la classe fixe doit etre PEINTE avec la pose
        // d'atterrissage avant que le scrub reprenne la main.
        if (!posee) tick().then(() => voyage?.reset())
      }
    })

    addEventListener('scroll', onScroll, { passive: true })
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); voyage?.destroy(); voyage = null }
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

  <main>
    <section class="hero-section" id="top">
      <div class="hero-pin" bind:this={heroPin}>
        <p class="eyebrow">Animierter SVG-Avatar für Svelte 5</p>
        <h1 class="hero-word" aria-label="bloub">
          <span aria-hidden="true">bl</span><span class="o-slot" aria-hidden="true" bind:this={oSlot}><span class="o-ring"></span></span><span aria-hidden="true">ub</span>
        </h1>
        <p class="hero-claim"><b>Eine Form.</b> <em>Viele Gefühle.</em></p>
        <p class="lede">bloub bringt Charakter in dein Interface – als anpassbare, flüssig animierte Svelte-Komponente.</p>
        <div class="hero-actions">
          <a class="primary-action" href="#studio">Im Studio gestalten <span aria-hidden="true">↓</span></a>
          <a class="text-action" href="#docs">Erst installieren</a>
        </div>
        <div class="facts"><span><b>8</b> Zustände</span><span><b>11</b> Ausdrücke</span><span><b>0</b> Abhängigkeiten</span></div>
      </div>
    </section>

    <section class="docs-section" id="docs" bind:this={docsSection}>
      <div class="docs-ring" aria-hidden="true" bind:this={anneau}></div>
      <div class="section-copy docs-copy">
        <p class="eyebrow">Installation</p>
        <h2>In zwei Minuten<br /><em>zum Leben erweckt.</em></h2>
        <p class="docs-intro">Native Svelte-Komponente, vollständig typisiert. Keine Provider, keine globale CSS-Datei und kein Animations-Framework.</p>

        <article class="doc-step">
          <div class="step-title"><span>01</span><h3>Paket installieren</h3></div>
          <div class="install-command"><code>{install}</code><button type="button" onclick={() => copy(install, 'install')}>{copied === 'install' ? 'Kopiert' : 'Kopieren'}</button></div>
        </article>

        <article class="doc-step">
          <div class="step-title"><span>02</span><h3>Komponente verwenden</h3></div>
          <div class="usage-code">
            <div><span>Avatar.svelte</span><button type="button" onclick={() => copy(`<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n<\/script>\n\n<Bloub expression="curious" lookAt="cursor" playing />`, 'usage')}>{copied === 'usage' ? 'Kopiert' : 'Kopieren'}</button></div>
            <pre><code><b>&lt;script</b> <i>lang</i>=<q>"ts"</q><b>&gt;</b>
  <strong>import</strong> {'{'} Bloub {'}'} <strong>from</strong> <q>'bloub-svelte'</q>
<b>&lt;/script&gt;</b>

<b>&lt;Bloub</b> <i>expression</i>=<q>"curious"</q> <i>lookAt</i>=<q>"cursor"</q> <i>playing</i> <b>/&gt;</b></code></pre>
          </div>
        </article>

        <a class="api-link" href={`${base}/feedback/`}>Feedback-Labor öffnen <span aria-hidden="true">→</span></a>
        <a class="api-link api-link--secondary" href="https://github.com/alois-reinstadler/bloub-svelte#komponente">Vollständige API auf GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="studio-section" id="studio" bind:this={studioSection}>
      <App embedded journey={!arrived} journeySection={section} />
    </section>
  </main>
</div>
