<script lang="ts">
  import Renderer from './internal/BloubRenderer.svelte'
  import type { ExpressionId as InternalExpressionId } from './internal/core/expressions'
  import type { ColorId as InternalColorId, ShapeId as InternalShapeId } from './internal/core/skins'
  import type { BloubProps, ColorId, ExpressionId, ShapeId, StateId } from './types'

  const shapeIds: Record<ShapeId, InternalShapeId> = {
    circle: 'cercle',
    pebble: 'galet',
    squircle: 'squircle',
    capsule: 'capsule',
    triangle: 'triangle',
    hexagon: 'hexagone',
    cloud: 'nuage',
    droplet: 'goutte'
  }

  const colorIds: Record<ColorId, InternalColorId> = {
    ink: 'encre',
    brown: 'brun',
    red: 'rouge',
    orange: 'orange',
    amber: 'ambre',
    green: 'vert',
    turquoise: 'turquoise',
    blue: 'bleu',
    violet: 'violet',
    pink: 'rose',
    gray: 'gris',
    cream: 'creme'
  }

  const expressionIds: Record<ExpressionId, InternalExpressionId> = {
    neutral: 'neutre',
    attentive: 'attentif',
    surprised: 'surpris',
    excited: 'excite',
    happy: 'heureux',
    laughing: 'hilare',
    angry: 'colere',
    sad: 'triste',
    scared: 'effraye',
    suspicious: 'mefiant',
    confused: 'confus',
    curious: 'curieux',
    proud: 'fier',
    shy: 'timide',
    unimpressed: 'blase',
    sleepy: 'somnolent'
  }

  let {
    size = 320,
    shape = 'circle',
    color = 'ink',
    expression = 'neutral',
    paper = '#f9f9f9',
    label = 'Animierter bloub-Avatar',
    frozenAt = undefined,
    cycle = [{ state: 'idle', duration: 2.4 }],
    follow = false,
    lookAt = undefined,
    gaze = null,
    block = $bindable(0),
    state = $bindable<StateId>('idle'),
    playing = $bindable(false),
    elapsed = $bindable(0),
    class: className = ''
  }: BloubProps = $props()

  let renderer: Renderer

  export function seek(index: number, offset = 0) {
    renderer.seek(index, offset)
  }

  export function renderAt(time: number) {
    renderer.rendAt(time)
  }

  export function redrawAt(time: number) {
    renderer.redrawAt(time)
  }

  export function getSvg() {
    return renderer.getSvg()
  }
</script>

<Renderer
  bind:this={renderer}
  {size}
  shape={shapeIds[shape]}
  color={colorIds[color]}
  expression={expressionIds[expression]}
  {paper}
  {label}
  {frozenAt}
  {cycle}
  {follow}
  {lookAt}
  {gaze}
  bind:block
  bind:state
  bind:playing
  bind:elapsed
  class={className}
/>
