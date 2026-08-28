<script lang="ts">
  import BloubBot from './BloubBot.svelte'
  import { DEFAULT_EXPRESSION } from '@/bot/expressions'
  import { DEFAULT_COLOR, DEFAULT_SHAPE } from '@/bot/skins'
  import type { StateId } from '@/bot/states'

  interface Props {
    label: string
    selected: boolean
    frozenAt: number
    state?: StateId
    shape?: string
    color?: string
    expression?: string
    size?: number
    onclick?: (event: MouseEvent) => void
  }

  let {
    label,
    selected,
    frozenAt,
    state = 'idle',
    shape = DEFAULT_SHAPE,
    color = DEFAULT_COLOR,
    expression = DEFAULT_EXPRESSION,
    size = 60,
    onclick
  }: Props = $props()
</script>

<button
  type="button"
  class="flex cursor-pointer flex-col items-center rounded-xl border-2 p-1 transition {selected ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'}"
  aria-label={label}
  aria-pressed={selected}
  {onclick}
>
  <BloubBot {state} {size} {shape} {color} {expression} {frozenAt} />
  <span class="text-center text-xs leading-tight text-[var(--muted)]">{label}</span>
</button>
