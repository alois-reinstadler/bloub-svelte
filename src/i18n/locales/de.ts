import type fr from './fr'

const de: typeof fr = {
  app: { name: 'bloub', title: 'bloub – animierter SVG-Avatar', botAria: 'Animierter bloub-Avatar' },
  gallery: { back: 'Zurück zum Player' },
  rail: { nav: 'Bereiche', customize: 'Anpassen', animations: 'Animationen', settings: 'Einstellungen' },
  panel: { animations: 'Animation', shape: 'Form', expression: 'Ausdruck', color: 'Farbe' },
  export: {
    action: 'Als PNG exportieren', more: 'Andere Formate', png: 'PNG herunterladen', svg: 'SVG herunterladen',
    anime: 'Animiertes SVG herunterladen', gif: 'Animiertes GIF herunterladen',
    cycleDetail: 'Das Video ist kleiner und flüssiger; das GIF läuft überall.', cycleFormat: 'Format',
    cycle_mp4: 'MP4-Video', cycle_mp4_aide: 'Klein und flüssig, benötigt einen Hintergrund',
    cycle_gif: 'Animiertes GIF', cycle_gif_aide: 'Läuft überall, ist aber größer', cycleProgress: 'Export läuft …',
    cycleReessayer: 'Erneut versuchen', gifTitle: 'Animiertes GIF herunterladen',
    gifDetail: 'GIF-Transparenz kennt nur ganz oder gar nicht: Ohne Hintergrund wirkt der Rand der Kugel etwas hart.',
    gifBackground: 'Hintergrund', fond_blanc: 'Weißer Hintergrund', fond_blanc_aide: 'Weicher Rand für helle Flächen',
    fond_transparent: 'Transparenter Hintergrund', fond_transparent_aide: 'Passt auf jeden Hintergrund, Rand etwas härter',
    gifConfirm: 'Herunterladen', copie: 'Bild kopieren', copieSvg: 'SVG kopieren', done: 'Exportiert', copied: 'Kopiert', failed: 'Export fehlgeschlagen'
  },
  preview: { exit: 'Vorschau beenden', key: 'Esc' },
  timeline: {
    play: 'Wiedergabe starten', pause: 'Wiedergabe anhalten', addAnimation: 'Animation hinzufügen', preview: 'Vorschau',
    export: 'Montage exportieren', zoom: 'Zeitleisten-Zoom', playhead: 'Abspielposition', blockAria: '{state}, {duration}',
    blockDurationAria: 'Dauer von {state}, {duration}', blockRemoveAria: '{state} entfernen'
  },
  dialog: {
    cancel: 'Abbrechen', nameCreateTitle: 'Neuer Ablauf', nameRenameTitle: 'Ablauf umbenennen', nameField: 'Name des Ablaufs',
    nameCreate: 'Erstellen', nameRename: 'Umbenennen', removeTitle: '„{name}“ löschen?',
    removeDetail: 'Diese Sequenz und ihre Animation gehen verloren. | Diese Sequenz und ihre {n} Animationen gehen verloren.', removeConfirm: 'Löschen'
  },
  cycles: { defaultName: 'Standardablauf', newName: 'Mein Ablauf', menuNew: 'Neuer Ablauf', menuRenameAria: '{name} umbenennen', menuRemoveAria: '{name} löschen' },
  units: { seconds: '{n} s', secondsShort: '{n}s' },
  settings: {
    title: 'Einstellungen', language: 'Sprache', about: 'Über das Projekt', credits: 'Mit ♥︎ von {name} gemacht',
    creditsAria: 'Jérémy auf X, öffnet einen neuen Tab', github: 'Projekt auf GitHub ansehen', githubAria: 'Projekt-Repository auf GitHub, öffnet einen neuen Tab'
  },
  states: {
    idle: 'Ruhe', thinking: 'Nachdenken', wink: 'Zwinkern', wide: 'Große Augen', alert: 'Alarm', notify: 'Benachrichtigung',
    exclaim: 'Ausruf', sleep: 'Schlaf', egg: 'Ei', hexagon: 'Sechseck', play: 'Wiedergabe', orbit: 'Umlauf', burst: 'Explosion', comet: 'Komet', swirl: 'Wirbel'
  },
  shapes: { cercle: 'Kreis', galet: 'Kiesel', squircle: 'Squircle', capsule: 'Kapsel', triangle: 'Dreieck', hexagone: 'Sechseck', nuage: 'Wolke', goutte: 'Tropfen' },
  colors: { encre: 'Tinte', creme: 'Creme', brun: 'Braun', rouge: 'Rot', orange: 'Orange', ambre: 'Bernstein', vert: 'Grün', turquoise: 'Türkis', bleu: 'Blau', violet: 'Violett', rose: 'Rosa', gris: 'Grau' },
  expressions: {
    neutre: 'Neutral', attentif: 'Aufmerksam', surpris: 'Überrascht', excite: 'Begeistert', heureux: 'Fröhlich', hilare: 'Lachend',
    colere: 'Wütend', triste: 'Traurig', effraye: 'Ängstlich', mefiant: 'Misstrauisch', confus: 'Verwirrt', curieux: 'Neugierig',
    fier: 'Stolz', timide: 'Schüchtern', blase: 'Unbeeindruckt', somnolent: 'Schläfrig'
  }
}

export default de
