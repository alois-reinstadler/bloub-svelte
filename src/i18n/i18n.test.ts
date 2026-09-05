import { describe, expect, it } from 'vitest'
import { EXPRESSIONS } from '@/lib/internal/core/expressions'
import { COLORS, SHAPES } from '@/lib/internal/core/skins'
import { STATES } from '@/lib/internal/core/states'
import { pluralForm, interpolate } from './format'
import { chooseLanguage, LANGUAGES, tagFor } from './languages'
import fr from './locales/fr'
import de from './locales/de'
import en from './locales/en'
import zh from './locales/zh'

/**
 * On importe les dictionnaires et les modules purs, jamais `./index` : celui-ci
 * lit `localStorage`, `navigator` et `document` a l'import, donc il exige un
 * navigateur. C'est precisement pour ca que la regle de choix de language et la
 * mecanique de texte vivent dans des fichiers separes.
 */
const DICTIONNAIRES = { de, fr, en, zh }

describe('choix de la language au demarrage', () => {
  it('respecte le choix memorise, quelles que soient les preferences du navigateur', () => {
    expect(chooseLanguage('en', ['fr-FR', 'fr'])).toBe('en')
    expect(chooseLanguage('zh', ['fr-FR'])).toBe('zh')
  })

  it('ignore un choix memorise qui n est pas une language connue', () => {
    // le localStorage se modifie a la main : on ne lui fait pas confiance
    expect(chooseLanguage('xx', ['en-GB'])).toBe('de')
    expect(chooseLanguage('', ['en-GB'])).toBe('de')
  })

  it('ouvre en allemand quelles que soient les preferences du navigateur', () => {
    expect(chooseLanguage(null, ['zh-CN', 'en-US', 'fr'])).toBe('de')
    expect(chooseLanguage(null, ['en-US', 'zh-CN', 'fr'])).toBe('de')
  })

  it('ne laisse pas une preference systeme remplacer la locale du projet', () => {
    expect(chooseLanguage(null, ['zh-Hans-CN'])).toBe('de')
    expect(chooseLanguage(null, ['en-GB-oxendict'])).toBe('de')
  })

  it('tolere les etiquettes invalides', () => {
    expect(chooseLanguage(null, ['it-IT', 'ja', 'en'])).toBe('de')
    expect(chooseLanguage(null, ['pas une etiquette', 'zh'])).toBe('de')
  })

  it('retombe sur l allemand autrichien quand rien ne correspond', () => {
    expect(chooseLanguage(null, ['it-IT', 'ja-JP'])).toBe('de')
    expect(chooseLanguage(null, [])).toBe('de')
  })
})

describe('completude des dictionnaires', () => {
  /**
   * La presence des cles est deja garantie a la compilation (`en` et `zh` sont
   * types `typeof fr`). Ce qu'on verifie ici, c'est ce que le type ne voit pas :
   * une valeur vide, ou une traduction restee en francais par oubli.
   */
  function feuilles(objet: object, prefixe = ''): Array<[string, string]> {
    return Object.entries(objet).flatMap(([cle, valeur]) =>
      typeof valeur === 'string'
        ? [[`${prefixe}${cle}`, valeur] as [string, string]]
        : feuilles(valeur as object, `${prefixe}${cle}.`)
    )
  }

  it('n a aucune valeur vide, dans aucune language', () => {
    for (const [language, dico] of Object.entries(DICTIONNAIRES)) {
      for (const [cle, valeur] of feuilles(dico)) {
        expect(valeur.trim(), `${language}.${cle}`).not.toBe('')
      }
    }
  })

  it('traduit vraiment les libelles des catalogues, sans les recopier du francais', () => {
    // Les noms de marque et les gabarits purs (« {state}, {duration} ») sont
    // identiques d'une language a l'autre, c'est normal — on ne regarde donc que
    // les catalogues, ou chaque entree est un vrai mot a traduire.
    for (const famille of ['states', 'shapes', 'colors', 'expressions'] as const) {
      for (const [cle, valeur] of feuilles(fr[famille])) {
        expect(feuilles(zh[famille]).find(([k]) => k === cle)![1], `zh ${famille}.${cle}`).not.toBe(
          valeur
        )
      }
    }
  })

  it('couvre les quatre catalogues du bot, entree par entree', () => {
    const cles = (famille: object) => feuilles(famille).map(([k]) => k)
    expect(cles(fr.states).sort()).toEqual(STATES.map((s) => s.id).sort())
    expect(cles(fr.shapes).sort()).toEqual(SHAPES.map((s) => s.id).sort())
    expect(cles(fr.colors).sort()).toEqual(COLORS.map((c) => c.id).sort())
    expect(cles(fr.expressions).sort()).toEqual(EXPRESSIONS.map((e) => e.id).sort())
  })
})

describe('substitution', () => {
  it('remplace toutes les occurrences d un parametre', () => {
    expect(interpolate('{a} et {a}', { a: 'x' })).toBe('x et x')
  })

  it('accepte les nombres et plusieurs parametres', () => {
    expect(interpolate('{etat}, {duree}', { etat: 'Repos', duree: 2 })).toBe('Repos, 2')
  })

  it('laisse visible un parametre sans valeur, plutot que de le vider', () => {
    // un « {name} » a l'ecran se remarque ; une chaine vide passe inapercue
    expect(interpolate('Supprimer {name} ?', {})).toBe('Supprimer {name} ?')
  })
})

describe('plural', () => {
  it('range zero avec le singulier en francais, avec le plural en anglais', () => {
    const gabarit = 'un | plusieurs'
    expect(pluralForm(gabarit, 0, 'fr')).toBe('un')
    expect(pluralForm(gabarit, 0, 'en')).toBe('plusieurs')
  })

  it('distingue un de deux dans les deux langues', () => {
    const gabarit = 'un | plusieurs'
    for (const tag of ['fr', 'en']) {
      expect(pluralForm(gabarit, 1, tag)).toBe('un')
      expect(pluralForm(gabarit, 2, tag)).toBe('plusieurs')
    }
  })

  it('rend la forme unique quand la language n a pas de plural', () => {
    // le chinois : une seule forme ecrite dans le dictionnaire, sans separateur
    for (const n of [0, 1, 2, 17]) {
      expect(pluralForm('{n} 个动画', n, 'zh-Hans')).toBe('{n} 个动画')
    }
  })

  it('donne au chinois une seule forme, au francais et a l anglais deux', () => {
    expect(zh.dialog.removeDetail.includes(' | ')).toBe(false)
    expect(fr.dialog.removeDetail.split(' | ')).toHaveLength(2)
    expect(en.dialog.removeDetail.split(' | ')).toHaveLength(2)
  })
})

describe('catalogue des langues', () => {
  it('propose les quatre langues, avec une pastille et un endonyme', () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(['de', 'fr', 'en', 'zh'])
    for (const l of LANGUAGES) {
      expect(l.code.length, l.id).toBeGreaterThan(0)
      expect(l.name.trim(), l.id).not.toBe('')
    }
  })

  it('donne une etiquette BCP 47 que `Intl` sait lire', () => {
    for (const l of LANGUAGES) {
      const tag = tagFor(l.id)
      expect(new Intl.Locale(tag).language, l.id).toBe(l.id)
      // c'est cette etiquette qui formate les nombres : elle doit etre utilisable
      expect(new Intl.NumberFormat(tag).format(2.4), l.id).toMatch(/2[.,]4/)
    }
  })

  it('precise l ecriture du chinois, que `zh` seul laisse indeterminee', () => {
    expect(tagFor('zh')).toBe('zh-Hans')
  })

  it('utilise la locale autrichienne pour l allemand', () => {
    expect(tagFor('de')).toBe('de-AT')
  })
})
