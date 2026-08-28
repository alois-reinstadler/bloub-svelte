<script lang="ts">
  import type { Cycle } from '@/lib/internal/core/cycles'
  import { nomDeCycle, t } from '@/i18n'
  let { cycles, current, activeId = $bindable(), oncreate, onremove, onrename }: {
    cycles: Cycle[]; current: Cycle; activeId: string; oncreate: () => void; onremove: (id: string) => void; onrename: (id: string) => void
  } = $props()
  let open = $state(false)
  let root: HTMLElement
  function choose(id: string) { activeId = id; open = false }
  $effect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!root?.contains(event.target as Node)) open = false }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') open = false }
    window.addEventListener('pointerdown', outside)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape) }
  })
</script>
<div bind:this={root} class="relative">
  <button type="button" class="flex max-w-56 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm font-medium transition hover:bg-black/5" aria-haspopup="true" aria-expanded={open} title={nomDeCycle(current)} onclick={() => (open = !open)}><span class="tronque">{nomDeCycle(current)}</span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5l3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  {#if open}<div class="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
    {#each cycles as cycle (cycle.id)}<div class="group/row flex items-center gap-1">
      <button type="button" class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5" title={nomDeCycle(cycle)} onclick={() => choose(cycle.id)}><span class="w-3 shrink-0 text-[var(--ink)]">{cycle.id === activeId ? '✓' : ''}</span><span class="tronque">{nomDeCycle(cycle)}</span></button>
      <button type="button" class="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 focus-visible:opacity-100" aria-label={t('cycles.menuRenameAria', { name: nomDeCycle(cycle) })} onclick={() => { open = false; onrename(cycle.id) }}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M8.2 1.8 10.2 3.8 4.4 9.6 1.8 10.2 2.4 7.6z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg></button>
      {#if cycles.length > 1}<button type="button" class="mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/row:opacity-100 hover:bg-black/5 hover:text-[var(--danger)] focus-visible:opacity-100" aria-label={t('cycles.menuRemoveAria', { name: nomDeCycle(cycle) })} onclick={() => { open = false; onremove(cycle.id) }}><svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.8 3.9h8.4M5.5 3.9V2.7h3v1.2M4.1 3.9l.5 7.4h4.8l.5-7.4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button>{/if}
    </div>{/each}
    <div class="my-1 h-px bg-[var(--line)]"></div><button type="button" class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-black/5" onclick={() => { open = false; oncreate() }}><span class="w-3 shrink-0 text-[var(--muted)]">+</span>{t('cycles.menuNew')}</button>
  </div>{/if}
</div>
