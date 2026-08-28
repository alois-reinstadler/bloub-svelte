<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { NOTIF_BLUE } from './core/decor'
  import { BotEngine, type BotFrame } from './core/engine'
  import { clamp, easings } from './core/math'
  import { lookTarget, TURN_TIME, type GazeScript } from './gaze'
  import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from './core/expressions'
  import {
    COLOR_BY_ID,
    DEFAULT_COLOR,
    DEFAULT_SHAPE,
    SHAPE_BY_ID,
    mixHex
  } from './core/skins'
  import { blockAt, defaultCycle, offsetOf, type Block } from './core/cycles'
  import { DEMI_VIEWBOX, RAYON } from './core/repere'
  import { STATE_BY_ID, type StateId } from './core/states'
  import type { LookAtTarget } from '../types'

  interface Props {
    size?: number
    shape?: string
    color?: string
    expression?: string
    paper?: string
    frozenAt?: number
    cycle?: Block[]
    follow?: boolean
    lookAt?: LookAtTarget | null
    gaze?: GazeScript | null
    block?: number
    state?: StateId
    playing?: boolean
    elapsed?: number
    label?: string
    class?: string
  }

  let {
    size = 320,
    shape = DEFAULT_SHAPE,
    color = DEFAULT_COLOR,
    expression: expressionId = DEFAULT_EXPRESSION,
    paper = '#f9f9f9',
    frozenAt = undefined,
    cycle = defaultCycle().blocks,
    follow = false,
    lookAt = undefined,
    gaze = null,
    block = $bindable(0),
    state: currentState = $bindable<StateId>('idle'),
    playing = $bindable(false),
    elapsed = $bindable(0),
    label = 'Animierter bloub-Avatar',
    class: className = ''
  }: Props = $props()

  const R = RAYON
  const VB = DEMI_VIEWBOX
  let shapeRadii = $derived(SHAPE_BY_ID.get(shape)?.radii ?? null)
  let ink = $derived(COLOR_BY_ID.get(color)?.hex ?? '#0a0a0c')
  let expression = $derived(EXPRESSION_BY_ID.get(expressionId) ?? null)

  const engine = untrack(() => new BotEngine(R, currentState, shapeRadii, expression))
  let frame = $state<BotFrame>(untrack(() => engine.sample(frozenAt ?? 0)))
  const uid = $props.id()
  const maskId = `bot-mask-${uid}`

  let svg: SVGSVGElement
  let raf = 0
  let nextAt = Infinity
  let last = 0
  let clock = 0
  let blockStart = 0
  let pendingOffset = 0
  let lastBlock = -1

  function apply(index: number, from = 0) {
    const item = cycle[index]
    if (!item) {
      nextAt = Infinity
      return
    }
    blockStart = clock - from
    elapsed = from
    currentState = item.state
    engine.setState(item.state, clock)
    nextAt = playing ? blockStart + item.duration : Infinity
  }

  function goToBlock(index: number) {
    block = index
    apply(index)
  }

  export function seek(index: number, offset = 0) {
    if (block === index) {
      apply(index, offset)
      return
    }
    pendingOffset = offset
    block = index
  }

  export function rendAt(time: number) {
    if (!cycle.length) return
    const { index } = blockAt(cycle, time)
    if (index !== lastBlock) {
      const item = cycle[index]!
      currentState = item.state
      if (index < lastBlock) engine.reset(item.state, offsetOf(cycle, index))
      else engine.setState(item.state, offsetOf(cycle, index))
      lastBlock = index
    }
    frame = engine.sample(time)
  }

  export function getSvg() {
    return svg
  }

  export function redrawAt(time: number) {
    frame = engine.sample(time)
  }

  let pointer: { x: number; y: number } | null = null
  let aiming = false
  let turnSince = 0
  let activeLookAt = $derived<LookAtTarget | null>(
    lookAt === undefined ? (follow ? 'cursor' : null) : lookAt
  )

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType !== 'touch') pointer = { x: event.clientX, y: event.clientY }
  }

  function onPointerLeave() {
    pointer = null
  }

  function release() {
    if (!aiming) return
    engine.setLook(null, clock, TURN_TIME)
    aiming = false
  }

  function aim(target: LookAtTarget) {
    if (!STATE_BY_ID.get(currentState)?.baseFace) {
      release()
      return
    }
    const box = svg?.getBoundingClientRect()
    if (!box || box.width === 0 || box.height === 0) return
    let point = pointer
    if (target !== 'cursor') {
      if (!target.isConnected) {
        release()
        return
      }
      const targetBox = target.getBoundingClientRect()
      if (targetBox.width === 0 && targetBox.height === 0) {
        release()
        return
      }
      point = {
        x: targetBox.left + targetBox.width / 2,
        y: targetBox.top + targetBox.height / 2
      }
    }
    if (!aiming) turnSince = clock
    const halfWidth = Math.max(1, window.innerWidth / 2)
    const halfHeight = Math.max(1, window.innerHeight / 2)
    engine.setLook(
      lookTarget({
        nx: point ? clamp((point.x - (box.left + box.width / 2)) / halfWidth, -1, 1) : 0,
        ny: point ? clamp((point.y - (box.top + box.height / 2)) / halfHeight, -1, 1) : 0,
        tour: easings.easeOutQuint(clamp((clock - turnSince) / TURN_TIME)),
        pointer: point !== null
      }),
      clock
    )
    aiming = true
  }

  let gazeSince = 0
  let scripted = false
  const SCRIPT_MORPH = 1 / 60

  function scriptedGaze(run: GazeScript) {
    engine.setLook(run(clock - gazeSince), clock, SCRIPT_MORPH)
  }

  let previousGaze: GazeScript | null = null
  $effect(() => {
    const run = gaze
    if (run === previousGaze) return
    previousGaze = run
    if (run) {
      gazeSince = clock
      scripted = true
      engine.setLook(run(0), clock - SCRIPT_MORPH, SCRIPT_MORPH)
    } else if (scripted) {
      engine.setLook(null, clock)
      scripted = false
    }
  })

  function tick(ms: number) {
    raf = requestAnimationFrame(tick)
    const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0
    last = ms
    clock += dt

    if (playing) {
      if (clock >= nextAt && cycle.length) goToBlock((block + 1) % cycle.length)
      else elapsed = clock - blockStart
    }

    if (activeLookAt) aim(activeLookAt)
    else if (gaze) scriptedGaze(gaze)
    frame = engine.sample(clock)
  }

  function redrawFrozen() {
    if (frozenAt !== undefined) frame = engine.sample(frozenAt)
  }

  let previousBlock = block
  $effect(() => {
    const current = block
    if (current === previousBlock) return
    previousBlock = current
    apply(current, pendingOffset)
    pendingOffset = 0
  })

  $effect(() => {
    const current = currentState
    if (engine.state === current) return
    engine.setState(current, clock)
    redrawFrozen()
  })

  let previousPlaying = playing
  $effect(() => {
    const current = playing
    if (current === previousPlaying) return
    previousPlaying = current
    if (current) apply(block, elapsed)
    else nextAt = Infinity
  })

  let previousCycle = untrack(() => cycle)
  $effect(() => {
    const blocks = cycle
    if (blocks === previousCycle) return
    previousCycle = blocks
    if (!blocks.length) {
      nextAt = Infinity
      return
    }
    const index = Math.min(block, blocks.length - 1)
    if (index !== block) goToBlock(index)
    else nextAt = playing ? blockStart + blocks[index]!.duration : Infinity
  })

  let previousRadii = untrack(() => shapeRadii)
  $effect(() => {
    const radii = shapeRadii
    if (radii === previousRadii) return
    previousRadii = radii
    engine.setShape(radii, clock)
    redrawFrozen()
  })

  let previousExpression = untrack(() => expression)
  $effect(() => {
    const next = expression
    if (next === previousExpression) return
    previousExpression = next
    engine.setExpression(next, clock)
    redrawFrozen()
  })

  let previousFrozenAt = untrack(() => frozenAt)
  $effect(() => {
    const time = frozenAt
    if (time === previousFrozenAt) return
    previousFrozenAt = time
    redrawFrozen()
  })

  function detach() {
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerleave', onPointerLeave)
  }

  let following = false
  $effect(() => {
    const target = activeLookAt
    const on = target === 'cursor' && frozenAt === undefined
    if (on !== following) {
      following = on
      if (on) {
        window.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerleave', onPointerLeave)
      } else {
        detach()
        pointer = null
      }
    }
    if (target === null || frozenAt !== undefined) release()
  })

  onMount(() => {
    if (activeLookAt === 'cursor' && frozenAt === undefined && !following) {
      following = true
      window.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerleave', onPointerLeave)
    }
    if (frozenAt === undefined) {
      apply(block, elapsed)
      raf = requestAnimationFrame(tick)
    }
    return () => {
      cancelAnimationFrame(raf)
      detach()
    }
  })

  function dotAttrs(dot: BotFrame['dots'][number]) {
    const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth))
    const common = { fill, opacity: dot.opacity }
    return dot.d
      ? { ...common, d: dot.d, transform: `translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${R})` }
      : { ...common, cx: dot.x, cy: dot.y, r: dot.r }
  }
</script>

<svg
  bind:this={svg}
  class={className}
  width={size}
  height={size}
  viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
  role="img"
  aria-label={label}
>
  <defs>
    <mask id={maskId} maskUnits="userSpaceOnUse" x={-VB} y={-VB} width={VB * 2} height={VB * 2}>
      <path d={frame.bodyPath} fill="#fff" />
      {#each frame.eyes as eye}
        <path d={eye.d} transform={eye.matrix} opacity={eye.alpha} fill="#000" />
      {/each}
      {#if frame.notch}
        <circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} fill="#000" />
      {/if}
    </mask>

    {#each frame.arcs as arc (arc.id)}
      <linearGradient id={`${uid}-${arc.id}`} gradientUnits="userSpaceOnUse" x1={arc.grad.x1} y1={arc.grad.y1} x2={arc.grad.x2} y2={arc.grad.y2}>
        {#each arc.grad.stops as stop, index}
          <stop offset={index / (arc.grad.stops.length - 1)} stop-color={stop} />
        {/each}
      </linearGradient>
    {/each}
  </defs>

  <g fill="none" stroke-linecap="round">
    {#each frame.arcs as arc (arc.id)}
      <path d={arc.back} stroke={`url(#${uid}-${arc.id})`} stroke-width={arc.width} opacity={arc.opacity} />
    {/each}
  </g>

  {#if frame.dotsBehind}
    <g>
      {#each frame.dots as dot}
        {@const attrs = dotAttrs(dot)}
        {#if dot.d}<path {...attrs} />{:else}<circle {...attrs} />{/if}
      {/each}
    </g>
  {/if}

  <g opacity={frame.bodyAlpha}>
    <path d={frame.bodyPath} fill={paper} />
    <g mask={`url(#${maskId})`}>
      <rect x={-VB} y={-VB} width={VB * 2} height={VB * 2} fill={ink} />
    </g>
  </g>

  {#if !frame.dotsBehind}
    <g>
      {#each frame.dots as dot}
        {@const attrs = dotAttrs(dot)}
        {#if dot.d}<path {...attrs} />{:else}<circle {...attrs} />{/if}
      {/each}
    </g>
  {/if}

  {#if frame.notif}
    <circle cx={frame.notif.x} cy={frame.notif.y} r={frame.notif.r} fill={NOTIF_BLUE} />
  {/if}

  <g fill="none" stroke-linecap="round">
    {#each frame.arcs as arc (arc.id)}
      <path d={arc.front} stroke={`url(#${uid}-${arc.id})`} stroke-width={arc.width} opacity={arc.opacity} />
    {/each}
  </g>
</svg>
