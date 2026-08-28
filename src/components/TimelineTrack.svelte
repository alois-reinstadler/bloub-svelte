<script lang="ts">
  import { tick, untrack } from 'svelte'
  import BlockPicker from './BlockPicker.svelte'
  import BloubBot from '@/lib/internal/BloubRenderer.svelte'
  import { clampDuration, moveBlock, offsetOf, STEP, totalDuration, type Block } from '@/lib/internal/core/cycles'
  import { POSES, type StateId } from '@/lib/internal/core/states'
  import { BASE_SCALE, clampZoom, ticksFor } from '@/ui/timeline'
  import { secondes, secondesCourtes, t } from '@/i18n'

  let { blocks, elapsed, shape, color, expression, block = $bindable(), zoom = $bindable(), onblocks, onseek, onadd }: {
    blocks: Block[]; elapsed: number; shape: string; color: string; expression: string; block: number; zoom: number
    onblocks: (blocks: Block[]) => void; onseek: (seconds: number) => void; onadd: (state: StateId) => void
  } = $props()

  let scale = $derived(BASE_SCALE * zoom)
  let total = $derived(totalDuration(blocks))
  let at = $derived(offsetOf(blocks, block) + elapsed)
  let ticks = $derived(ticksFor(total, scale))
  let exact = $derived(secondes(at))
  let track: HTMLElement
  let overflow = $state({ left: false, right: false })
  let scrolled = $state(0)
  let anchorX: number | null = null

  function width(index: number) { return blocks[index]!.duration * scale }
  function label(index: number) { return t(`states.${blocks[index]!.state}`) }
  function onScroll() {
    if (!track) return
    scrolled = track.scrollLeft
    overflow = { left: track.scrollLeft > 4, right: track.scrollLeft + track.clientWidth < track.scrollWidth - 4 }
  }
  function setZoom(next: number, clientX?: number) { anchorX = clientX ?? null; zoom = clampZoom(next) }
  let previousScale = untrack(() => scale)
  $effect(() => {
    const now = scale
    if (now === previousScale || !track) return
    const before = previousScale
    previousScale = now
    const box = track.getBoundingClientRect()
    const x = (anchorX ?? box.left + track.clientWidth / 2) - box.left
    const second = (track.scrollLeft + x) / before
    anchorX = null
    tick().then(() => { track.scrollLeft = second * now - x; onScroll() })
  })
  function onWheel(event: WheelEvent) {
    if (!track) return
    const unit = event.deltaMode === 1 ? 16 : 1
    if (event.ctrlKey || event.metaKey) { event.preventDefault(); setZoom(zoom * Math.exp((-event.deltaY * unit) / 180), event.clientX); return }
    if (track.scrollWidth <= track.clientWidth) return
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if (delta) { event.preventDefault(); track.scrollLeft += delta * unit }
  }
  $effect(() => { total; blocks; tick().then(onScroll) })
  let previousBlock = block
  $effect(() => {
    if (block === previousBlock || !track) return
    previousBlock = block
    const x = offsetOf(blocks, block) * scale
    if (x < track.scrollLeft || x + width(block) > track.scrollLeft + track.clientWidth) track.scrollTo({ left: Math.max(0, x - 24), behavior: 'smooth' })
  })

  function removeBlock(index: number) {
    if (blocks.length < 2) return
    onblocks(blocks.filter((_, i) => i !== index))
    if (index < block) block -= 1
    else if (block >= blocks.length - 1) block = blocks.length - 2
  }
  function setDuration(index: number, wanted: number) {
    const item = blocks[index]
    if (!item) return
    const duration = clampDuration(item.state, wanted)
    if (duration !== item.duration) onblocks(blocks.map((old, i) => i === index ? { ...old, duration } : old))
  }

  type Drag = { from: number; to: number; startX: number; dx: number; moved: boolean }
  type Resize = { index: number; startX: number; startDuration: number }
  let drag = $state<Drag | null>(null)
  let resize = $state<Resize | null>(null)
  let scrubbing = $state(false)
  function shiftOf(index: number) {
    if (!drag?.moved) return 0
    if (index === drag.from) return drag.dx
    const w = width(drag.from)
    if (drag.to > drag.from && index > drag.from && index <= drag.to) return -w
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return w
    return 0
  }
  function lifted(index: number) { return Boolean(drag?.moved) && index === drag?.from }
  function indexAt(time: number) { let acc = 0; for (let i = 0; i < blocks.length; i++) { acc += blocks[i]!.duration; if (time < acc) return i } return blocks.length - 1 }
  function pointerSeconds(event: PointerEvent) { const box = track?.getBoundingClientRect(); return box ? (event.clientX - box.left + track.scrollLeft) / scale : 0 }
  function onBlockDown(index: number, event: PointerEvent) { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); drag = { from: index, to: index, startX: event.clientX, dx: 0, moved: false } }
  function onBlockMove(event: PointerEvent) { if (!drag) return; if (!drag.moved && Math.abs(event.clientX - drag.startX) <= 4) return; drag.moved = true; drag.dx = event.clientX - drag.startX; drag.to = Math.max(0, indexAt(pointerSeconds(event))) }
  function onBlockUp(index: number) { const current = drag; drag = null; if (!current) return; if (!current.moved) { block = index; return } if (current.to === current.from) return; const followed = block === current.from ? current.to : block; onblocks(moveBlock(blocks, current.from, current.to)); block = followed }
  function onResizeDown(index: number, event: PointerEvent) { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); resize = { index, startX: event.clientX, startDuration: blocks[index]!.duration } }
  function onResizeMove(event: PointerEvent) { if (resize) setDuration(resize.index, resize.startDuration + (event.clientX - resize.startX) / scale) }

  async function onCardKey(index: number, event: KeyboardEvent) {
    const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (!direction) return
    event.preventDefault()
    if (!event.altKey) return onseek(Math.max(0, Math.min(total - 0.001, at + direction * STEP)))
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    onblocks(moveBlock(blocks, index, target)); block = target; await tick()
    track?.querySelectorAll<HTMLButtonElement>('[data-card]')[target]?.focus()
  }
  function scrubTo(event: PointerEvent) { onseek(Math.max(0, Math.min(total - 0.001, pointerSeconds(event)))) }
  function onRulerDown(event: PointerEvent) { event.preventDefault(); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); scrubbing = true; scrubTo(event) }
  function onRulerKey(event: KeyboardEvent) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? total - 0.001 : event.key === 'ArrowLeft' ? at - STEP : event.key === 'ArrowRight' ? at + STEP : null
    if (next === null) return
    event.preventDefault()
    onseek(Math.max(0, Math.min(total - 0.001, next)))
  }
</script>

<div class="relative flex-1">
  <div bind:this={track} class="h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]" onscroll={onScroll} onwheel={onWheel}>
    <div class="relative flex h-full flex-col" style:width={`${total * scale + 76}px`}>
      <div class="relative h-7 shrink-0 cursor-ew-resize pt-1 select-none" role="slider" tabindex="0" aria-label={t('timeline.playhead')} aria-valuemin="0" aria-valuemax={total} aria-valuenow={at} aria-valuetext={exact} onkeydown={onRulerKey} onpointerdown={onRulerDown} onpointermove={(event) => scrubbing && scrubTo(event)} onpointerup={() => (scrubbing = false)} onpointercancel={() => (scrubbing = false)}>
        {#each ticks as mark (mark.t)}<span class="absolute bottom-1.5 flex items-end gap-1" style:transform={`translateX(${mark.t * scale}px)`}><span class="block w-px bg-[var(--line)] {mark.major ? 'h-3' : 'h-1.5'}"></span>{#if mark.major}<span class="-mb-0.5 text-xs leading-none text-[var(--muted)]">{secondesCourtes(mark.t, Number.isInteger(mark.t) ? 0 : 1)}</span>{/if}</span>{/each}
      </div>
      <ul class="flex flex-1 items-stretch">
        {#each blocks as item, index (`${index}-${item.state}`)}
          <li class="group relative shrink-0 pr-1 {lifted(index) ? 'z-20' : 'transition-transform duration-150 ease-out'}" style:width={`${item.duration * scale}px`} style:transform={shiftOf(index) ? `translateX(${shiftOf(index)}px)` : undefined}>
            <button type="button" class="flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-lg px-1.5 py-1 text-left transition select-none active:cursor-grabbing {index === block ? 'bg-white ring-2 ring-[var(--ink)] ring-inset' : 'bg-black/[0.045] hover:bg-black/[0.08]'} {lifted(index) ? 'scale-[1.02] opacity-75 shadow-lg' : ''}" aria-label={t('timeline.blockAria', { state: label(index), duration: secondes(item.duration) })} aria-current={index === block ? 'true' : undefined} onpointerdown={(event) => onBlockDown(index, event)} onpointermove={onBlockMove} onpointerup={() => onBlockUp(index)} onpointercancel={() => (drag = null)} data-card aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); block = index } else onCardKey(index, event) }}>
              <span class="flex min-w-0 flex-1 items-center justify-center">{#if width(index) > 44}<BloubBot class="shrink-0" state={item.state} size={Math.min(56, Math.max(30, width(index) * 0.5))} {shape} {color} {expression} paper={index === block ? '#ffffff' : '#f2f2f2'} frozenAt={POSES[item.state]} />{/if}</span>
              {#if width(index) > 50}<span class="tronque text-center text-xs leading-none font-semibold tabular-nums {index === block ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}">{secondes(item.duration)}</span>{/if}
            </button>
            <button type="button" class="absolute inset-y-2 right-0.5 w-1 cursor-ew-resize rounded-full bg-[var(--muted)] opacity-0 transition group-hover:opacity-60 hover:opacity-100! focus-visible:opacity-100" aria-label={t('timeline.blockDurationAria', { state: label(index), duration: secondes(item.duration) })} onpointerdown={(event) => onResizeDown(index, event)} onpointermove={onResizeMove} onpointerup={() => (resize = null)} onpointercancel={() => (resize = null)} onkeydown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setDuration(index, item.duration + (event.key === 'ArrowLeft' ? -STEP : STEP)) } }}></button>
            {#if blocks.length > 1}<button type="button" class="absolute top-1 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/10 text-[var(--ink)] opacity-0 transition group-hover:opacity-100 hover:bg-black/20 focus-visible:opacity-100" aria-label={t('timeline.blockRemoveAria', { state: label(index) })} onclick={() => removeBlock(index)}><svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 2.6 7.4 7.4M7.4 2.6 2.6 7.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>{/if}
          </li>
        {/each}
        <li class="w-[72px] shrink-0 pl-1"><BlockPicker {shape} {color} {expression} onpick={onadd}/></li>
      </ul>
      <div class="pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-full bg-[var(--ink)]" style:transform={`translateX(${at * scale}px)`}><span class="absolute -top-0.5 -left-[5px] h-3 w-3 rounded-full border-2 border-[var(--paper)] bg-[var(--ink)]"></span></div>
    </div>
  </div>
  {#if scrubbing}<div class="pointer-events-none absolute top-0 left-0 z-10" style:transform={`translate(${at * scale - scrolled}px, -70%)`}><span class="block -translate-x-1/2 rounded-md bg-[var(--ink)] px-2 py-1 text-xs tabular-nums text-[var(--paper)] shadow-sm">{exact}</span></div>{/if}
  {#if overflow.left}<div class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--paper)] to-transparent"></div>{/if}
  {#if overflow.right}<div class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--paper)] to-transparent"></div>{/if}
</div>
