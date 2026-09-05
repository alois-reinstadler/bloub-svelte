import { readStorage, writeStorage } from '@/ui/storage'
import { pluralForm, interpolate } from './format'
import { chooseLanguage, isLanguage, type Language, tagFor } from './languages'
import fr from './locales/fr'
import de from './locales/de'
import en from './locales/en'
import zh from './locales/zh'

export { LANGUAGES, type Language } from './languages'

const dictionaries: Record<Language, typeof fr> = { de, fr, en, zh }

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>
}[keyof T & string]

export type TranslationKey = Paths<typeof fr>

let current = $state<Language>(
  chooseLanguage(readStorage('language'), navigator.languages ?? [navigator.language])
)

export const language = {
  get value() {
    return current
  },
  set value(value: Language) {
    if (!isLanguage(value)) return
    current = value
    writeStorage('language', value)
  }
}

let dictionary = $derived(dictionaries[current])
let tag = $derived(tagFor(current))

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

export function formatNumber(value: number, decimals = 0): string {
  return formatter(`n${decimals}`, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatPercentage(fraction: number): string {
  return formatter('%', { style: 'percent', maximumFractionDigits: 0 }).format(fraction)
}

function raw(key: TranslationKey): string {
  const node = key
    .split('.')
    .reduce<unknown>((value, part) => (value as Record<string, unknown>)[part], dictionary)
  return node as string
}

export function t(key: TranslationKey, values?: Record<string, string | number>): string {
  return interpolate(raw(key), values)
}

export function plural(key: TranslationKey, n: number, values?: Record<string, string | number>): string {
  return interpolate(pluralForm(raw(key), n, tag), { n, ...values })
}

export function cycleName(cycle: { name: string }): string {
  return cycle.name || t('cycles.defaultName')
}

export function seconds(value: number): string {
  return t('units.seconds', { n: formatNumber(value, 1) })
}

export function shortSeconds(value: number, decimals: number): string {
  return t('units.secondsShort', { n: formatNumber(value, decimals) })
}
