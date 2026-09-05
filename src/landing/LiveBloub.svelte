<script lang="ts">
  import { onMount } from 'svelte'
  import { Bloub, type BloubProps } from '../lib'

  let { class: className = '', ...props }: BloubProps = $props()
  let host: HTMLDivElement
  let visible = $state(false)

  onMount(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
    }, { rootMargin: '80px' })
    observer.observe(host)
    return () => observer.disconnect()
  })
</script>

<div bind:this={host} class={className}>
  {#if visible}
    <Bloub {...props} />
  {:else}
    <Bloub {...props} frozenAt={1} />
  {/if}
</div>
