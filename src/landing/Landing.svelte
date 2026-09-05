<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { base } from '$app/paths'
  import { BloubState, EXPRESSIONS, type ExpressionId, type BloubStatus } from '../lib'
  import App from '../App.svelte'
  import LiveBloub from './LiveBloub.svelte'

  const install = 'pnpm add https://alois-reinstadler.github.io/bloub-svelte/bloub-svelte-0.2.0.tgz'
  const examples = {
    basic: `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n<\/script>\n\n<Bloub\n  expression="happy"\n  lookAt="cursor"\n  size={240}\n/>`,
    status: `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n\n  let loading = $state(false)\n<\/script>\n\n<Bloub status={loading ? 'loading' : 'waiting'} />`,
    controller: `<script lang="ts">\n  import { Bloub, BloubState } from 'bloub-svelte'\n\n  const bloub = new BloubState()\n  let emailInput: HTMLInputElement\n<\/script>\n\n<Bloub controller={bloub} />\n<input\n  bind:this={emailInput}\n  onfocus={() => bloub.lookAt(emailInput)}\n/>\n<button onclick={() =>\n  bloub.react('validation-error', { target: emailInput })\n}>\n  Eingabe prüfen\n</button>`
  }
  let example = $state<keyof typeof examples>('basic')
  let heroExpression = $state<ExpressionId>('laughing')
  let copied = $state<string | null>(null)
  let copyError = $state(false)
  let copyTimer: ReturnType<typeof setTimeout>
  let studioSection: HTMLElement
  let studioMounted = $state(false)
  let studioVisible = $state(false)
  const demo = new BloubState()
  demo.setStatus('waiting')
  const statusOptions: { id: BloubStatus; label: string; text: string }[] = [
    { id: 'waiting', label: 'Warten', text: 'Nimm dir Zeit. Ich bin hier.' },
    { id: 'loading', label: 'Arbeiten', text: 'Es geht voran. Ganz ohne Hektik.' },
    { id: 'empty', label: 'Entdecken', text: 'Hier könnte etwas Gutes entstehen.' },
    { id: 'disabled', label: 'Ruhen', text: 'Eine kleine Pause.' }
  ]
  const demoText = $derived(demo.reaction ? 'Das haben wir gut gemacht!' : statusOptions.find(item => item.id === demo.status)?.text)

  async function copy(value: string, id: string) {
    clearTimeout(copyTimer)
    copyError = false
    try {
      await navigator.clipboard.writeText(value)
      copied = id
      copyTimer = setTimeout(() => copied = null, 1800)
    } catch {
      copyError = true
    }
  }

  onMount(() => {
    const observer = new IntersectionObserver(([entry]) => {
      studioVisible = entry?.isIntersecting ?? false
      if (studioVisible) studioMounted = true
    }, { rootMargin: '100px' })
    observer.observe(studioSection)
    if (/^#(etat=|planche|arrivee)/.test(location.hash)) {
      studioMounted = true
      studioSection.scrollIntoView({ behavior: 'instant' })
    }
    return () => observer.disconnect()
  })
  onDestroy(() => { demo.destroy(); clearTimeout(copyTimer) })
</script>

<div class="landing">
  <a class="skip-link" href="#content">Zum Inhalt</a>
  <header class="landing-nav" class:landing-nav--hidden={studioVisible}>
    <a href={`${base}/`} class="landing-brand" aria-label="bloub Startseite"><img src={`${base}/favicon.svg`} alt="" />bloub<span class="brand-dot">.</span></a>
    <nav aria-label="Seitennavigation">
      <a href="#character">Entdecken</a>
      <a href="#docs">Dokumentation</a>
      <a class="nav-button" href="#studio">Zum Studio <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main id="content">
    <section class="landing-hero wrap" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="section-kicker"><span class="live-dot"></span> Kleine Svelte-Komponente. Große Persönlichkeit.</p>
        <h1 id="hero-title">Dein Interface.<br />Mit <span>Gefühl.</span></h1>
        <p class="hero-description">Das ist bloub. Er wartet, denkt mit und freut sich mit dir. Ein lebendiger SVG-Charakter, der deiner Anwendung eine menschliche Note gibt.</p>
        <div class="landing-actions"><a class="button button-ink" href="#docs">Bloub einziehen lassen <span aria-hidden="true">↗</span></a><a class="inline-link" href="#character">Erst kennenlernen <span aria-hidden="true">↓</span></a></div>
        <button class="hero-install" onclick={() => copy(install, 'hero')} aria-label="Installationsbefehl kopieren"><span aria-hidden="true">$</span><code>bloub-svelte installieren</code><span>{copied === 'hero' ? 'Kopiert ✓' : 'Kopieren'}</span></button>
        <p class="hero-footnote">Für Svelte 5 · TypeScript · MIT-Lizenz</p>
      </div>
      <div class="hero-stage">
        <div class="stage-header"><span><span class="live-dot"></span> Das bin ich, live.</span><span>01 / bloub</span></div>
        <div class="hero-avatar"><LiveBloub expression={heroExpression} lookAt="cursor" size={500} paper="#efc6af" label="Bloub begrüßt dich und folgt deinem Cursor" /></div>
        <p class="stage-note">Ein Gesicht. Viele gute Gründe zu lächeln.</p>
        <div class="expression-picks" aria-label="Bloubs Ausdruck wählen">
          {#each [{ id: 'happy', label: 'Fröhlich' }, { id: 'laughing', label: 'Lachend' }, { id: 'curious', label: 'Neugierig' }] as item}
            <button aria-pressed={heroExpression === item.id} onclick={() => heroExpression = item.id as ExpressionId}>{item.label}</button>
          {/each}
        </div>
      </div>
    </section>

    <div class="feature-line wrap"><span>Nativ in <b>Svelte 5</b></span><span><b>11</b> Gesichtsausdrücke</span><span><b>8</b> Körperformen</span><span>Dein Design. <b>Dein bloub.</b></span></div>

    <section id="character" class="character-section wrap">
      <div class="section-heading"><div><p class="section-kicker">Mehr als eine Ladeanimation</p><h2>Er ist nicht nur da.<br />Er ist <em>mit dabei.</em></h2></div><p>Gib Bloub eine Aufgabe. Er findet den passenden Ausdruck – von geduldiger Aufmerksamkeit bis zum großen kleinen Erfolg.</p></div>
      <div class="behavior-grid">
        <div class="behavior-controls">
          {#each statusOptions as item, i}
            <button class="behavior-option" aria-pressed={demo.status === item.id && !demo.reaction} onclick={() => { demo.dismissReaction(); demo.setStatus(item.id) }}><span class="option-number">0{i + 1}</span><span><b>{item.label}</b><small>{item.text}</small></span><span aria-hidden="true">↗</span></button>
          {/each}
          <button class="celebrate-button" onclick={() => demo.react('celebrate', { force: true })}>Ein Grund zum Feiern <span aria-hidden="true">✳</span></button>
        </div>
        <div class="behavior-stage"><span class="stage-label">Probier’s aus</span><LiveBloub controller={demo} size={360} paper="#e9edda" label="Bloub zeigt den gewählten Anwendungszustand" /><p aria-live="polite">{demoText}</p><code>{demo.reaction ? "bloub.react('celebrate')" : `<Bloub status="${demo.status}" />`}</code></div>
      </div>
      <div class="principles"><article><span>01 — Aufmerksamkeit</span><h3>Er schaut wirklich hin.</h3><p>Zum Cursor oder direkt zum Formularfeld. Mit echten Elementreferenzen aus <code>bind:this</code>.</p></article><article><span>02 — Persönlichkeit</span><h3>Ein stimmiges Gesicht.</h3><p>Augen und Mund bewegen sich gemeinsam. Ausdrücke wechseln flüssig, auch mitten in einer Reaktion.</p></article><article><span>03 — Rücksicht</span><h3>So ruhig, wie du möchtest.</h3><p>Respektiert reduzierte Bewegung. Rückmeldungen bleiben sichtbar, große Gesten dürfen pausieren.</p></article></div>
    </section>

    <section class="expression-section" aria-labelledby="expression-title"><div class="wrap"><div class="section-heading"><div><p class="section-kicker">Die vielen Seiten von bloub</p><h2 id="expression-title">Für jedes kleine Gefühl.</h2></div><p>Keine austauschbaren Emojis. Ein Charakter, der er selbst bleibt.</p></div><div class="expression-gallery">{#each EXPRESSIONS as item}<figure><LiveBloub expression={item.id} size={110} frozenAt={1} paper="#f0eee6" label={item.label} /><figcaption>{item.label}</figcaption></figure>{/each}</div></div></section>

    <section id="docs" class="docs-section-new wrap">
      <div class="section-heading"><div><p class="section-kicker">Von Hallo zu eingebaut</p><h2>Wenig Code.<br /><em>Viel Charakter.</em></h2></div><p>Kein Web Component, kein Provider und kein globales Stylesheet. Importieren, platzieren, loslegen.</p></div>
      <div class="docs-layout"><aside class="docs-sidebar"><span class="doc-number">01 / Installation</span><h3>Direkt aus diesem Projekt.</h3><p>Du brauchst ein Projekt mit Svelte 5. Das gebaute Paket liegt direkt auf GitHub Pages; es gibt derzeit keine Veröffentlichung in der Paket-Registry.</p><div class="install-box"><code>{install}</code><button onclick={() => copy(install, 'install')} aria-label="pnpm-Installationsbefehl kopieren">{copied === 'install' ? 'Kopiert ✓' : 'Kopieren'}</button></div><p class="doc-number usage-label">02 / Verwendung</p><div class="example-tabs" aria-label="Codebeispiel wählen">{#each [{ id: 'basic', label: 'Einfach anfangen', detail: 'Ausdruck und Blick' }, { id: 'status', label: 'Zustände verbinden', detail: 'Warten und Arbeiten' }, { id: 'controller', label: 'Auf Ereignisse reagieren', detail: 'Controller und Elementziele' }] as item}<button aria-pressed={example === item.id} onclick={() => example = item.id as keyof typeof examples}><b>{item.label}</b><small>{item.detail}</small></button>{/each}</div></aside><div class="code-panel"><div class="code-panel-header"><span><i></i><i></i><i></i></span><span>DeineKomponente.svelte</span><button onclick={() => copy(examples[example], 'example')}>{copied === 'example' ? 'Kopiert ✓' : 'Code kopieren'}</button></div><!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable code needs keyboard focus.) -->
      <pre role="region" tabindex="0" aria-label="Svelte-Codebeispiel"><code>{examples[example]}</code></pre><div class="code-panel-footer">Natives Svelte 5 <span>Vollständig typisiert ↗</span></div></div></div>
      <p class="copy-message" aria-live="polite">{copyError ? 'Kopieren ist hier nicht verfügbar. Du kannst den Befehl oder Code direkt markieren.' : copied ? 'In die Zwischenablage kopiert.' : ''}</p>
    </section>

    <section id="api" class="api-section wrap"><div class="section-heading"><div><p class="section-kicker">Das Wichtigste auf einen Blick</p><h2>Kleine API.<br />Klare Absichten.</h2></div><a class="inline-link" href="https://github.com/alois-reinstadler/bloub-svelte/blob/main/docs/behavior.md">Verhaltens-API auf GitHub ↗</a></div><div class="api-grid"><article><h3>So sieht er aus.</h3><dl><div><dt><code>expression</code></dt><dd>Elf Ausdrücke. Zum Beispiel <code>happy</code>, <code>laughing</code> oder <code>curious</code>.</dd></div><div><dt><code>shape · color · size</code></dt><dd>Acht Formen, zwölf Farben und eine Größe in Pixeln.</dd></div><div><dt><code>paper · label</code></dt><dd>Farbe der Gesichtsflächen und zugänglicher Name des Avatars.</dd></div></dl></article><article><h3>So verhält er sich.</h3><dl><div><dt><code>status</code></dt><dd><code>idle</code>, <code>waiting</code>, <code>loading</code>, <code>empty</code> oder <code>disabled</code>.</dd></div><div><dt><code>lookAt</code></dt><dd><code>"cursor"</code>, eine echte Elementreferenz oder <code>null</code> zum Loslassen.</dd></div><div><dt><code>motion</code></dt><dd><code>auto</code> folgt der Systemeinstellung. Auch <code>full</code> und <code>reduced</code> sind möglich.</dd></div></dl></article><article><h3>Du hast die Kontrolle.</h3><dl><div><dt><code>controller</code></dt><dd>Eine Instanz von <code>BloubState</code>. Steuert Status, Blick und priorisierte Reaktionen.</dd></div><div><dt><code>state · cycle · playing</code></dt><dd>Acht Kataloganimationen gezielt wählen oder als Ablauf abspielen.</dd></div><div><dt><code>frozenAt</code></dt><dd>Eine feste Zeit in Sekunden – für Standbilder, Tests und reproduzierbare Ansichten.</dd></div></dl></article></div><div class="accessibility-note"><b>Gefühl ersetzt keine Information.</b><p>Bloub ergänzt deine Oberfläche. Beschrifte Formularfehler weiterhin mit Text und <code>aria-invalid</code>; teile laufende Aktionen mit einem zugänglichen Statustext mit.</p><a href={`${base}/feedback/`}>Zum vollständigen Feedback-Labor ↗</a></div></section>

    <section class="studio-intro wrap"><div><p class="section-kicker">Dein bloub wartet schon</p><h2>Mach ihn zu <em>deinem.</em></h2></div><p>Form, Farbe, Ausdruck. Stell deinen Charakter zusammen und exportiere ihn als PNG, SVG oder Animation.</p><a class="button button-ink" href="#studio">Studio öffnen ↓</a></section>
    <section class="studio-section" id="studio" bind:this={studioSection} aria-label="Interaktives Bloub-Studio">{#if studioMounted}<App embedded />{:else}<div class="studio-placeholder">Dein Studio wird bereitgemacht …</div>{/if}</section>
  </main>
  <footer class="landing-footer wrap"><a class="landing-brand" href="#content">bloub<span class="brand-dot">.</span></a><p>Ein bisschen mehr Persönlichkeit fürs Web.</p><div><a href="https://github.com/alois-reinstadler/bloub-svelte">GitHub ↗</a><a href={`${base}/feedback/`}>Feedback-Labor ↗</a><a href="https://github.com/alois-reinstadler/bloub-svelte/blob/main/LICENSE">MIT-Lizenz ↗</a></div></footer>
</div>
