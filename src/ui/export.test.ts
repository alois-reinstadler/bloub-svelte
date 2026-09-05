import { describe, expect, it } from 'vitest'
import { RADIUS } from '@/lib/internal/core/coordinates'
import { SHAPES } from '@/lib/internal/core/skins'
import {
  ACTIONS,
  WHITE,
  CYCLE_FPS,
  CYCLE_SIZE,
  HALF_SCREEN,
  CYCLE_FORMATS,
  DEFAULT_CYCLE_FORMAT,
  cycleSupportsTransparency,
  cycleFrames,
  GIF_BACKGROUNDS,
  DEFAULT_GIF_BACKGROUND,
  backgroundColor,
  ACTION_BY_ID,
  DEFAULT_ACTION,
  HALF_FRAME,
  MAX_RADIUS,
  fileName,
  withoutComments,
  viewBoxExport
} from './export'

/** Rayon de la boule au repos, cf. le `R` de BloubBot.svelte. */


/** Demi-cote du viewBox affiche a l'ecran, cf. le `VB` de BloubBot.svelte. */
const VB_ECRAN = 158

describe('cadre d export', () => {
  /*
   * LE test du fichier : le cadre est plus serre que l'ecran, donc c'est lui qui
   * decide ce qui rentre. Une forme ajoutee a `skins.ts` avec un rayon plus
   * grand que la marge se ferait rogner en silence sur l'image exportee.
   */
  it('contient toutes les formes du personnalisateur', () => {
    for (const forme of SHAPES) {
      const rayon = Math.max(...forme.radii) * RADIUS
      expect(rayon, `la forme « ${forme.id} » depasse du cadre`).toBeLessThan(HALF_FRAME)
    }
  })

  it('laisse une marge pour le rognage circulaire d une photo de profil', () => {
    // La boule au repos ne doit pas toucher le bord : entre 70 % et 90 % du cadre.
    const remplissage = RADIUS / HALF_FRAME
    expect(remplissage).toBeGreaterThan(0.7)
    expect(remplissage).toBeLessThan(0.9)
  })

  it('est plus serre que le viewBox de l ecran', () => {
    // La marge de l'ecran loge les anneaux des etats animes, absents au repos :
    // la garder remplirait l'export de vide.
    expect(HALF_FRAME).toBeLessThan(VB_ECRAN)
  })

  it('se cadre sur la forme la plus etalee et non sur le circle', () => {
    // Le squircle culmine a 1.15 sur sa diagonale : un cadre calcule sur le
    // circle seul (1.0) le rognerait.
    expect(MAX_RADIUS).toBeGreaterThan(1)
    expect(MAX_RADIUS).toBe(Math.max(...SHAPES.map((f) => Math.max(...f.radii))))
  })

  it('produit un viewBox carre centre sur la boule', () => {
    expect(viewBoxExport(125)).toBe('-125 -125 250 250')
    expect(viewBoxExport()).toBe(`${-HALF_FRAME} ${-HALF_FRAME} ${HALF_FRAME * 2} ${HALF_FRAME * 2}`)
  })
})

describe('catalogue des exports', () => {
  it('a des ids uniques', () => {
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length)
  })

  it('expose une action par defaut qui existe', () => {
    expect(ACTION_BY_ID.get(DEFAULT_ACTION)).toBeDefined()
  })

  /*
   * Une seule taille de PNG : proposer 1024 et 2048 faisait trancher a
   * l'utilisateur une question qui n'est pas la sienne.
   */
  it('ne propose qu un seul png a telecharger', () => {
    const pngs = ACTIONS.filter((a) => a.mode === 'download' && a.extension === 'png')
    expect(pngs).toHaveLength(1)
  })

  /* Le presse-papiers image ne sait ecrire que du bitmap ; le SVG passe en texte. */
  it('copyImage le bitmap en image et le vectoriel en texte', () => {
    for (const action of ACTIONS) {
      if (action.mode === 'copieImage') expect(action.extension).toBe('png')
      if (action.mode === 'copyText') expect(action.extension).toBe('svg')
    }
  })

  it('propose de copier les deux formats', () => {
    expect(ACTIONS.some((a) => a.mode === 'copieImage')).toBe(true)
    expect(ACTIONS.some((a) => a.mode === 'copyText')).toBe(true)
  })

  it('donne une taille exploitable a chaque action', () => {
    for (const action of ACTIONS) {
      expect(action.taille).toBeGreaterThan(0)
      expect(Number.isFinite(action.taille)).toBe(true)
    }
  })
})

describe('export d un cycle', () => {
  /*
   * LE piege du cycle : les anneaux des etats animes montent a 1,4 fois le rayon
   * de la boule, soit 140 — au-dela du cadre serre de l'export fixe, qui les
   * rognerait. Un cycle doit donc partir sur le viewBox de l'ecran.
   */
  it('exporte sur le viewBox de l ecran, pas sur le cadre serre', () => {
    const RAYON_ARCS = 140
    expect(HALF_SCREEN).toBeGreaterThan(RAYON_ARCS)
    expect(HALF_FRAME).toBeLessThan(RAYON_ARCS)
  })


  it('ne propose ni SVG anime ni format hors video', () => {
    // le corps morphe a chaque image : 2,5 ko de chemin fois six cents images
    expect(CYCLE_FORMATS).toEqual(['mp4', 'gif'])
    expect(CYCLE_FORMATS).toContain(DEFAULT_CYCLE_FORMAT)
  })

  /* La video n'a pas d'alpha : `VideoEncoder` refuse `alpha: 'keep'`. */
  it('ne laisse le choix du fond qu au gif', () => {
    expect(cycleSupportsTransparency('gif')).toBe(true)
    expect(cycleSupportsTransparency('mp4')).toBe(false)
  })

  it('compte les images d apres la duree et le format', () => {
    expect(cycleFrames(31.2, 'mp4')).toBe(Math.round(31.2 * CYCLE_FPS.mp4))
    expect(cycleFrames(31.2, 'gif')).toBe(Math.round(31.2 * CYCLE_FPS.gif))
    // un montage minuscule doit quand meme donner une image
    expect(cycleFrames(0, 'mp4')).toBe(1)
  })

  /*
   * Les reglages sont SEPARES par format, et c'est la correction d'une vraie
   * erreur : le MP4 avait herite du 320 px / 20 img/s du GIF, justifie chez lui
   * par le poids. A 93 kbps mesures, la video avait la definition d'une vignette.
   * Une video compresse le mouvement, elle n'a pas cette contrainte.
   */
  it('exporte la video plus grande et plus fluide que le gif', () => {
    expect(CYCLE_SIZE.mp4).toBeGreaterThan(CYCLE_SIZE.gif)
    expect(CYCLE_FPS.mp4).toBeGreaterThan(CYCLE_FPS.gif)
    expect(CYCLE_SIZE.mp4).toBeGreaterThanOrEqual(1024)
  })

  /* Le delai d'un GIF se compte en centiemes : 20 img/s tombe juste, 30 non. */
  it('garde une cadence gif exprimable en centiemes de seconde', () => {
    expect(Number.isInteger(100 / CYCLE_FPS.gif)).toBe(true)
  })
})

describe('fond du gif', () => {
  /* Le GIF est le SEUL format a poser la question : lui seul a 1 bit d'alpha. */
  it('ne concerne que le gif', () => {
    const anime = ACTIONS.filter((a) => a.mode === 'anime' || a.mode === 'gif')
    expect(anime.filter((a) => a.extension === 'gif')).toHaveLength(1)
  })

  it('propose blanc et transparent, blanc par defaut', () => {
    expect(GIF_BACKGROUNDS).toEqual(['blanc', 'transparent'])
    expect(GIF_BACKGROUNDS).toContain(DEFAULT_GIF_BACKGROUND)
    expect(DEFAULT_GIF_BACKGROUND).toBe('blanc')
  })

  /* « Fond blanc » doit etre WHITE, pas le `--paper` legerement casse du site. */
  it('peint du blanc pur, et rien du tout en transparent', () => {
    expect(backgroundColor('blanc')).toBe(WHITE)
    expect(WHITE).toBe('#ffffff')
    expect(backgroundColor('transparent')).toBeNull()
  })
})

describe('nettoyage du markup', () => {
  it('retire les commentaires sans toucher au dessin', () => {
    const markup =
      '<defs><!-- les yeux sont de vrais trous --><mask id="m">' +
      '<path d="M0 0" fill="#fff"/></mask></defs>' +
      '<g mask="url(#m)"><rect fill="#0a0a0c"/></g>'
    const propre = withoutComments(markup)
    expect(propre).not.toContain('<!--')
    expect(propre).not.toContain('trous')
    // Ce qui fait le dessin doit survivre intact.
    expect(propre).toContain('fill="#fff"')
    expect(propre).toContain('fill="#0a0a0c"')
    expect(propre).toContain('mask="url(#m)"')
    expect(propre).toContain('d="M0 0"')
  })

  it('retire un commentaire multiligne', () => {
    expect(withoutComments('<a/><!--\n  deux\n  lignes\n--><b/>')).toBe('<a/><b/>')
  })

  it('laisse un markup sans commentaire tel quel', () => {
    expect(withoutComments('<circle r="100"/>')).toBe('<circle r="100"/>')
  })
})

describe('nom de fichier', () => {
  it('se construit sur les ids et pas sur les libelles', () => {
    expect(fileName('droplet', 'neutral', 'ink', 'png')).toBe('bloub-droplet-neutral-ink.png')
    expect(fileName('circle', 'laughing', 'violet', 'svg')).toBe('bloub-circle-laughing-violet.svg')
  })

  /*
   * `App.svelte` relit forme / expression / couleur du localStorage sans les
   * valider : une valeur trafiquee ne doit pas pouvoir composer un chemin.
   */
  it('ne laisse pas passer de separateur de chemin', () => {
    const nom = fileName('../../etc/passwd', 'neutral', 'ink', 'png')
    expect(nom).not.toContain('/')
    // Un seul point, celui de l'extension.
    expect(nom.split('.')).toHaveLength(2)
    expect(nom.endsWith('.png')).toBe(true)
  })

  /* Un nom de montage doit rester lisible : « Cycle par défaut », pas « cyclepardfaut ». */
  it('translittere les accents et separe les mots', () => {
    expect(fileName('Cycle par défaut', '', '', 'mp4')).toBe('bloub-cycle-par-defaut.mp4')
    expect(fileName('Été 2026', '', '', 'gif')).toBe('bloub-ete-2026.gif')
  })

  it('survit a des ids vides', () => {
    expect(fileName('', '', '', 'png')).toBe('bloub.png')
  })
})
