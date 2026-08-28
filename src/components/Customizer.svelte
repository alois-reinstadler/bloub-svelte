<script lang="ts">
  import BotTile from './BotTile.svelte'
  import { EXPRESSIONS } from '@/bot/expressions'
  import { COLORS, SHAPES } from '@/bot/skins'
  import { t } from '@/i18n'

  let { shape = $bindable(), color = $bindable(), expression = $bindable() }: {
    shape: string
    color: string
    expression: string
  } = $props()
  const PREVIEW_AT = 1
</script>

<div>
  <h2 class="text-sm font-semibold">{t('panel.shape')}</h2>
  <div class="mt-2 grid grid-cols-4 gap-1.5">
    {#each SHAPES as item (item.id)}
      <BotTile label={t(`shapes.${item.id}`)} selected={item.id === shape} shape={item.id} {color} {expression} frozenAt={PREVIEW_AT} onclick={() => (shape = item.id)} />
    {/each}
  </div>

  <h2 class="mt-5 text-sm font-semibold">{t('panel.expression')}</h2>
  <div class="mt-2 grid grid-cols-4 gap-1.5">
    {#each EXPRESSIONS as item (item.id)}
      <BotTile label={t(`expressions.${item.id}`)} selected={item.id === expression} {shape} {color} expression={item.id} frozenAt={PREVIEW_AT} onclick={() => (expression = item.id)} />
    {/each}
  </div>

  <h2 class="mt-5 text-sm font-semibold">{t('panel.color')}</h2>
  <div class="mt-2 grid grid-cols-6 gap-1.5">
    {#each COLORS as item (item.id)}
      <button
        type="button"
        class="flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition {item.id === color ? 'border-[var(--ink)]' : 'border-transparent hover:border-[var(--line)]'}"
        aria-label={t(`colors.${item.id}`)}
        aria-pressed={item.id === color}
        onclick={() => (color = item.id)}
      >
        <span class="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset" style:background={item.hex}></span>
      </button>
    {/each}
  </div>
</div>
