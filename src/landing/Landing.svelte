<script lang="ts">
  import { base } from '$app/paths'
  import Bloub from '../lib/Bloub.svelte'

  const states = [
    { id: 'thinking', label: 'Denkt' },
    { id: 'wink', label: 'Zwinkert' },
    { id: 'orbit', label: 'Kreist' },
    { id: 'burst', label: 'Explodiert' }
  ] as const
</script>

<div class="landing">
  <header class="landing-nav">
    <a class="landing-brand" href={`${base}/`} aria-label="bloub Startseite">
      <img src={`${base}/favicon.svg`} alt="" />
      <span>bloub</span>
    </a>
    <nav aria-label="Hauptnavigation">
      <a href={`${base}/docs/`}>Dokumentation</a>
      <a class="nav-studio" href={`${base}/studio/`}>Studio öffnen <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main>
    <section class="landing-hero">
      <div class="hero-copy">
        <p class="landing-kicker"><span></span>Animierter SVG-Avatar für Svelte 5</p>
        <h1>Eine Form.<br /><em>Viele Gefühle.</em></h1>
        <p class="hero-lede">bloub bringt Charakter in dein Interface – als vollständig anpassbare, flüssig animierte Svelte-Komponente.</p>
        <div class="hero-actions">
          <a class="primary-action" href={`${base}/studio/`}>Im Studio gestalten <span aria-hidden="true">→</span></a>
          <a class="secondary-action" href={`${base}/docs/`}>Installation ansehen</a>
        </div>
        <div class="hero-facts" aria-label="Produkteigenschaften">
          <span><b>14</b> Zustände</span>
          <span><b>8</b> Formen</span>
          <span><b>0</b> Abhängigkeiten</span>
        </div>
      </div>

      <div class="hero-stage">
        <div class="stage-grid"></div>
        <p class="stage-note">REAGIERT AUF DICH</p>
        <a class="landing-avatar-shell" href={`${base}/studio/`} aria-label="Studio mit bloub öffnen">
          <Bloub size={520} shape="pebble" expression="curious" playing follow />
        </a>
        <p class="stage-hint"><span>Bewege den Cursor</span><i></i></p>
      </div>
    </section>

    <section class="landing-intro">
      <p class="section-number">01 / Persönlichkeit</p>
      <div>
        <h2>Nicht nur ein Kreis<br />mit zwei Augen.</h2>
        <p>Jeder Zustand ist als echte SVG-Geometrie modelliert. bloub denkt, blinzelt, schläft, kreist und zerplatzt – ohne Video, Canvas oder Animationsbibliothek.</p>
      </div>
    </section>

    <section class="state-strip" aria-label="Auswahl der Animationen">
      {#each states as item, index}
        <article>
          <span>0{index + 1}</span>
          <div class="state-avatar"><Bloub size={210} state={item.id} frozenAt={1.1} /></div>
          <h3>{item.label}</h3>
        </article>
      {/each}
    </section>

    <section class="landing-feature">
      <div class="feature-copy">
        <p class="section-number">02 / Dein bloub</p>
        <h2>Gestalten.<br />Animieren.<br /><em>Exportieren.</em></h2>
      </div>
      <div class="feature-list">
        <article><span>01</span><div><h3>Visuell anpassen</h3><p>Form, Farbe und Ausdruck kombinieren – direkt mit einer lebendigen Vorschau.</p></div></article>
        <article><span>02</span><div><h3>Abläufe bauen</h3><p>Vierzehn Zustände auf einer Timeline zu eigenen Animationen verbinden.</p></div></article>
        <article><span>03</span><div><h3>Überall verwenden</h3><p>Als Svelte-Komponente einbinden oder als SVG, PNG, GIF und MP4 exportieren.</p></div></article>
      </div>
    </section>

    <section class="landing-cta">
      <div class="cta-avatar"><Bloub size={260} state="wink" frozenAt={1} /></div>
      <p class="landing-kicker"><span></span>Deiner wartet schon</p>
      <h2>Mach ihn zu<br /><em>deinem bloub.</em></h2>
      <a href={`${base}/studio/`}>Studio öffnen <span aria-hidden="true">→</span></a>
    </section>
  </main>

  <footer class="landing-footer">
    <a class="landing-brand" href={`${base}/`}><img src={`${base}/favicon.svg`} alt="" /><span>bloub</span></a>
    <p>Für Svelte 5 · MIT-Lizenz</p>
    <div><a href={`${base}/docs/`}>Docs</a><a href="https://github.com/alois-reinstadler/bloub-svelte">GitHub ↗</a></div>
  </footer>
</div>
