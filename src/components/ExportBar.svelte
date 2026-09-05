<script lang="ts">
  import { t } from '@/i18n'
  import { canCopy } from '@/ui/capture'
  import { ACTIONS, DEFAULT_ACTION, type ActionId, type ExportState } from '@/ui/export'
  let { etat, onexporter }: { etat: ExportState; onexporter: (id: ActionId) => void } = $props()
  let open = $state(false)
  let root: HTMLElement
  const actions = ACTIONS.filter((action) => action.mode !== 'copieImage' || canCopy())
  let busy = $derived(etat === 'occupe')
  let label = $derived(etat === 'exporte' ? t('export.done') : etat === 'copyImage' ? t('export.copied') : etat === 'erreur' ? t('export.failed') : t('export.action'))
  let confirmed = $derived(etat === 'exporte' || etat === 'copyImage')
  function launch(id: ActionId) { open = false; onexporter(id) }
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
  <div class="flex overflow-hidden rounded-xl bg-[var(--ink)] text-[var(--paper)] shadow-sm transition {busy ? 'opacity-60' : ''}">
    <button type="button" class="flex cursor-pointer items-center gap-2 py-2.5 pr-3 pl-3.5 text-sm font-medium transition hover:bg-white/10 disabled:cursor-default" disabled={busy} onclick={() => launch(DEFAULT_ACTION)}>
      {#if confirmed}<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5 10.5 14.5 15.5 9.5"/></g></svg>{:else}<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 15c0 2.828 0 4.243.879 5.121C4.757 21 6.172 21 9 21h6c2.828 0 4.243 0 5.121-.879C21 19.243 21 17.828 21 15"/><path d="M12 3v13m-4-4.375L12 16l4-4.375"/></g></svg>{/if}
      {label}
    </button>
    <div class="w-px self-stretch bg-current opacity-25"></div>
    <button type="button" class="flex cursor-pointer items-center px-2.5 transition hover:bg-white/10 disabled:cursor-default" disabled={busy} aria-label={t('export.more')} aria-haspopup="true" aria-expanded={open} onclick={() => (open = !open)}><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" class="transition-transform {open ? 'rotate-180' : ''}"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19 9-7 6-7-6"/></svg></button>
  </div>
  {#if open}
    <div class="absolute right-0 bottom-full z-10 mb-2 w-60 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1 shadow-lg">
      {#each actions as action (action.id)}
        <button type="button" class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-black/5 {action.id === 'copyImage' ? 'mt-1 border-t border-[var(--line)] pt-2.5' : ''}" onclick={() => launch(action.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" class="shrink-0 text-[var(--muted)]"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">{#if action.mode === 'copieImage' || action.mode === 'copyText'}<path d="M6 11c0-2.828 0-4.243.879-5.121C7.757 5 9.172 5 12 5h3c2.828 0 4.243 0 5.121.879C21 6.757 21 8.172 21 11v5c0 2.828 0 4.243-.879 5.121C19.243 22 17.828 22 15 22h-3c-2.828 0-4.243 0-5.121-.879C6 20.243 6 18.828 6 16v-5Z"/><path d="M6 19a3 3 0 0 1-3-3v-6c0-3.771 0-5.657 1.172-6.828C5.343 2 7.229 2 11 2h4a3 3 0 0 1 3 3"/>{:else}<path d="M3 15c0 2.828 0 4.243.879 5.121C4.757 21 6.172 21 9 21h6c2.828 0 4.243 0 5.121-.879C21 19.243 21 17.828 21 15"/><path d="M12 3v13m-4-4.375L12 16l4-4.375"/>{/if}</g></svg>
          {t(`export.${action.id}`)}
        </button>
      {/each}
    </div>
  {/if}
</div>
