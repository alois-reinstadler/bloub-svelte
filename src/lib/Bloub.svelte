<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte'
  import Renderer from './internal/BloubRenderer.svelte'
  import type { BloubMotion } from './bloub.state.svelte'
  import type { BloubProps, StateId } from './types'

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
    controller = undefined,
    motion = 'auto',
    block = $bindable(0),
    state: stateProp = $bindable<StateId>('idle'),
    playing = $bindable(false),
    elapsed = $bindable(0),
    class: className = ''
  }: BloubProps = $props()

  let renderer: Renderer
  let renderState = $state<StateId>(untrack(() => controller?.presentation.state ?? stateProp))
  let renderPlaying = $state(untrack(() => (controller ? false : playing)))
  let presentation = $derived(controller?.presentation)
  let renderExpression = $derived(presentation?.expression ?? expression)
  let renderLookAt = $derived(controller ? (presentation?.lookAt ?? null) : lookAt)
  let renderCycle = $derived(
    controller
      ? [{ state: presentation?.state ?? 'idle', duration: 86_400 }]
      : cycle
  )

  $effect(() => {
    const next = controller?.presentation.state ?? stateProp
    if (renderState !== next) renderState = next
  })

  $effect(() => {
    if (!controller && stateProp !== renderState) stateProp = renderState
  })

  $effect(() => {
    const next = controller ? false : playing
    if (renderPlaying !== next) renderPlaying = next
  })

  $effect(() => {
    if (!controller && playing !== renderPlaying) playing = renderPlaying
  })

  let reducedMotion = $state(false)
  let reactionAnimation: Animation | null = null

  const reactionFrames: Record<Exclude<BloubMotion, null>, Keyframe[]> = {
    shake: [
      { transform: 'translateX(0) rotate(0)' },
      { transform: 'translateX(-4%) rotate(-3deg)', offset: 0.18 },
      { transform: 'translateX(4%) rotate(3deg)', offset: 0.36 },
      { transform: 'translateX(-3%) rotate(-2deg)', offset: 0.54 },
      { transform: 'translateX(2%) rotate(1deg)', offset: 0.72 },
      { transform: 'translateX(0) rotate(0)' }
    ],
    nod: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(4%) scale(0.98, 1.02)', offset: 0.35 },
      { transform: 'translateY(-2%) scale(1.02, 0.98)', offset: 0.65 },
      { transform: 'translateY(0) scale(1)' }
    ],
    pulse: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.055)', offset: 0.35 },
      { transform: 'scale(0.985)', offset: 0.7 },
      { transform: 'scale(1)' }
    ],
    tilt: [
      { transform: 'rotate(0)' },
      { transform: 'rotate(-7deg)', offset: 0.42 },
      { transform: 'rotate(-7deg)', offset: 0.68 },
      { transform: 'rotate(0)' }
    ],
    bounce: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-7%) scale(1.04, 0.96)', offset: 0.24 },
      { transform: 'translateY(2%) scale(0.98, 1.02)', offset: 0.5 },
      { transform: 'translateY(-3%) scale(1.02, 0.98)', offset: 0.7 },
      { transform: 'translateY(0) scale(1)' }
    ],
    tremble: [
      { transform: 'translate(0, 0) rotate(0)' },
      { transform: 'translate(-1.5%, 1%) rotate(-1deg)', offset: 0.2 },
      { transform: 'translate(1.5%, -1%) rotate(1deg)', offset: 0.4 },
      { transform: 'translate(-1%, -0.5%) rotate(-0.7deg)', offset: 0.6 },
      { transform: 'translate(1%, 0.5%) rotate(0.7deg)', offset: 0.8 },
      { transform: 'translate(0, 0) rotate(0)' }
    ]
  }

  function playReaction(kind: Exclude<BloubMotion, null>, duration: number) {
    const svg = renderer?.getSvg()
    if (!svg?.animate) return
    reactionAnimation?.cancel()
    reactionAnimation = svg.animate(reactionFrames[kind], {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    })
  }

  $effect(() => {
    const active = controller?.reaction
    if (!active) return
    const { id, motion: kind, duration } = active
    if (!kind) return
    tick().then(() => {
      if (controller?.reaction?.id !== id) return
      if (motion === 'reduced' || (motion === 'auto' && reducedMotion)) return
      playReaction(kind, duration)
    })
  })

  onMount(() => {
    if (motion !== 'auto' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => (reducedMotion = query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  })

  onDestroy(() => reactionAnimation?.cancel())

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
  {shape}
  {color}
  expression={renderExpression}
  {paper}
  {label}
  {frozenAt}
  cycle={renderCycle}
  {follow}
  lookAt={renderLookAt}
  {gaze}
  reaction={controller?.reaction?.type}
  bind:block
  bind:state={renderState}
  bind:playing={renderPlaying}
  bind:elapsed
  class={className}
/>
