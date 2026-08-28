# bloub — Svelte 5

Eine pixelgetreue Svelte-5-Portierung von [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub): ein SVG-Avatar mit einer Form, die durch 14 gemessene Zustände morpht, und zwei unabhängig animierten Augen. Ohne Animationsbibliothek.

![Der Avatar durchläuft Ruhe, Zwinkern, Umlauf und Explosion](docs/demo.gif)

## Lokal starten

```bash
pnpm install
pnpm dev
```

Vite läuft standardmäßig auf <http://localhost:5190>.

```bash
pnpm check   # Svelte- und TypeScript-Diagnosen
pnpm test    # 212 Vitest-Tests
pnpm build   # Prüfung plus Produktions-Build
```

Die App nutzt Svelte 5 mit Runes, TypeScript, Vite 8 und Tailwind CSS 4. Die gemessene, frameworkfreie Engine aus `src/bot/` bleibt unverändert; die vollständige Vue-Oberfläche wurde in native Svelte-Komponenten portiert.

## Funktionen

- Acht Körperformen, zwölf Farben und sechzehn Ruheausdrücke mit lokaler Speicherung
- Editor für Animationsabläufe mit Verschieben, Skalieren, Scrubbing und Zoom
- Export als SVG, PNG, animiertes SVG, GIF und MP4
- Deutsche Oberfläche mit `de-AT`-Formatierung sowie Französisch, Englisch und Chinesisch
- Tastaturbedienung, reduzierte Bewegung und native modale Dialoge
- GitHub-Pages-Deployment über Actions

Zwei URL-Fragmente sind für die visuelle Prüfung praktisch:

- `#planche` zeigt alle 14 Zustände eingefroren nebeneinander.
- `#etat=orbit&stop` öffnet einen bestimmten Zustand und pausiert die Wiedergabe.

## Komponente

```svelte
<script lang="ts">
  import BloubBot from './components/BloubBot.svelte'

  let block = $state(0)
  let state = $state<'idle' | 'orbit'>('idle')
  let playing = $state(true)
</script>

<BloubBot bind:block bind:state bind:playing />
<BloubBot state="orbit" size={120} frozenAt={1.2} />
```

Props: `size`, `shape`, `color`, `expression`, `paper`, `frozenAt`, `cycle`, `follow` und `gaze`. Bindbare Werte: `block`, `state`, `playing` und `elapsed`. Die Details stehen in [`src/components/BloubBot.svelte`](src/components/BloubBot.svelte).

## Architektur und Messwerte

Die Engine ist eine reine Zeitfunktion: `engine.sample(t)` liefert für dieselbe Zeit stets dasselbe Bild. Dadurch funktionieren pausierte Wiedergabe, Vorschaubilder, Zustandstafel und Exporte über dieselbe Zeichenquelle.

- [`docs/architecture.md`](docs/architecture.md) — Engine, radiales Form-Morphing und Augen als Maskenlöcher
- [`docs/measurements.md`](docs/measurements.md) — gemessene Werte und Profil-Regenerierung
- [`docs/interface.md`](docs/interface.md) — Layout und responsive Szene
- [`docs/export.md`](docs/export.md) — SVG-, PNG-, GIF- und MP4-Export
- [`docs/intro.md`](docs/intro.md) — Ankunftssequenz
- [`docs/i18n.md`](docs/i18n.md) — Übersetzungsschicht

## Herkunft und Lizenz

Die ursprüngliche Implementierung und alle Messwerte stammen von Jérémy Perrets MIT-lizenziertem Projekt [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub). Siehe [`LICENSE`](LICENSE).

Nicht mit x.ai verbunden oder von x.ai unterstützt. „Grok“ und „x.ai“ gehören ihren jeweiligen Eigentümern. Die MIT-Lizenz deckt den Code ab, nicht das nachgebildete Design.
