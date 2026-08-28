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
 * `nom` est l'endonyme — le nom de la langue DANS cette langue. Une liste de
 * langues traduite serait absurde : on la lit justement quand on ne comprend
 * pas la langue affichee.
 */
export const LANGUES = [
  { id: 'de', tag: 'de-AT', emoji: '🇦🇹', nom: 'Deutsch' },
  { id: 'fr', tag: 'fr', emoji: '🇫🇷', nom: 'Français' },
  { id: 'en', tag: 'en', emoji: '🇬🇧', nom: 'English' },
  { id: 'zh', tag: 'zh-Hans', emoji: '🇨🇳', nom: '简体中文' }
] as const

export type Langue = (typeof LANGUES)[number]['id']

export const LANGUE_PAR_DEFAUT: Langue = 'de'

export function estLangue(valeur: string | null | undefined): valeur is Langue {
  return LANGUES.some((l) => l.id === valeur)
}

export function tagDe(langue: Langue): string {
  return LANGUES.find((l) => l.id === langue)!.tag
}

/**
 * Langue a afficher au demarrage.
 *
 * Un choix explicite gagne toujours : quelqu'un qui a mis l'interface en
 * anglais doit la retrouver en anglais. Sans choix memorise, cette portation
 * s'ouvre en allemand autrichien, quelle que soit la langue du navigateur.
 */
export function choisirLangue(memorisee: string | null, preferences: readonly string[]): Langue {
  if (estLangue(memorisee)) return memorisee
  // L'interface de cette portation est allemande par defaut. Les preferences
  // sont conservees dans la signature pour que les anciennes integrations ne
  // cassent pas ; un choix explicite dans l'application gagne toujours.
  void preferences
  return LANGUE_PAR_DEFAUT
}
