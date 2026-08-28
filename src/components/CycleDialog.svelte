<script lang="ts">
  import { t } from '@/i18n'
  import { FONDS_GIF, FORMATS_CYCLE, cycleAccepteTransparence, videoPossible, type FondGif, type FormatCycle } from '@/ui/export'
  let { open = $bindable(), format = $bindable(), fond = $bindable(), avancement, erreur, onconfirm, onannuler }: {
    open: boolean; format: FormatCycle; fond: FondGif; avancement: number | null; erreur: boolean; onconfirm: () => void; onannuler: () => void
  } = $props()
  const formats = FORMATS_CYCLE.filter((item) => item !== 'mp4' || videoPossible())
  if (!formats.includes(format)) format = formats[0]!
  let busy = $derived(avancement !== null)
  let percent = $derived(Math.round((avancement ?? 0) * 100))
  let dialog: HTMLDialogElement
  $effect(() => { if (!dialog) return; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close() })
  function close() { if (busy) onannuler(); open = false }
</script>
<dialog bind:this={dialog} class="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl" aria-label={t('timeline.export')} onclose={() => (open = false)} oncancel={(event) => { event.preventDefault(); close() }}>
  <form class="flex flex-col gap-4" onsubmit={(event) => { event.preventDefault(); if (!busy) onconfirm() }}>
    <div class="flex flex-col gap-1"><h2 class="text-sm font-semibold">{t('timeline.export')}</h2><p class="text-xs text-[var(--muted)]">{t('export.cycleDetail')}</p></div>
    <fieldset class="flex flex-col gap-1" disabled={busy}><legend class="sr-only">{t('export.cycleFormat')}</legend>
      {#each formats as choice}<label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5"><input bind:group={format} type="radio" name="format" value={choice} class="accent-[var(--ink)]"/><span class="flex flex-col">{t(`export.cycle_${choice}`)}<span class="text-xs text-[var(--muted)]">{t(`export.cycle_${choice}_aide`)}</span></span></label>{/each}
    </fieldset>
    {#if cycleAccepteTransparence(format)}<fieldset class="flex flex-col gap-1" disabled={busy}><legend class="sr-only">{t('export.gifBackground')}</legend>{#each FONDS_GIF as choice}<label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5"><input bind:group={fond} type="radio" name="fondCycle" value={choice} class="accent-[var(--ink)]"/>{t(`export.fond_${choice}`)}</label>{/each}</fieldset>{/if}
    {#if erreur && !busy}<p class="text-xs text-[var(--danger)]" role="alert">{t('export.failed')}</p>{/if}
    {#if busy}
      <div class="flex flex-col gap-1.5"><div class="h-1.5 overflow-hidden rounded-full bg-black/10"><div class="h-full rounded-full bg-[var(--ink)]" style:width={`${percent}%`}></div></div><div class="flex items-center justify-between gap-2"><p class="text-xs tabular-nums text-[var(--muted)]">{t('export.cycleProgress')} {percent} %</p><button type="button" class="h-7 cursor-pointer rounded-lg px-2 text-xs text-[var(--muted)] hover:bg-black/5" onclick={close}>{t('dialog.cancel')}</button></div></div>
    {:else}
      <div class="flex justify-end gap-2"><button type="button" class="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] hover:bg-black/5" onclick={close}>{t('dialog.cancel')}</button><button type="submit" class="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)]">{erreur ? t('export.cycleReessayer') : t('export.gifConfirm')}</button></div>
    {/if}
  </form>
</dialog>
