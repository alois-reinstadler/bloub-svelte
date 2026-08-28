<script lang="ts">
  import ConfirmDialog from './ConfirmDialog.svelte'
  import CycleMenu from './CycleMenu.svelte'
  import NameDialog from './NameDialog.svelte'
  import TimelineTrack from './TimelineTrack.svelte'
  import ZoomSlider from './ZoomSlider.svelte'
  import { blocksWith, makeBlock, nextCycleId, offsetOf, totalDuration, uniqueName, type Block, type Cycle } from '@/bot/cycles'
  import type { StateId } from '@/bot/states'
  import { MAX_ZOOM, MIN_ZOOM, mmss } from '@/ui/timeline'
  import { nomDeCycle, pluriel, t } from '@/i18n'

  let { elapsed, shape, color, expression, cycles = $bindable(), activeId = $bindable(), block = $bindable(), playing = $bindable(), onseek, onpreview, onexporter }: {
    elapsed: number; shape: string; color: string; expression: string; cycles: Cycle[]; activeId: string; block: number; playing: boolean
    onseek: (seconds: number) => void; onpreview: () => void; onexporter: () => void
  } = $props()
  let zoom = $state(1)
  let cycle = $derived(cycles.find((item) => item.id === activeId) ?? cycles[0]!)
  let blocks = $derived(cycle.blocks)
  let total = $derived(totalDuration(blocks))
  let at = $derived(offsetOf(blocks, block) + elapsed)
  let naming = $state<{ mode: 'create' | 'rename'; id?: string } | null>(null)
  let nameDraft = $state('')
  let nameOpen = $state(false)
  let removing = $state<Cycle | null>(null)
  let confirmOpen = $state(false)
  let removingDetail = $derived(pluriel('dialog.removeDetail', removing?.blocks.length ?? 0))
  function edit(next: Partial<Cycle>) { cycles = cycles.map((item) => item.id === cycle.id ? { ...item, ...next } : item) }
  function select(id: string) { activeId = id; block = 0 }
  function askCreate() { naming = { mode: 'create' }; nameDraft = uniqueName(t('cycles.newName'), cycles); nameOpen = true }
  function askRename(id: string) { naming = { mode: 'rename', id }; const target = cycles.find((item) => item.id === id); nameDraft = target ? nomDeCycle(target) : ''; nameOpen = true }
  function onNamed(name: string) {
    const request = naming; naming = null; if (!request) return
    if (request.mode === 'create') { const next: Cycle = { id: nextCycleId(cycles), name: uniqueName(name, cycles), blocks: [makeBlock('idle')] }; cycles = [...cycles, next]; select(next.id); return }
    const others = cycles.filter((item) => item.id !== request.id); const unique = uniqueName(name, others)
    cycles = cycles.map((item) => item.id === request.id ? { ...item, name: unique } : item)
  }
  function askRemove(id: string) { removing = cycles.find((item) => item.id === id) ?? null; confirmOpen = true }
  function onRemove() { const target = removing; removing = null; if (!target) return; const rest = cycles.filter((item) => item.id !== target.id); cycles = rest; if (target.id === activeId) select(rest[0]!.id) }
</script>

<div class="fixed inset-x-0 bottom-0 z-30 h-[var(--timeline)] px-6 pt-3 pb-5 max-lg:border-t max-lg:border-[var(--line)] max-lg:bg-[var(--paper)] max-lg:px-5 lg:right-[24.5rem] lg:left-[4.5rem]">
  <div class="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
    <span class="text-sm font-medium tabular-nums max-lg:hidden">{mmss(at)}</span>
    <button type="button" class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-sm transition hover:scale-105 active:scale-95" aria-label={playing ? t('timeline.pause') : t('timeline.play')} onclick={() => (playing = !playing)}>
      {#if !playing}<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.409 9.353c2.121 1.153 2.121 4.14 0 5.294L8.597 21.615C6.534 22.736 4 21.276 4 18.967V5.033c0-2.31 2.534-3.769 4.597-2.648l12.812 6.968Z"/></svg>{:else}<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><path d="M2 6c0-1.886 0-2.828.586-3.414C3.172 2 4.114 2 6 2s2.828 0 3.414.586C10 3.172 10 4.114 10 6v12c0 1.886 0 2.828-.586 3.414C8.828 22 7.886 22 6 22s-2.828 0-3.414-.586C2 20.828 2 19.886 2 18V6Z"/><path d="M14 6c0-1.886 0-2.828.586-3.414C15.172 2 16.114 2 18 2s2.828 0 3.414.586C22 3.172 22 4.114 22 6v12c0 1.886 0 2.828-.586 3.414C20.828 22 19.886 22 18 22s-2.828 0-3.414-.586C14 20.828 14 19.886 14 18V6Z"/></g></svg>{/if}
    </button><span class="text-sm tabular-nums text-[var(--muted)] max-lg:hidden">{mmss(total)}</span>
  </div>
  <div class="flex h-full flex-col gap-2 select-none">
    <div class="flex items-center justify-between gap-1"><CycleMenu bind:activeId {cycles} current={cycle} oncreate={askCreate} onrename={askRename} onremove={askRemove}/><button type="button" class="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[var(--ink)] pr-3.5 pl-3 text-sm font-medium text-[var(--paper)] shadow-sm transition hover:opacity-90 active:scale-95 max-sm:w-8 max-sm:justify-center max-sm:px-0" onclick={onexporter}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 15c0 2.828 0 4.243.879 5.121C4.757 21 6.172 21 9 21h6c2.828 0 4.243 0 5.121-.879C21 19.243 21 17.828 21 15"/><path d="M12 3v13m-4-4.375L12 16l4-4.375"/></g></svg><span class="max-sm:sr-only">{t('timeline.export')}</span></button></div>
    <TimelineTrack bind:block bind:zoom {blocks} {elapsed} {shape} {color} {expression} onblocks={(value: Block[]) => edit({ blocks: value })} onadd={(state: StateId) => edit({ blocks: blocksWith(blocks, state) })} onseek={onseek}/>
    <div class="flex shrink-0 items-center justify-end gap-4 max-sm:gap-2">
      <ZoomSlider {zoom} min={MIN_ZOOM} max={MAX_ZOOM} onzoom={(value) => (zoom = value)}/><p class="text-xs tabular-nums text-[var(--muted)]"><span class="text-[var(--ink)]">{mmss(at)}</span> / {mmss(total)}</p>
      <span class="group relative flex"><button type="button" class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]" aria-label={t('timeline.preview')} onclick={onpreview}><svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><path d="M9.75 12a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z"/><path fill-rule="evenodd" d="M2 12c0 1.639.425 2.192 1.275 3.296C4.972 17.5 7.818 20 12 20s7.028-2.5 8.725-4.704C21.575 14.192 22 13.639 22 12s-.425-2.192-1.275-3.296C19.028 6.5 16.182 4 12 4S4.972 6.5 3.275 8.704C2.425 9.808 2 10.361 2 12Zm10-3.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/></g></svg></button><span class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs whitespace-nowrap text-[var(--paper)] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100" role="tooltip">{t('timeline.preview')}</span></span>
    </div>
  </div>
  <NameDialog bind:open={nameOpen} bind:value={nameDraft} title={naming?.mode === 'rename' ? t('dialog.nameRenameTitle') : t('dialog.nameCreateTitle')} label={t('dialog.nameField')} submitLabel={naming?.mode === 'rename' ? t('dialog.nameRename') : t('dialog.nameCreate')} onsubmit={onNamed}/>
  <ConfirmDialog bind:open={confirmOpen} title={t('dialog.removeTitle', { name: removing ? nomDeCycle(removing) : '' })} detail={removingDetail} confirmLabel={t('dialog.removeConfirm')} onconfirm={onRemove}/>
</div>
