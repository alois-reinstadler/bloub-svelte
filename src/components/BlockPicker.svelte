<script lang="ts">
  import BotTile from './BotTile.svelte'
  import { POSES, SEQUENCE, STATE_BY_ID, type StateId } from '@/lib/internal/core/states'
  import { t } from '@/i18n'
  let { shape, color, expression, onpick }: { shape: string; color: string; expression: string; onpick: (state: StateId) => void } = $props()
  const PALETTE = SEQUENCE.map((id) => STATE_BY_ID.get(id)!)
  const WIDTH = 288
  let trigger: HTMLButtonElement
  let panel: HTMLElement
  let position = $state('')
  let open = $state(false)
  function toggle() {
    if (!trigger || !panel) return
    if (panel.matches(':popover-open')) return panel.hidePopover()
    const rect = trigger.getBoundingClientRect()
    const left = Math.max(8, Math.min(rect.right - WIDTH, window.innerWidth - WIDTH - 8))
    position = `position:fixed;top:auto;right:auto;left:${left}px;bottom:${window.innerHeight - rect.top + 8}px`
    panel.showPopover()
  }
  function pick(state: StateId) { onpick(state); panel?.hidePopover() }
</script>
<button bind:this={trigger} type="button" class="flex h-full w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] text-lg leading-none text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--ink)]" aria-label={t('timeline.addAnimation')} aria-haspopup="true" aria-expanded={open} onclick={toggle}>+</button>
<div bind:this={panel} popover="auto" ontoggle={(event) => (open = event.newState === 'open')} class="m-0 w-72 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5" style={position}>
  <div class="grid grid-cols-4 gap-1.5">{#each PALETTE as item (item.id)}<BotTile label={t(`states.${item.id}`)} selected={false} state={item.id} {shape} {color} {expression} frozenAt={POSES[item.id]} onclick={() => pick(item.id)} />{/each}</div>
</div>
