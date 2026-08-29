<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { base } from '$app/paths'
  import App from '../App.svelte'

  const install = 'pnpm add bloub-svelte'

  let pageEl: HTMLElement
  let heroPin: HTMLElement
  let oSlot: HTMLElement
  let docsSection: HTMLElement
  let studioSection: HTMLElement
  let section = $state<'hero' | 'docs' | 'studio'>('hero')
  // Une fois pose dans le studio, l'avatar quitte le voyage et REVIENT dans la
  // grille : c'est ce qui rend a la vue Reglages sa boule geante et a l'apercu
  // son centrage — un element fixe ignorerait les deux.
  let arrived = $state(false)
  let copied = $state<string | null>(null)

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    copied = id
    window.setTimeout(() => { if (copied === id) copied = null }, 1600)
  }

  onMount(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let landing: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      frame = 0
      const studioTop = studioSection.getBoundingClientRect().top
      const docsTop = docsSection.getBoundingClientRect().top
      // Le heros bascule des que l'installation ENTRE dans la fenetre : c'est
      // l'instant exact ou le titre epingle se remet a defiler, donc la boule
      // quitte le mot pendant qu'il est encore entierement visible — sinon le o
      // fantome ne se revele jamais qu'hors champ.
      const next: typeof section = studioTop < innerHeight * 0.62 ? 'studio' : docsTop < innerHeight ? 'docs' : 'hero'
      if (next === section) return
      clearTimeout(landing)
      if (arrived && next !== 'studio') {
        // Redecollage en deux temps : reprendre d'abord la position fixe du
        // studio (identique au pixel, donc invisible), laisser le navigateur la
        // PEINDRE, et seulement ensuite viser la nouvelle section. En un seul
        // temps, `top`/`left` partent de `auto` — non interpolable — et la
        // boule saute au lieu de voler.
        arrived = false
        tick().then(() => requestAnimationFrame(() => requestAnimationFrame(() => { section = next })))
        return
      }
      section = next
      // Le retour a la grille attend la fin du vol (0,9 s) ; sans mouvement il
      // n'y a rien a attendre.
      if (next === 'studio') landing = setTimeout(() => (arrived = true), calm.matches ? 0 : 950)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }

    /*
     * La lettre vivante : l'avatar du voyage est un element fixe, la lettre o un
     * trou dans le titre. On mesure donc le trou et on publie ses coordonnees en
     * variables CSS — par rapport au bloc EPINGLE (sticky), dont la position a
     * l'ecran est connue, pour que la mesure ne depende pas du defilement.
     */
    const measure = () => {
      const pin = heroPin.getBoundingClientRect()
      const o = oSlot.getBoundingClientRect()
      pageEl.style.setProperty('--o-x', `${o.left + o.width / 2 - pin.left}px`)
      pageEl.style.setProperty('--o-y', `${o.top + o.height / 2 - pin.top}px`)
      pageEl.style.setProperty('--o-w', `${o.width}px`)
    }
    measure()
    // La police d'affichage arrive apres coup et change la metrique du titre.
    document.fonts?.ready.then(measure)
    const onResize = () => { onScroll(); measure() }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onResize)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); cancelAnimationFrame(frame); clearTimeout(landing) }
  })
</script>

<div class="one-page" data-section={section} bind:this={pageEl}>
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
        <div class="facts"><span><b>14</b> Zustände</span><span><b>8</b> Formen</span><span><b>0</b> Abhängigkeiten</span></div>
      </div>
    </section>

    <section class="docs-section" id="docs" bind:this={docsSection}>
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

        <a class="api-link" href="https://github.com/alois-reinstadler/bloub-svelte#komponente">Vollständige API auf GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="studio-section" id="studio" bind:this={studioSection}>
      <div class="studio-label"><span>03</span><div><p>Dein bloub</p><h2>Jetzt bist du dran.</h2></div></div>
      <App embedded journey={!arrived} journeySection={section} />
    </section>
  </main>
</div>
