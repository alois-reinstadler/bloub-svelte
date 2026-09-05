/**
 * Langues proposees et regle de choix. Volontairement sans DOM ni Svelte : le
 * navigateur ne rentre que par les arguments, donc la regle se teste sans
 * simuler `navigator` ni `localStorage`.
 */

/**
 * `tag` est l'etiquette BCP 47, pas l'identifiant : elle sert a `Intl` et a
 * l'attribut `lang` du document. `zh` seul ne dit pas si l'ecriture est
 * simplifiee ou traditionnelle, d'ou `zh-Hans`.
 *
 * `nom` est l'endonyme — le nom de la language DANS cette language. Une liste de
 * langues traduite serait absurde : on la lit justement quand on ne comprend
 * pas la language affichee.
 *
 * `code` est la pastille affichee devant le nom. Un CODE et pas un drapeau
 * emoji : le theme est strictement noir et blanc, et un drapeau designe un pays
 * la ou l'entree designe une language.
 */
export const LANGUAGES = [
  { id: 'de', tag: 'de-AT', code: 'DE', name: 'Deutsch' },
  { id: 'fr', tag: 'fr', code: 'FR', name: 'Français' },
  { id: 'en', tag: 'en', code: 'EN', name: 'English' },
  { id: 'zh', tag: 'zh-Hans', code: 'ZH', name: '简体中文' }
] as const

export type Language = (typeof LANGUAGES)[number]['id']

export const DEFAULT_LANGUAGE: Language = 'de'

export function isLanguage(valeur: string | null | undefined): valeur is Language {
  return LANGUAGES.some((l) => l.id === valeur)
}

export function tagFor(language: Language): string {
  return LANGUAGES.find((l) => l.id === language)!.tag
}

/**
 * Language a afficher au demarrage.
 *
 * Un choix explicite gagne toujours : quelqu'un qui a mis l'interface en
 * anglais doit la retrouver en anglais. Sans choix memorise, cette portation
 * s'ouvre en allemand autrichien, quelle que soit la language du navigateur.
 */
export function chooseLanguage(memorisee: string | null, preferences: readonly string[]): Language {
  if (isLanguage(memorisee)) return memorisee
  // L'interface de cette portation est allemande par defaut. Les preferences
  // sont conservees dans la signature pour que les anciennes integrations ne
  // cassent pas ; un choix explicite dans l'application gagne toujours.
  void preferences
  return DEFAULT_LANGUAGE
}
