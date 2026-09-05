<script lang="ts">
  import { formatPercentage, t } from '@/i18n'
  let { zoom, min, max, onzoom }: { zoom: number; min: number; max: number; onzoom: (value: number) => void } = $props()
  let percent = $derived(formatPercentage(zoom))
</script>
<div class="flex items-center gap-1.5">
  <span class="h-1 w-1 shrink-0 rounded-full bg-[var(--muted)]" aria-hidden="true"></span>
  <input id="timeline-zoom" name="timeline-zoom" type="range" class="h-1 w-28 cursor-pointer accent-[var(--ink)] max-sm:w-20" {min} {max} step="0.01" value={zoom} aria-label={t('timeline.zoom')} aria-valuetext={percent} oninput={(event) => onzoom(Number(event.currentTarget.value))}/>
  <span class="h-2 w-2 shrink-0 rounded-full bg-[var(--muted)]" aria-hidden="true"></span>
  <span class="w-11 text-left text-xs tabular-nums text-[var(--muted)]">{percent}</span>
</div>
