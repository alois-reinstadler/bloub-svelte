import { ecris, lis } from '@/ui/stockage'
import { formePlurielle, interpoler } from './format'
import { choisirLangue, estLangue, type Langue, tagDe } from './langues'
import fr from './locales/fr'
import de from './locales/de'
import en from './locales/en'
import zh from './locales/zh'

export { LANGUES, type Langue } from './langues'

const dictionaries: Record<Langue, typeof fr> = { de, fr, en, zh }

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>
}[keyof T & string]

export type Cle = Paths<typeof fr>

let current = $state<Langue>(
  choisirLangue(lis('langue'), navigator.languages ?? [navigator.language])
)

export const langue = {
  get value() {
    return current
  },
  set value(value: Langue) {
    if (!estLangue(value)) return
    current = value
    ecris('langue', value)
  }
}

let dictionary = $derived(dictionaries[current])
let tag = $derived(tagDe(current))

$effect.root(() => {
  $effect(() => {
    document.documentElement.lang = tag
    document.title = t('app.title')
  })
})

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const memo = `${tag}:${key}`
  let result = formatters.get(memo)
  if (!result) {
    result = new Intl.NumberFormat(tag, options)
    formatters.set(memo, result)
  }
  return result
}

export function nombre(value: number, decimals = 0): string {
  return formatter(`n${decimals}`, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function pourcentage(fraction: number): string {
  return formatter('%', { style: 'percent', maximumFractionDigits: 0 }).format(fraction)
}

function raw(key: Cle): string {
  const node = key
    .split('.')
    .reduce<unknown>((value, part) => (value as Record<string, unknown>)[part], dictionary)
  return node as string
}

export function t(key: Cle, values?: Record<string, string | number>): string {
  return interpoler(raw(key), values)
}

export function pluriel(key: Cle, n: number, values?: Record<string, string | number>): string {
  return interpoler(formePlurielle(raw(key), n, tag), { n, ...values })
}

export function nomDeCycle(cycle: { name: string }): string {
  return cycle.name || t('cycles.defaultName')
}

export function secondes(value: number): string {
  return t('units.seconds', { n: nombre(value, 1) })
}

export function secondesCourtes(value: number, decimals: number): string {
  return t('units.secondsShort', { n: nombre(value, decimals) })
}
