<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { base } from '$app/paths'
  import { BloubState, EXPRESSIONS, type ExpressionId, type BloubStatus } from '../lib'
  import LiveBloub from './LiveBloub.svelte'

  const install = 'pnpm add https://alois-reinstadler.github.io/bloub-svelte/bloub-svelte-0.2.0.tgz'
  const examples = {
    basic: `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n<\/script>\n\n<Bloub\n  expression="happy"\n  lookAt="cursor"\n  size={240}\n/>`,
    status: `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n\n  let loading = $state(false)\n\n  async function save() {\n    loading = true\n    try {\n      // Hier deine Speicherfunktion aufrufen.\n      await new Promise(resolve => setTimeout(resolve, 1500))\n    } finally { loading = false }\n  }\n<\/script>\n\n<Bloub status={loading ? 'loading' : 'waiting'} />\n<button onclick={save} disabled={loading}>\n  {loading ? 'Wird gespeichert …' : 'Speichern ausprobieren'}\n</button>`,
    controller: `<script lang="ts">\n  import { onDestroy } from 'svelte'\n  import { Bloub, BloubState } from 'bloub-svelte'\n\n  const bloub = new BloubState()\n  let emailInput: HTMLInputElement\n  let invalid = $state(false)\n  onDestroy(() => bloub.destroy())\n\n  function validate() {\n    invalid = !emailInput.validity.valid\n    bloub.react(invalid ? 'validation-error' : 'success', {\n      target: emailInput\n    })\n  }\n<\/script>\n\n<Bloub controller={bloub} />\n<label>\n  E-Mail\n  <input type="email" required bind:this={emailInput}\n    aria-invalid={invalid} aria-describedby="email-help"\n    onfocus={() => bloub.lookAt(emailInput)} />\n</label>\n<p id="email-help" aria-live="polite">\n  {invalid ? 'Bitte eine gültige E-Mail eingeben.' : ''}\n</p>\n<button onclick={validate}>Eingabe prüfen</button>`
  }
  let example = $state<keyof typeof examples>('basic')
  let heroExpression = $state<ExpressionId>('laughing')
  let galleryExpression = $state<ExpressionId>('happy')
  let copied = $state<string | null>(null)
  let copyError = $state(false)
  let copyTimer: ReturnType<typeof setTimeout>
  let studioSection: HTMLElement
  let Studio = $state<typeof import('../App.svelte').default>()
  let studioLoading = false
  let studioError = $state(false)

  async function loadStudio() {
    if (Studio || studioLoading) return
    studioLoading = true
    studioError = false
    try { Studio = (await import('../App.svelte')).default }
    catch { studioError = true }
    finally { studioLoading = false }
  }
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
      if (studioVisible) void loadStudio()
    }, { rootMargin: '100px' })
    observer.observe(studioSection)
    if (/^#(etat=|planche|arrivee)/.test(location.hash)) {
      void loadStudio()
      studioSection.scrollIntoView({ behavior: 'instant' })
    }
    return () => observer.disconnect()
  })
  onDestroy(() => { demo.destroy(); clearTimeout(copyTimer) })
</script>

<div class="landing">
  <a class="skip-link" href="#content">Zum Inhalt</a>
  <header class="landing-nav" class:landing-nav--studio={studioVisible}>
    <a href={`${base}/`} class="landing-brand" aria-label="bloub Startseite"><img src={`${base}/favicon.svg`} alt="" />bloub<span class="brand-dot">.</span></a>
    <nav aria-label="Seitennavigation">
      <a href={studioVisible ? "#content" : "#character"}>{studioVisible ? "Zur Übersicht" : "Entdecken"}</a>
      <a href="#docs">Dokumentation</a>
      <a class="nav-button" href="#studio">Zum Studio <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main id="content">
    <section class="landing-hero wrap" aria-labelledby="hero-title">
      <div class="hero-copy hero-intro">
        <p class="section-kicker"><span class="live-dot"></span> Kleine Svelte-Komponente. Große Persönlichkeit.</p>
        <h1 id="hero-title">Kleiner Bloub.<br /><span>Großes Gefühl.</span></h1>
      </div>
      <div class="hero-details">
        <p class="hero-description">Ein SVG-Charakter für Svelte 5. Er wartet auf Eingaben, zeigt Fortschritt und feiert Erfolge. Du gibst ihm den Anlass.</p>
        <div class="landing-actions"><a class="button button-ink" href="#docs">In Svelte einbauen <span aria-hidden="true">↗</span></a><a class="inline-link" href="#character">Verhalten ausprobieren <span aria-hidden="true">↓</span></a></div>
        <p class="hero-footnote">Für Svelte 5 · TypeScript · MIT-Lizenz</p>
      </div>
      <div class="hero-stage">
        <div class="stage-header"><span><span class="live-dot"></span> Das bin ich, live.</span><span>01 / bloub</span></div>
        <div class="hero-avatar"><LiveBloub expression={heroExpression} lookAt="cursor" size={500} paper="#efc6af" label="Bloub begrüßt dich und folgt deinem Cursor" /></div>
        <p class="stage-note">Wähle einen Ausdruck. Das ist der echte Bloub.</p>
        <div class="expression-picks" aria-label="Bloubs Ausdruck wählen">
          {#each [{ id: 'happy', label: 'Fröhlich' }, { id: 'laughing', label: 'Lachend' }, { id: 'curious', label: 'Neugierig' }] as item}
            <button aria-pressed={heroExpression === item.id} onclick={() => heroExpression = item.id as ExpressionId}>{item.label}</button>
          {/each}
        </div>
      </div>
    </section>

    <div class="feature-line wrap"><span>Nativ in <b>Svelte 5</b></span><span><b>11</b> Gesichtsausdrücke</span><span><b>8</b> Körperformen</span><span>Dein Design. <b>Dein bloub.</b></span></div>

    <section id="character" class="character-section wrap">
      <div class="section-heading"><div><p class="section-kicker">Mehr als eine Ladeanimation</p><h2>Deine Anwendung.<br /><em>Seine Reaktion.</em></h2></div><p>Wechsle den Zustand und sieh direkt, wie Bloub reagiert. Ein Erfolg darf natürlich gefeiert werden.</p></div>
      <div class="behavior-grid">
        <div class="behavior-controls">
          {#each statusOptions as item, i}
            <button class="behavior-option" aria-pressed={demo.status === item.id && !demo.reaction} onclick={() => { demo.dismissReaction(); demo.setStatus(item.id) }}><span class="option-number">0{i + 1}</span><span><b>{item.label}</b><small>{item.text}</small></span><span aria-hidden="true">↗</span></button>
          {/each}
          <button class="celebrate-button" onclick={() => demo.react('celebrate', { force: true })}>Ein Grund zum Feiern <span aria-hidden="true">✳</span></button>
        </div>
        <div class="behavior-stage"><span class="stage-label">Probier’s aus</span><LiveBloub controller={demo} size={360} paper="#e9edda" label="Bloub zeigt den gewählten Anwendungszustand" /><p aria-live="polite">{demoText}</p><code>{demo.reaction ? "bloub.react('celebrate')" : `<Bloub status="${demo.status}" />`}</code></div>
      </div>

    </section>



    <section id="docs" class="docs-section-new wrap">
      <div class="section-heading"><div><p class="section-kicker">Von Hallo zu eingebaut</p><h2>Wenig Code.<br /><em>Viel Charakter.</em></h2></div><p>Kein Web Component, kein Provider und kein globales Stylesheet. Importieren, platzieren, loslegen.</p></div>
      <div class="docs-layout"><aside class="docs-sidebar"><span class="doc-number">01 / Installation</span><h3>Direkt aus diesem Projekt.</h3><p>Du brauchst ein Projekt mit Svelte 5. Das gebaute Paket liegt direkt auf GitHub Pages; es gibt derzeit keine Veröffentlichung in der Paket-Registry.</p><div class="install-box"><code>{install}</code><button onclick={() => copy(install, 'install')} aria-label="pnpm-Installationsbefehl kopieren">{copied === 'install' ? 'Kopiert ✓' : 'Kopieren'}</button></div><p class="doc-number usage-label">02 / Verwendung</p><div class="example-tabs" aria-label="Codebeispiel wählen">{#each [{ id: 'basic', label: 'Einfach anfangen', detail: 'Ausdruck und Blick' }, { id: 'status', label: 'Zustände verbinden', detail: 'Warten und Arbeiten' }, { id: 'controller', label: 'Auf Ereignisse reagieren', detail: 'Controller und Elementziele' }] as item}<button aria-pressed={example === item.id} onclick={() => example = item.id as keyof typeof examples}><b>{item.label}</b><small>{item.detail}</small></button>{/each}</div></aside><div class="code-panel"><div class="code-panel-header"><span><i></i><i></i><i></i></span><span>DeineKomponente.svelte</span><button onclick={() => copy(examples[example], 'example')}>{copied === 'example' ? 'Kopiert ✓' : 'Code kopieren'}</button></div><!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable code needs keyboard focus.) -->
      <pre role="region" tabindex="0" aria-label="Svelte-Codebeispiel"><code>{examples[example]}</code></pre><div class="code-panel-footer">Natives Svelte 5 <span>Vollständig typisiert ↗</span></div></div></div>
      <p class="copy-message" role="status">{copyError ? 'Kopieren ist hier nicht verfügbar. Du kannst den Befehl oder Code direkt markieren.' : copied ? 'In die Zwischenablage kopiert.' : ''}</p>
    </section>

    <section class="expression-section" aria-labelledby="expression-title">
      <div class="wrap">
        <div class="section-heading"><div><p class="section-kicker">Welcher Ausdruck passt zu dir?</p><h2 id="expression-title">Elf Ausdrücke. Ein Charakter.</h2></div><p>Wähle ein Gefühl. Der Code zeigt dir, wie du es einbaust.</p></div>
        <div class="expression-explorer">
          <div class="expression-preview"><LiveBloub expression={galleryExpression} size={260} paper="#f0eee6" label={EXPRESSIONS.find(item => item.id === galleryExpression)?.label} /><code aria-live="polite">{`<Bloub expression="${galleryExpression}" />`}</code></div>
          <div class="expression-gallery" aria-label="Gesichtsausdruck wählen">
            {#each EXPRESSIONS as item}
              <button aria-pressed={galleryExpression === item.id} onclick={() => galleryExpression = item.id}><LiveBloub expression={item.id} size={75} frozenAt={1} paper="#f0eee6" label={item.label} /><span>{item.label}</span></button>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <section id="api" class="api-section wrap"><div class="section-heading"><div><p class="section-kicker">Das Wichtigste auf einen Blick</p><h2>Kleine API.<br />Klare Absichten.</h2></div><a class="inline-link" href="https://github.com/alois-reinstadler/bloub-svelte/blob/main/docs/behavior.md">Verhaltens-API auf GitHub ↗</a></div><div class="api-grid"><article><h3>So sieht er aus.</h3><dl><div><dt><code>expression</code></dt><dd>Elf Ausdrücke. Zum Beispiel <code>happy</code>, <code>laughing</code> oder <code>curious</code>.</dd></div><div><dt><code>shape · color · size</code></dt><dd>Acht Formen, zwölf Farben und eine Größe in Pixeln.</dd></div><div><dt><code>paper · label</code></dt><dd>Farbe der Gesichtsflächen und zugänglicher Name des Avatars.</dd></div></dl></article><article><h3>So verhält er sich.</h3><dl><div><dt><code>status</code></dt><dd><code>idle</code>, <code>waiting</code>, <code>loading</code>, <code>empty</code> oder <code>disabled</code>.</dd></div><div><dt><code>lookAt</code></dt><dd><code>"cursor"</code>, eine echte Elementreferenz oder <code>null</code> zum Loslassen.</dd></div><div><dt><code>motion</code></dt><dd><code>auto</code> folgt der Systemeinstellung. Auch <code>full</code> und <code>reduced</code> sind möglich.</dd></div></dl></article><article><h3>Du hast die Kontrolle.</h3><dl><div><dt><code>controller</code></dt><dd>Eine Instanz von <code>BloubState</code>. Steuert Status, Blick und priorisierte Reaktionen.</dd></div><div><dt><code>state · cycle · playing</code></dt><dd>Acht Kataloganimationen gezielt wählen oder als Ablauf abspielen.</dd></div><div><dt><code>frozenAt</code></dt><dd>Eine feste Zeit in Sekunden – für Standbilder, Tests und reproduzierbare Ansichten.</dd></div></dl></article></div><div class="accessibility-note"><b>Gefühl ersetzt keine Information.</b><p>Bloub ergänzt deine Oberfläche. Beschrifte Formularfehler weiterhin mit Text und <code>aria-invalid</code>; teile laufende Aktionen mit einem zugänglichen Statustext mit.</p><a href={`${base}/feedback/`}>Zum vollständigen Feedback-Labor ↗</a></div></section>

    <section class="studio-intro wrap"><div><p class="section-kicker">Dein bloub wartet schon</p><h2>Mach ihn zu <em>deinem.</em></h2></div><p>Form, Farbe, Ausdruck. Stell deinen Charakter zusammen und exportiere ihn als PNG, SVG oder Animation.</p><a class="button button-ink" href="#studio">Studio öffnen ↓</a></section>
    <section class="studio-section" id="studio" bind:this={studioSection} aria-label="Interaktives Bloub-Studio">{#if Studio}<Studio embedded />{:else}<div class="studio-placeholder" aria-live="polite">{#if studioError}<p>Das Studio konnte nicht geladen werden.</p><button class="button button-ink" onclick={loadStudio}>Erneut laden</button>{:else}Dein Studio wird geladen …{/if}</div>{/if}</section>
  </main>
  <footer class="landing-footer wrap"><a class="landing-brand" href="#content">bloub<span class="brand-dot">.</span></a><p>Ein bisschen mehr Persönlichkeit fürs Web.</p><div><a href="https://github.com/alois-reinstadler/bloub-svelte">GitHub ↗</a><a href={`${base}/feedback/`}>Feedback-Labor ↗</a><a href="https://github.com/alois-reinstadler/bloub-svelte/blob/main/LICENSE">MIT-Lizenz ↗</a></div></footer>
</div>
