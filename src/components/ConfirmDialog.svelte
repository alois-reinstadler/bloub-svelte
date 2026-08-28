<script lang="ts">
  import { t } from '@/i18n'
  let { open = $bindable(), title, detail, confirmLabel, onconfirm }: {
    open: boolean; title: string; detail: string; confirmLabel: string; onconfirm: () => void
  } = $props()
  let dialog: HTMLDialogElement
  $effect(() => { if (!dialog) return; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close() })
  function confirm() { onconfirm(); open = false }
</script>
<dialog bind:this={dialog} class="dialogue m-auto w-80 rounded-2xl bg-white p-5 text-[var(--ink)] shadow-xl" aria-label={title} onclose={() => (open = false)} oncancel={(event) => { event.preventDefault(); open = false }}>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1"><h2 class="text-sm font-semibold">{title}</h2><p class="text-xs text-[var(--muted)]">{detail}</p></div>
    <div class="flex justify-end gap-2">
      <!-- svelte-ignore a11y_autofocus -->
      <button type="button" autofocus class="h-8 cursor-pointer rounded-lg px-3 text-xs text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)]" onclick={() => (open = false)}>{t('dialog.cancel')}</button>
      <button type="button" class="h-8 cursor-pointer rounded-lg bg-[var(--danger)] px-3 text-xs text-white transition hover:opacity-90 active:scale-95" onclick={confirm}>{confirmLabel}</button>
    </div>
  </div>
</dialog>
