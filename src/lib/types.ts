import type { GazeScript as InternalGazeScript } from './internal/gaze'

export const SHAPES = [
  { id: 'circle', label: 'Kreis' },
  { id: 'pebble', label: 'Kiesel' },
  { id: 'squircle', label: 'Squircle' },
  { id: 'capsule', label: 'Kapsel' },
  { id: 'triangle', label: 'Dreieck' },
  { id: 'hexagon', label: 'Sechseck' },
  { id: 'cloud', label: 'Wolke' },
  { id: 'droplet', label: 'Tropfen' }
] as const

export const COLORS = [
  { id: 'ink', label: 'Tinte', hex: '#0a0a0c' },
  { id: 'brown', label: 'Braun', hex: '#8b5e3c' },
  { id: 'red', label: 'Rot', hex: '#e8483f' },
  { id: 'orange', label: 'Orange', hex: '#f08a24' },
  { id: 'amber', label: 'Bernstein', hex: '#f0b429' },
  { id: 'green', label: 'Grün', hex: '#3ecf8e' },
  { id: 'turquoise', label: 'Türkis', hex: '#2fbfa0' },
  { id: 'blue', label: 'Blau', hex: '#3b93f0' },
  { id: 'violet', label: 'Violett', hex: '#8b5cf6' },
  { id: 'pink', label: 'Rosa', hex: '#e152b0' },
  { id: 'gray', label: 'Grau', hex: '#a3a3a3' },
  { id: 'cream', label: 'Creme', hex: '#f1efe9' }
] as const

export const EXPRESSIONS = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'attentive', label: 'Aufmerksam' },
  { id: 'surprised', label: 'Überrascht' },
  { id: 'excited', label: 'Begeistert' },
  { id: 'happy', label: 'Fröhlich' },
  { id: 'laughing', label: 'Lachend' },
  { id: 'angry', label: 'Wütend' },
  { id: 'sad', label: 'Traurig' },
  { id: 'scared', label: 'Ängstlich' },
  { id: 'suspicious', label: 'Misstrauisch' },
  { id: 'confused', label: 'Verwirrt' },
  { id: 'curious', label: 'Neugierig' },
  { id: 'proud', label: 'Stolz' },
  { id: 'shy', label: 'Schüchtern' },
  { id: 'unimpressed', label: 'Unbeeindruckt' },
  { id: 'sleepy', label: 'Schläfrig' }
] as const

export const STATES = [
  'idle',
  'thinking',
  'wink',
  'wide',
  'alert',
  'notify',
  'exclaim',
  'sleep',
  'egg',
  'hexagon',
  'play',
  'orbit',
  'burst',
  'comet'
] as const

export type ShapeId = (typeof SHAPES)[number]['id']
export type ColorId = (typeof COLORS)[number]['id']
export type ExpressionId = (typeof EXPRESSIONS)[number]['id']
export type StateId = (typeof STATES)[number]
export type GazeScript = InternalGazeScript

export interface AnimationBlock {
  state: StateId
  duration: number
}

export interface BloubProps {
  size?: number
  shape?: ShapeId
  color?: ColorId
  expression?: ExpressionId
  paper?: string
  label?: string
  frozenAt?: number
  cycle?: AnimationBlock[]
  follow?: boolean
  gaze?: GazeScript | null
  block?: number
  state?: StateId
  playing?: boolean
  elapsed?: number
  class?: string
}

