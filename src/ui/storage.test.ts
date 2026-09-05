import { afterEach, describe, expect, it, vi } from 'vitest'
import { readStorage, storageKey, writeStorage } from './storage'

/**
 * La garde du stockage.
 *
 * Ce qui est verrouille ici n'est pas la persistance, c'est le fait que l'application
 * DEMARRE quand le stockage est interdit. Tout ce qu'elle relit l'est a l'evaluation des
 * modules, et toucher `localStorage` peut lever un `SecurityError` — Chrome regle sur
 * « bloquer tous les cookies », iframe tierce, politique d'entreprise. L'exception
 * remontait le `setup` de `App.svelte` et la page restait blanche : aucun bot, pour un
 * reglage de navigateur qui n'a rien a voir avec le fait de regarder une animation.
 */

/** Un `localStorage` qui refuse tout, comme quand l'acces est bloque. */
function interdit() {
  const jette = () => {
    throw new DOMException('acces refuse', 'SecurityError')
  }
  vi.stubGlobal('localStorage', {
    get length(): number {
      return jette()
    },
    getItem: jette,
    setItem: jette,
    removeItem: jette,
    clear: jette,
    key: jette
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('garde du stockage', () => {
  it('prefixe les cles avec le nom du produit', () => {
    expect(storageKey('cycles')).toBe('bloub:cycles')
  })

  it('rend `null` au lieu de jeter quand la lecture est refusee', () => {
    interdit()
    expect(() => readStorage('cycles')).not.toThrow()
    expect(readStorage('cycles')).toBeNull()
  })

  it('ne jette pas quand l ecriture est refusee', () => {
    interdit()
    expect(() => writeStorage('cycles', '[]')).not.toThrow()
  })

  /**
   * Le quota est l'autre facon d'echouer, et elle arrive sur un stockage AUTORISE. Celle-la
   * partait d'un `setTimeout`, donc en rejet non traite : la persistance s'arretait sans
   * que rien ne le dise.
   */
  it('ne jette pas quand le quota est depasse', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('plein', 'QuotaExceededError')
      }
    })
    expect(() => writeStorage('cycles', '[]')).not.toThrow()
  })

  it('lit et ecrit vraiment quand le stockage repond', () => {
    const tas = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => tas.get(k) ?? null,
      setItem: (k: string, v: string) => void tas.set(k, v)
    })
    writeStorage('shape', 'droplet')
    expect(tas.get('bloub:shape')).toBe('droplet')
    expect(readStorage('shape')).toBe('droplet')
    expect(readStorage('color')).toBeNull()
  })
})
