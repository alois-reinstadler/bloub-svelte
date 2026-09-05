# Verhaltens-API

`BloubState` trennt den Anwendungszustand von seiner visuellen Darstellung. Die
Anwendung meldet zum Beispiel einen Validierungsfehler; der Controller wählt
Ausdruck, Katalogzustand, Blickziel und Bewegung. Dadurch bleiben Formulare und
Geschäftslogik frei von Animationsdetails.

## Verwendung

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
```

Es gibt keine Selektoren und keinen globalen Provider. `bind:this` übergibt das
Element direkt; wenn es entfernt oder unsichtbar wird, gibt der Renderer den
Blick automatisch frei.

## Aufmerksamkeit

- `followCursor()` verfolgt den Zeiger.
- `lookAt(element)` verfolgt fortlaufend die sichtbare Mitte des Elements.
- `releaseAttention()` kehrt zum Blick des aktuellen Ausdrucks zurück.

Aufmerksamkeit dreht den Kopf direkt zum Ziel, ohne Eingangsdrehung oder feste
Ausrichtung auf das Studio. Ein unterbrochener Blick setzt an der sichtbaren Pose an.

## Anwendungszustände

`setStatus()` beschreibt länger anhaltende Situationen:

| Status | Einsatz |
|---|---|
| `idle` | Anwendung ist bereit |
| `waiting` | wartet geduldig auf Eingabe: ruhiger Blick, sanfte Atmung, gelegentliches Blinzeln |
| `loading` | Gesicht bleibt sichtbar; drei kleine Punkte zeigen eine laufende Operation |
| `empty` | ein leerer Zustand braucht eine Handlung |
| `disabled` | ruhendes Gesicht ohne Blickverfolgung oder automatische Bewegung |

Für einfache Oberflächen reicht eine deklarative Prop:

```svelte
<Bloub status="waiting" lookAt={emailInput} />
<Bloub status="loading" motion="auto" />
```

Ein übergebener `controller` hat Vorrang vor `status`. Während `loading` und
`disabled` pausiert die Aufmerksamkeit; der Controller merkt sich das Ziel für
die Rückkehr. Die acht Kataloganimationen bleiben über `state` und `cycle` verfügbar.

## Reaktionen

`react()` beschreibt ein einzelnes Ereignis:

| Reaktion | Typischer Einsatz |
|---|---|
| `validation-error` | ungültiges Formularfeld; mit `target` auf das Feld schauen |
| `error` | fehlgeschlagene Operation |
| `success` | erfolgreich gespeichert oder abgeschlossen |
| `warning` | riskanter oder ungewöhnlicher Zustand |
| `confused` | unvollständige oder widersprüchliche Eingabe |
| `celebrate` | wichtiger Abschluss, nicht jeder kleine Erfolg |
| `notify` | neue Information braucht Aufmerksamkeit |
| `destructive` | Löschen oder eine schwer umkehrbare Aktion |

Reaktionen haben Prioritäten und kurze Wiederholungssperren. Ein Erfolg kann
deshalb keinen laufenden Fehler überdecken, und eine wiederholt feuernde
Validierung lässt Bloub nicht ununterbrochen zittern. `force: true` ist für
bewusste Ausnahmen verfügbar.

Nach einer Reaktion nimmt Bloub sein gespeichertes Blickziel und den aktuellen
Anwendungsstatus wieder auf – auch wenn dieser sich während der Reaktion ändert. Mit `motion="reduced"` lässt sich die körperliche
Bewegung immer abschalten; `motion="auto"` respektiert standardmäßig
`prefers-reduced-motion`. Bei diesen Anwendungszuständen pausieren dann auch die
Blickdrift, Atmung, Blinzeln und Punktpulsation. Ausdruck, gezielte Aufmerksamkeit
und drei statische Arbeitspunkte bleiben erkennbar. Eine Änderung der Präferenz
stoppt auch eine bereits laufende Reaktionsgeste.

Bloub ergänzt Rückmeldungen, ersetzt sie aber nicht. Fehlermeldungen brauchen
weiter Text und `aria-invalid`, laufende Aktionen weiter einen zugänglichen
Status, und kritische Bestätigungen bleiben echte Dialoge.
