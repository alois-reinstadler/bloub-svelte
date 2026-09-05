# bloub — Svelte 5

Eine ausdrucksstarke Svelte-5-Portierung von [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub): ein SVG-Avatar mit acht klar unterscheidbaren Bewegungszuständen, elf Gesichtsausdrücken und zwei unabhängig animierten Augen. Ohne Animationsbibliothek.

![Der Avatar durchläuft Ruhe, Zwinkern, Umlauf und Explosion](docs/demo.gif)

## Lokal starten

```bash
pnpm install
pnpm dev
```

Vite läuft standardmäßig auf <http://localhost:5190>.

```bash
pnpm check   # Svelte- und TypeScript-Diagnosen
pnpm test    # 217 Vitest-Tests
pnpm build   # Prüfung plus Produktions-Build
```

Die App nutzt Svelte 5 mit Runes, TypeScript, Vite 8 und Tailwind CSS 4. Die gemessene, frameworkfreie Engine aus `src/bot/` bleibt unverändert; die vollständige Vue-Oberfläche wurde in native Svelte-Komponenten portiert.

## Funktionen

- Acht Körperformen, zwölf Farben und elf klar unterscheidbare Ruheausdrücke mit lokaler Speicherung
- Editor für Animationsabläufe mit Verschieben, Skalieren, Scrubbing und Zoom
- Export als SVG, PNG, animiertes SVG, GIF und MP4
- Deutsche Oberfläche mit `de-AT`-Formatierung sowie Französisch, Englisch und Chinesisch
- Tastaturbedienung, reduzierte Bewegung und native modale Dialoge
- GitHub-Pages-Deployment über Actions

Zwei URL-Fragmente sind für die visuelle Prüfung praktisch:

- `#planche` zeigt alle acht Zustände eingefroren nebeneinander.
- `#etat=orbit&stop` öffnet einen bestimmten Zustand und pausiert die Wiedergabe.

## Installation

```bash
pnpm add bloub-svelte
```

Die Startseite verbindet Landingpage, Installationsanleitung und Studio als durchgehende SvelteKit-Seite. `#docs` springt zur Installation, `#studio` direkt zum Editor.

## Komponente

```svelte
<script lang="ts">
  import { Bloub, BloubState } from 'bloub-svelte'

  const bloub = new BloubState()
  let emailInput: HTMLInputElement

  function validate() {
    if (!emailInput.validity.valid) {
      bloub.react('validation-error', { target: emailInput })
    }
  }
</script>

<Bloub controller={bloub} />
<input bind:this={emailInput} onfocus={() => bloub.lookAt(emailInput)} />
<button onclick={validate}>Prüfen</button>
<button onclick={() => bloub.followCursor()}>Cursor folgen</button>
```

`BloubState` verbindet semantische Anwendungszustände mit Ausdruck, Animation und Blick. `setStatus('loading')` bleibt aktiv, bis die Anwendung den Status ändert; `react('success')` und `react('validation-error', { target })` sind zeitlich begrenzte Ereignisse. `followCursor()`, `lookAt(element)` und `releaseAttention()` steuern die Aufmerksamkeit ohne Selektoren – Elemente kommen direkt aus Sveltes `bind:this`. Prioritäten und Wiederholungssperren verhindern konkurrierende oder nervöse Rückmeldungen. [Alle Zustände, Reaktionen und Einsatzregeln](docs/behavior.md).

Die direkten Props bleiben für einfache Darstellungen verfügbar: `lookAt="cursor"` folgt dem Zeiger, `lookAt={element}` verfolgt die sichtbare Mitte und `lookAt={null}` gibt den Blick frei. `follow` bleibt als veralteter Alias kompatibel.

Props: `size`, `shape`, `color`, `expression`, `paper`, `frozenAt`, `cycle`, `lookAt`, `gaze`, `controller` und `motion`. Bindbare Werte: `block`, `state`, `playing` und `elapsed`. Alle öffentlichen Typen und Optionslisten werden vom Paket exportiert.

## Architektur und Messwerte

Die Engine ist eine reine Zeitfunktion: `engine.sample(t)` liefert für dieselbe Zeit stets dasselbe Bild. Dadurch funktionieren pausierte Wiedergabe, Vorschaubilder, Zustandstafel und Exporte über dieselbe Zeichenquelle.

- [`docs/architecture.md`](docs/architecture.md) — Engine, radiales Form-Morphing und Augen als Maskenlöcher
- [`docs/measurements.md`](docs/measurements.md) — gemessene Werte und Profil-Regenerierung
- [`docs/interface.md`](docs/interface.md) — Layout und responsive Szene
- [`docs/export.md`](docs/export.md) — SVG-, PNG-, GIF- und MP4-Export
- [`docs/intro.md`](docs/intro.md) — Ankunftssequenz
- [`docs/i18n.md`](docs/i18n.md) — Übersetzungsschicht
- [`docs/behavior.md`](docs/behavior.md) — semantische Zustände, Reaktionen und Blicksteuerung

## Herkunft und Lizenz

Die ursprüngliche Implementierung und alle Messwerte stammen von Jérémy Perrets MIT-lizenziertem Projekt [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub). Siehe [`LICENSE`](LICENSE).

Nicht mit x.ai verbunden oder von x.ai unterstützt. „Grok“ und „x.ai“ gehören ihren jeweiligen Eigentümern. Die MIT-Lizenz deckt den Code ab, nicht das nachgebildete Design.
