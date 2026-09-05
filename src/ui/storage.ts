/**
 * Cles de `localStorage`, en un seul endroit.
 *
 * Le prefixe porte le nom du produit : c'est une constante partagee et pas une
 * chaine recopiee a chaque appel, sinon le prochain renommage en oubliera une et
 * l'utilisateur perdra ses reglages sans que rien ne le signale.
 *
 * Aucune migration depuis l'ancien prefixe : le renommage a ete fait avant toute
 * mise en ligne, il n'y a pas d'installation a rattraper.
 */
const PREFIX = 'bloub:'

/** Tout ce que l'application persiste. */
const NAMES = ['cycles', 'cycle', 'shape', 'color', 'expression', 'language'] as const
const LEGACY_NAMES = { shape: 'forme', color: 'couleur', language: 'langue' } as const

export type StoredName = (typeof NAMES)[number]

/** `cle('cycles')` -> `'bloub:cycles'`. */
export function storageKey(name: StoredName): string {
  return `${PREFIX}${name}`
}

/**
 * Lecture GARDEE du stockage.
 *
 * Toucher `localStorage` peut jeter, et pas seulement echouer : quand l'acces est refuse
 * — Chrome regle sur « bloquer tous les cookies », iframe tierce, politique d'entreprise —
 * la simple lecture de la propriete leve un `SecurityError`. Or tout ce que l'application
 * relit l'est a l'evaluation des modules, donc l'exception remontait le `setup` de
 * `App.svelte` et la page restait BLANCHE : pas de bot du tout, pour un reglage de navigateur
 * qui n'a rien a voir avec le fait de regarder une animation.
 *
 * On perd la persistance, jamais l'application. C'est le seul arbitrage possible ici : il
 * n'y a rien a sauver de force, uniquement un avatar a retrouver si on peut.
 */
export function readStorage(name: StoredName): string | null {
  try {
    const current = localStorage.getItem(storageKey(name))
    if (current !== null) return current
    const legacyName = LEGACY_NAMES[name as keyof typeof LEGACY_NAMES]
    return legacyName ? localStorage.getItem(`${PREFIX}${legacyName}`) : null
  } catch {
    return null
  }
}

/**
 * Ecriture GARDEE du stockage.
 *
 * Meme raison qu'en lecture, plus le quota : un `setItem` peut lever
 * `QuotaExceededError`. Celle du cycle partait d'un `setTimeout`, donc en rejet non
 * traite — la persistance s'arretait sans que rien ne le dise.
 */
export function writeStorage(name: StoredName, value: string) {
  try {
    localStorage.setItem(storageKey(name), value)
  } catch {
    // stockage refuse ou plein : on continue sans persister
  }
}
