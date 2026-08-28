<script lang="ts">
  import { tick } from 'svelte'
  import { t } from '@/i18n'
  let { open = $bindable(), value = $bindable(), title, label, submitLabel, onsubmit }: {
    open: boolean; value: string; title: string; label: string; submitLabel: string; onsubmit: (name: string) => void
  } = $props()
  let dialog: HTMLDialogElement
  let field: HTMLInputElement
  let draft = $state('')
  let wasOpen = false
  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
    if (open && !wasOpen) { draft = value; tick().then(() => field?.select()) }
    wasOpen = open
  })
  function submit() { const clean = draft.trim(); if (!clean) return field?.focus(); onsubmit(clean); open = false }
</script>
<dialog bind:this={dialog} class="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl" aria-label={title} onclose={() => (open = false)} oncancel={(event) => { event.preventDefault(); open = false }}>
  <form class="flex flex-col gap-4" onsubmit={(event) => { event.preventDefault(); submit() }}>
    <h2 class="text-sm font-semibold">{title}</h2>
    <label class="flex flex-col gap-1.5 text-xs text-[var(--muted)]">{label}<input bind:this={field} bind:value={draft} class="h-9 rounded-lg bg-black/5 px-2.5 text-sm text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]" type="text" maxlength="40" required /></label>
    <div class="flex justify-end gap-2">
      <button type="button" class="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]" onclick={() => (open = false)}>{t('dialog.cancel')}</button>
      <button type="submit" class="h-8 cursor-pointer rounded-lg bg-[var(--ink)] px-3 text-xs text-[var(--paper)] transition hover:opacity-90 active:scale-95">{submitLabel}</button>
    </div>
  </form>
</dialog>
