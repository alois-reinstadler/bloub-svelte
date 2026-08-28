<script lang="ts">
  import Bloub from '../lib/Bloub.svelte'
  import { base } from '$app/paths'
  import { COLORS, EXPRESSIONS, SHAPES, type ColorId, type ExpressionId, type ShapeId } from '../lib'

  const install = 'pnpm add bloub-svelte'
  const usage = `<script lang="ts">\n  import { Bloub } from 'bloub-svelte'\n<\/script>\n\n<Bloub\n  size={320}\n  shape="pebble"\n  color="ink"\n  expression="curious"\n  state="idle"\n  playing\n/>`

  let shape = $state<ShapeId>('pebble')
  let color = $state<ColorId>('ink')
  let expression = $state<ExpressionId>('curious')
  let copied = $state<string | null>(null)

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value)
    copied = id
    window.setTimeout(() => { if (copied === id) copied = null }, 1600)
  }
</script>

<svelte:head><title>Installation — bloub-svelte</title></svelte:head>

<header class="nav-shell">
  <nav aria-label="Hauptnavigation">
    <a class="brand" href={`${base}/`} aria-label="bloub Startseite"><span class="brand-mark"><i></i><i></i></span><span>bloub</span></a>
    <div class="nav-links">
      <a class="active" href="#start">Dokumentation</a>
      <a href="https://github.com/alois-reinstadler/bloub-svelte">GitHub <span aria-hidden="true">↗</span></a>
      <a class="studio-link" href={`${base}/studio/`}>Studio öffnen</a>
    </div>
  </nav>
</header>

<main id="start">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span></span>Svelte 5 Komponente</p>
      <h1>Ein Avatar, der<br/><em>nicht stillsteht.</em></h1>
      <p class="lede">Ein ausdrucksstarker, animierter SVG-Avatar für Svelte. Acht Formen, 14 Zustände und kein Animations-Framework.</p>
      <div class="install-row">
        <span class="prompt" aria-hidden="true">$</span><code>{install}</code>
        <button type="button" onclick={() => copy(install, 'install')} aria-label="Installationsbefehl kopieren">{copied === 'install' ? 'Kopiert' : 'Kopieren'}</button>
      </div>
      <div class="hero-meta"><span>Svelte 5</span><span>TypeScript</span><span>MIT</span><span>0 Abhängigkeiten</span></div>
    </div>
    <div class="hero-preview" aria-label="Interaktive Vorschau">
      <div class="preview-grid"></div>
      <span class="preview-label">LIVE-VORSCHAU</span>
      <div class="avatar-wrap"><Bloub size={390} {shape} {color} {expression} playing follow /></div>
      <div class="preview-controls">
        <label>Form<select name="shape" bind:value={shape}>{#each SHAPES as option}<option value={option.id}>{option.label}</option>{/each}</select></label>
        <label>Ausdruck<select name="expression" bind:value={expression}>{#each EXPRESSIONS as option}<option value={option.id}>{option.label}</option>{/each}</select></label>
        <label>Farbe<select name="color" bind:value={color}>{#each COLORS as option}<option value={option.id}>{option.label}</option>{/each}</select></label>
      </div>
    </div>
  </section>

  <section class="quickstart" id="installation">
    <aside>
      <p class="section-index">01</p>
      <h2>In zwei Minuten<br/>einsatzbereit.</h2>
      <p>bloub ist eine native Svelte-Komponente. Keine Provider, keine globale CSS-Datei, keine Laufzeit-Konfiguration.</p>
      <a href="#api">Zur API-Referenz <span aria-hidden="true">↓</span></a>
    </aside>
    <div class="steps">
      <article>
        <div class="step-head"><span>1</span><h3>Paket installieren</h3></div>
        <div class="codebox single"><code>{install}</code><button onclick={() => copy(install, 'step')} aria-label="Befehl kopieren">{copied === 'step' ? '✓' : '⧉'}</button></div>
        <p>Benötigt Svelte 5.20 oder neuer.</p>
      </article>
      <article>
        <div class="step-head"><span>2</span><h3>Komponente verwenden</h3></div>
        <div class="codebox"><div class="code-title"><span>Avatar.svelte</span><button onclick={() => copy(usage.replace('<\\/script>', '</script>'), 'usage')}>{copied === 'usage' ? 'Kopiert' : 'Kopieren'}</button></div><pre><code><b>&lt;script</b> <i>lang</i>=<q>"ts"</q><b>&gt;</b>
  <strong>import</strong> {'{'} Bloub {'}'} <strong>from</strong> <q>'bloub-svelte'</q>
<b>&lt;/script&gt;</b>

<b>&lt;Bloub</b>
  <i>size</i>={'{'}320{'}'}
  <i>shape</i>=<q>"pebble"</q>
  <i>color</i>=<q>"ink"</q>
  <i>expression</i>=<q>"curious"</q>
  <i>state</i>=<q>"idle"</q>
  <i>playing</i>
<b>/&gt;</b></code></pre></div>
      </article>
    </div>
  </section>

  <section class="api" id="api">
    <div class="api-heading"><p class="section-index">02</p><h2>Kleine API.<br/><em>Viel Persönlichkeit.</em></h2><p>Alle Optionen sind vollständig typisiert und funktionieren direkt mit Svelte-Runes und Bindings.</p></div>
    <div class="api-table">
      <div class="api-row header"><span>Prop</span><span>Typ</span><span>Standard</span><span>Beschreibung</span></div>
      <div class="api-row"><code>size</code><span>number</span><code>320</code><p>Breite und Höhe in Pixeln</p></div>
      <div class="api-row"><code>shape</code><span>ShapeId</span><code>'circle'</code><p>Eine von acht Körperformen</p></div>
      <div class="api-row"><code>color</code><span>ColorId</span><code>'ink'</code><p>Eine von zwölf Farben</p></div>
      <div class="api-row"><code>expression</code><span>ExpressionId</span><code>'neutral'</code><p>Gesichtsausdruck in Ruhe</p></div>
      <div class="api-row"><code>state</code><span>StateId</span><code>'idle'</code><p>Aktueller Animationszustand</p></div>
      <div class="api-row"><code>playing</code><span>boolean</span><code>false</code><p>Animation starten oder pausieren</p></div>
      <div class="api-row"><code>follow</code><span>boolean</span><code>false</code><p>Blick folgt dem Mauszeiger</p></div>
      <div class="api-row"><code>cycle</code><span>AnimationBlock[]</span><span>idle</span><p>Eigene Zustandsfolge abspielen</p></div>
    </div>
  </section>

  <section class="closing">
    <div><p class="eyebrow"><span></span>Bereit?</p><h2>Bring etwas<br/>Leben in dein UI.</h2></div>
    <div><div class="install-row dark"><span class="prompt">$</span><code>{install}</code><button onclick={() => copy(install, 'end')}>{copied === 'end' ? 'Kopiert' : 'Kopieren'}</button></div><p>Oder zuerst im <a href={`${base}/studio/`}>Studio ausprobieren →</a></p></div>
  </section>
</main>

<footer><a class="brand" href={`${base}/`}><span class="brand-mark"><i></i><i></i></span><span>bloub</span></a><p>MIT-lizenziert · Gebaut mit Svelte 5</p><a href="#start">Nach oben ↑</a></footer>
