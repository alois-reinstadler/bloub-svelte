<script lang="ts">
  import { t } from '@/i18n'
  import { FONDS_GIF, type FondGif } from '@/ui/export'
  let { open = $bindable(), fond = $bindable(), onconfirm }: { open: boolean; fond: FondGif; onconfirm: () => void } = $props()
  let dialog: HTMLDialogElement
  $effect(() => { if (!dialog) return; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close() })
  function confirm() { onconfirm(); open = false }
</script>
<dialog bind:this={dialog} class="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl" aria-label={t('export.gifTitle')} onclose={() => (open = false)} oncancel={(event) => { event.preventDefault(); open = false }}>
  <form class="flex flex-col gap-4" onsubmit={(event) => { event.preventDefault(); confirm() }}>
    <div class="flex flex-col gap-1"><h2 class="text-sm font-semibold">{t('export.gifTitle')}</h2><p class="text-xs text-[var(--muted)]">{t('export.gifDetail')}</p></div>
    <fieldset class="flex flex-col gap-1"><legend class="sr-only">{t('export.gifBackground')}</legend>
      {#each FONDS_GIF as choice}
        <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-black/5"><input bind:group={fond} type="radio" name="fond" value={choice} class="accent-[var(--ink)]"/><span class="flex flex-col">{t(`export.fond_${choice}`)}<span class="text-xs text-[var(--muted)]">{t(`export.fond_${choice}_aide`)}</span></span></label>
      {/each}
    </fieldset>
    <div class="flex justify-end gap-2"><button type="button" class="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] hover:bg-black/5" onclick={() => (open = false)}>{t('dialog.cancel')}</button><button type="submit" class="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)]">{t('export.gifConfirm')}</button></div>
  </form>
</dialog>
