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

## Anwendungszustände

`setStatus()` beschreibt länger anhaltende Situationen:

| Status | Einsatz |
|---|---|
| `idle` | Anwendung ist bereit |
| `waiting` | wartet auf eine Eingabe oder Entscheidung |
| `loading` | eine Operation läuft |
| `empty` | ein leerer Zustand braucht eine Handlung |
| `disabled` | Bereich oder Funktion ist inaktiv |

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

Nach einer Reaktion nimmt Bloub sein vorheriges Blickziel und den länger
laufenden Status wieder auf. Mit `motion="reduced"` lässt sich die körperliche
Bewegung immer abschalten; `motion="auto"` respektiert standardmäßig
`prefers-reduced-motion`.

Bloub ergänzt Rückmeldungen, ersetzt sie aber nicht. Fehlermeldungen brauchen
weiter Text und `aria-invalid`, laufende Aktionen weiter einen zugänglichen
Status, und kritische Bestätigungen bleiben echte Dialoge.
